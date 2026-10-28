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
export function loadLocalDailyBackup(_tenantId?: string): StoreDailySnapshot | null {
  return null;
}

export function saveLocalDailyBackup(_tenantId: string, _snapshot: StoreDailySnapshot): void {
  // 100% Cloud Architecture: no local storage backup cache
}

let autoBackupDebounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
let lastCloudBackupSignature: Record<string, string> = {};

/**
 * Automatically triggers a cloud backup snapshot for a store in Firestore.
 * Overwrites the single cloud snapshot per store (`snapshots/snapshot_{tenantId}`).
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

  if (products.length === 0 && (!company.name || company.name === 'Mi Empresa')) {
    return { success: false, error: 'Tienda sin datos para respaldar' };
  }

  const today = new Date().toISOString().slice(0, 10);
  const signature = `${today}_${products.length}_${categories.length}_${company.updatedAt || ''}`;

  if (!options?.force && lastCloudBackupSignature[resolvedTenantId] === signature) {
    return { success: true };
  }

  const performBackup = async () => {
    try {
      const timestamp = new Date().toISOString();
      const snapshot: StoreDailySnapshot = {
        tenantId: resolvedTenantId,
        storeName: storeName || company.name || resolvedTenantId,
        createdAt: timestamp,
        version: '2.0',
        productsCount: products.length,
        categoriesCount: categories.length,
        products,
        categories,
        company,
      };

      const cloudRes = await saveDailySnapshotToFirestore(resolvedTenantId, {
        tenantId: resolvedTenantId,
        storeName: snapshot.storeName,
        productsCount: products.length,
        categoriesCount: categories.length,
        products,
        categories,
        company,
      });

      if (cloudRes.success) {
        lastCloudBackupSignature[resolvedTenantId] = signature;
      } else {
        console.warn(`Firestore daily snapshot warning for ${resolvedTenantId}:`, cloudRes.error);
      }

      return { success: cloudRes.success, snapshot, error: cloudRes.error };
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
      }, 3000);
    });
  }

  return performBackup();
}

/**
 * Restores a store directly from its Firestore cloud snapshot.
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

    if (!targetSnapshot) {
      targetSnapshot = await fetchDailySnapshotFromFirestore(resolvedTenantId);
    }

    if (!targetSnapshot || !Array.isArray(targetSnapshot.products)) {
      return {
        success: false,
        error: `No se encontró copia de seguridad en la nube para la tienda "${resolvedTenantId}".`,
      };
    }

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
