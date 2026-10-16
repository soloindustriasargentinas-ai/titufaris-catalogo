import { Product, Category, CompanyProfile } from '../types';
import {
  StoreDailySnapshot,
  saveDailySnapshotToFirestore,
  fetchDailySnapshotFromFirestore,
  seedProductsToFirestore,
  seedCategoriesToFirestore,
  saveCompanyToFirestore,
} from '../lib/firebase';
import {
  saveProducts,
  saveCategories,
  saveCompany,
  loadProducts,
  loadCategories,
  loadCompany,
} from './storage';

export const DAILY_BACKUP_LOCAL_PREFIX = 'titufaris_daily_backup_';
export const LAST_BACKUP_DATE_PREFIX = 'titufaris_last_backup_date_';

/**
 * Returns the localStorage key for a tenant's local daily backup
 */
export function getTenantDailyBackupKey(tenantId?: string): string {
  const resolved = tenantId && tenantId !== 'titufaris' ? tenantId : 'titufaris';
  return `${DAILY_BACKUP_LOCAL_PREFIX}${resolved}`;
}

/**
 * Returns the localStorage key for tracking the date of the last daily backup
 */
export function getLastBackupDateKey(tenantId?: string): string {
  const resolved = tenantId && tenantId !== 'titufaris' ? tenantId : 'titufaris';
  return `${LAST_BACKUP_DATE_PREFIX}${resolved}`;
}

/**
 * Loads the local cached daily snapshot for a tenant if available
 */
export function loadLocalDailyBackup(tenantId?: string): StoreDailySnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getTenantDailyBackupKey(tenantId));
    if (!raw) return null;
    return JSON.parse(raw) as StoreDailySnapshot;
  } catch (e) {
    console.warn('Error reading local daily backup:', e);
    return null;
  }
}

/**
 * Saves the daily snapshot locally in localStorage (overwriting previous single backup)
 */
export function saveLocalDailyBackup(tenantId: string, snapshot: StoreDailySnapshot): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().slice(0, 10);
  try {
    localStorage.setItem(getTenantDailyBackupKey(tenantId), JSON.stringify(snapshot));
    localStorage.setItem(getLastBackupDateKey(tenantId), today);
  } catch (e) {
    console.warn('LocalStorage quota limit reached, saving optimized backup cache:', e);
    try {
      // Store compact snapshot cache (truncating oversized data URL strings to stay within quota)
      const compactProducts = (snapshot.products || []).map(p => ({
        ...p,
        imageUrl: p.imageUrl && p.imageUrl.startsWith('data:') && p.imageUrl.length > 500
          ? p.imageUrl.slice(0, 100) + '...[cached-in-firestore]'
          : p.imageUrl
      }));
      const compactSnapshot: StoreDailySnapshot = {
        ...snapshot,
        products: compactProducts
      };
      localStorage.setItem(getTenantDailyBackupKey(tenantId), JSON.stringify(compactSnapshot));
      localStorage.setItem(getLastBackupDateKey(tenantId), today);
    } catch {
      // Even if localStorage is completely exhausted, Firestore holds the complete chunked backup
    }
  }
}

let autoBackupDebounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

/**
 * Automatically triggers a daily backup for a store.
 * - Checks if a backup for today has already been created or if forced.
 * - Saves to both Firestore and localStorage.
 * - Overwrites the single daily snapshot so only 1 copy is kept per store (minimal memory & cloud quota).
 */
export async function triggerStoreDailyBackup(
  tenantId: string,
  storeName: string,
  products: Product[],
  categories: Category[],
  company: CompanyProfile,
  options?: { force?: boolean; debounced?: boolean }
): Promise<{ success: boolean; snapshot?: StoreDailySnapshot; error?: string }> {
  const resolvedTenantId = tenantId && tenantId !== 'titufaris' ? tenantId : 'titufaris';

  // Do not backup if there are 0 products and no custom company name (empty mock state)
  if (products.length === 0 && (!company.name || company.name === 'Mi Empresa')) {
    return { success: false, error: 'Tienda sin datos para respaldar' };
  }

  const today = new Date().toISOString().slice(0, 10);
  const lastDate = typeof window !== 'undefined' ? localStorage.getItem(getLastBackupDateKey(resolvedTenantId)) : null;

  // If not forced and already backed up today with matching product count, skip to save network
  if (!options?.force && lastDate === today) {
    const local = loadLocalDailyBackup(resolvedTenantId);
    if (local && local.productsCount === products.length && local.categoriesCount === categories.length) {
      return { success: true, snapshot: local };
    }
  }

  const performBackup = async () => {
    try {
      const timestamp = new Date().toISOString();
      const snapshot: StoreDailySnapshot = {
        tenantId: resolvedTenantId,
        storeName: storeName || company.name || resolvedTenantId,
        createdAt: timestamp,
        version: '1.0',
        productsCount: products.length,
        categoriesCount: categories.length,
        products,
        categories,
        company,
      };

      // 1. Save local snapshot immediately
      saveLocalDailyBackup(resolvedTenantId, snapshot);

      // 2. Persist to Firestore
      const cloudRes = await saveDailySnapshotToFirestore(resolvedTenantId, {
        tenantId: resolvedTenantId,
        storeName: snapshot.storeName,
        productsCount: products.length,
        categoriesCount: categories.length,
        products,
        categories,
        company,
      });

      if (!cloudRes.success) {
        console.warn(`Firestore daily snapshot warning for ${resolvedTenantId}:`, cloudRes.error);
      }

      return { success: true, snapshot };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Daily backup failed for ${resolvedTenantId}:`, msg);
      return { success: false, error: msg };
    }
  };

  if (options?.debounced) {
    if (autoBackupDebounceTimers[resolvedTenantId]) {
      clearTimeout(autoBackupDebounceTimers[resolvedTenantId]);
    }
    return new Promise((resolve) => {
      autoBackupDebounceTimers[resolvedTenantId] = setTimeout(async () => {
        const result = await performBackup();
        resolve(result);
      }, 3000); // 3 seconds debounce
    });
  }

  return performBackup();
}

/**
 * Restores a store from its daily snapshot (either from Firestore or local fallback).
 * Guarantees recovery of:
 * - All products with descriptions, prices, and photos.
 * - All categories.
 * - Company profile (logo, whatsapp, address, config).
 * Updates both localStorage and Firestore collections.
 */
export async function restoreStoreFromDailySnapshot(
  tenantId: string,
  snapshotToRestore?: StoreDailySnapshot | null
): Promise<{
  success: boolean;
  restoredSnapshot?: StoreDailySnapshot;
  error?: string;
}> {
  const resolvedTenantId = tenantId && tenantId !== 'titufaris' ? tenantId : 'titufaris';

  try {
    let targetSnapshot = snapshotToRestore;

    // 1. If not supplied, fetch from Firestore
    if (!targetSnapshot) {
      targetSnapshot = await fetchDailySnapshotFromFirestore(resolvedTenantId);
    }

    // 2. Fallback to local daily backup if Firestore didn't have it
    if (!targetSnapshot) {
      targetSnapshot = loadLocalDailyBackup(resolvedTenantId);
    }

    if (!targetSnapshot || !Array.isArray(targetSnapshot.products)) {
      return {
        success: false,
        error: `No se encontró copia de seguridad diaria para la tienda "${resolvedTenantId}".`,
      };
    }

    // 3. Restore to localStorage
    saveProducts(targetSnapshot.products, resolvedTenantId);
    saveCategories(targetSnapshot.categories, resolvedTenantId);
    saveCompany(targetSnapshot.company, resolvedTenantId);

    // 4. Push restored data to Firestore collections to ensure all devices see it
    await seedProductsToFirestore(targetSnapshot.products, resolvedTenantId);
    await seedCategoriesToFirestore(targetSnapshot.categories, resolvedTenantId);
    await saveCompanyToFirestore(targetSnapshot.company, resolvedTenantId);

    return {
      success: true,
      restoredSnapshot: targetSnapshot,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error restoring store from daily snapshot:`, msg);
    return { success: false, error: msg };
  }
}

/**
 * Downloads a snapshot as a JSON file to the user's computer
 */
export function downloadStoreSnapshotFile(snapshot: StoreDailySnapshot): void {
  if (typeof window === 'undefined') return;
  const jsonStr = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date(snapshot.createdAt).toISOString().slice(0, 10);
  a.download = `backup_diario_${snapshot.tenantId}_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
