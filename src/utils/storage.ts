import { Product, Category, CompanyProfile, User, ActivityLog, PushNotification, Sale, SyncStatus, AppBackupData, ProductSpecification } from '../types';
import { initialProducts, initialCategories, initialCompany, initialUsers, initialActivityLogs, initialNotifications, initialSales, DEFAULT_INITIAL_PASSWORD } from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'titufaris_products_v2_35',
  CATEGORIES: 'titufaris_categories_v2_35',
  COMPANY: 'titufaris_company_v2_35',
  USERS: 'titufaris_users_v1',
  SALES: 'titufaris_sales_v1',
  LOGS: 'titufaris_activity_logs_v1',
  NOTIFICATIONS: 'titufaris_notifications_v1',
  ACTIVE_USER_ID: 'titufaris_active_user_id',
  SYNC_QUEUE: 'titufaris_sync_queue_v1',
  DELETED_PRODUCT_IDS: 'titufaris_deleted_product_ids_v1',
};

export function getDeletedProductIds(_tenantId?: string): Set<string> {
  return new Set();
}

export function markProductAsDeleted(_productId: string, _tenantId?: string): void {
  // 100% Cloud Architecture: deletions happen directly in Firestore
}

export function unmarkProductAsDeleted(_productId: string, _tenantId?: string): void {
  // 100% Cloud Architecture: no local deletion tombstones
}

// Safe JSON parser (used only for active user session ID)
function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

const IDB_NAME = 'titufaris_secure_db_v1';
const IDB_VERSION = 1;
const IDB_STORE = 'app_state';

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<boolean> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export const FAKE_ITEMS_TO_PURGE = new Set([
  'GON-CEN-160',
  'prod-2',
  'prod-3',
  'prod-4',
  'prod-5',
  'prod-6',
  'prod-7',
  'prod-8',
  'prod-9',
  'prod-10',
  'prod-11',
  'prod-12',
  'prod-13',
  'prod-14',
  'prod-15',
  'prod-16',
  'prod-17',
  'prod-18',
  'prod-19',
  'prod-20',
  'prod-21',
  'prod-22',
  'prod-23',
  'prod-24',
  'prod-25',
  'prod-26',
  'prod-27',
  'prod-28',
  'prod-29',
  'prod-30',
  'prod-31',
  'GON-MUR-220',
  'CHK-ERG-180',
  'VIT-LED-120',
  'REF-MUR-3P',
  'RCK-PES-300',
  'ACC-CAR-65L',
  'prod-exh-1',
  'prod-exh-2',
  'prod-exh-3',
  'prod-exh-4',
  'prod-exh-5',
  'EXH-GIR-M36',
  'EXH-PER-DBL',
  'EXH-PUN-180',
  'EXH-CAN-PRO',
  'EXH-ISL-ESC',
  'EXH-CIR-01',
  'prod-1789485237321',
  'TF-ART-771',
  'prod-1789083935100',
  'GCA160120438',
  'prod-1789085251166',
  'prod-1789085569254',
  'prod-1789086285593',
  'prod-1789086833816',
  'prod-1789087139929',
  'prod-1789087512284',
  'prod-1789088332499',
  'prod-1789092498179',
  'prod-exh-circular',
  'prod-exh-cuadrado',
  'prod-exh-minigondolita',
  'prod-exh-oval',
  'prod-exh-rectangular',
  'monche-estanteria-200-90-30',
  'monche-gondola-central-160',
  'monche-rack-minicarga-200',
  'monche-mostrador-caja-120'
]);

export function cleanProductList(list: Product[], _tenantId?: string): Product[] {
  const filtered = (list || []).filter(
    p => p && p.id && !FAKE_ITEMS_TO_PURGE.has(p.id) && !FAKE_ITEMS_TO_PURGE.has(p.sku)
  );

  return filtered.map(p => {
    const primaryImg = (p.images && p.images.length > 0 && p.images[0]) ? p.images[0] : (p.imageUrl || '');
    const finalImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : (primaryImg ? [primaryImg] : []);

    return {
      ...p,
      imageUrl: primaryImg,
      images: finalImages,
      category: p.category || 'otros-productos',
      isMadeToOrder: Boolean(p.isMadeToOrder),
      leadTimeDays: p.leadTimeDays !== undefined ? Number(p.leadTimeDays) : (p.isMadeToOrder ? 15 : 0),
      specifications: Array.isArray(p.specifications) ? p.specifications : []
    };
  });
}

export function getTenantStorageKey(baseKey: string, tenantId?: string): string {
  if (!tenantId || tenantId === 'titufaris') {
    return baseKey;
  }
  return `tenant_${tenantId}_${baseKey}`;
}

/**
 * Checks whether a CompanyProfile object contains outdated factory template placeholders
 * (such as the old +54 9 11 5824-9100 phone, Av. Juan B. Justo 4850, or supermarket aisle photo).
 */
export function isStalePlaceholderCompany(c: CompanyProfile | null | undefined, tenantId?: string): boolean {
  if (!c || !c.name) return true;
  if (
    c.phone === '+54 9 11 5824-9100' ||
    c.email === 'soloindustriasargentinas@gmail.com' ||
    c.email === 'ventas@titufaris.com.ar' ||
    c.legalName === 'Titufaris Soluciones Comerciales S.R.L.' ||
    c.taxId === '30-71548921-9' ||
    c.tagline === 'EQUIPAMIENTO COMERCIAL & LAYOUT' ||
    (c.address && c.address.includes('Juan B. Justo 4850')) ||
    (c.heroImageUrl && c.heroImageUrl.includes('photo-1578916171728-46686eac8d58')) ||
    (c.heroTitle && c.heroTitle.startsWith('Instalaciones comerciales e industriales:'))
  ) {
    return true;
  }
  if (!tenantId || tenantId === 'titufaris' || tenantId === 'moncheestanterias') {
    if (!c.heroImageUrl || !c.heroTitle) {
      return true;
    }
  }
  if (tenantId === 'zapas') {
    if (c.name.toLowerCase().includes('titufaris') || !c.logoUrl || c.phone === '+54 9 11 5829-4310') {
      return true;
    }
  }
  if (tenantId === 'claudia-soft') {
    if (c.phone === '+54 9 11 5829-4310' || c.email === 'contacto@claudia-soft.titufaris.online') {
      return true;
    }
  }
  return false;
}

export async function consumeLegacyLocalStoreData(_tenantId?: string): Promise<{
  legacyProducts: Product[];
  legacyCompany: CompanyProfile | null;
}> {
  return { legacyProducts: [], legacyCompany: null };
}

export async function purgeAllLocalCatalogStorage(_tenantId?: string): Promise<void> {
  // No-op: instant local cache is preserved and self-healed to guarantee 0ms page load
}

export async function syncProductsFromIndexedDB(tenantId?: string): Promise<Product[] | null> {
  const key = getTenantStorageKey(STORAGE_KEYS.PRODUCTS, tenantId);
  const stored = await idbGet<Product[]>(key);
  if (stored && Array.isArray(stored) && stored.length > 0) {
    return cleanProductList(stored, tenantId);
  }
  return null;
}

export async function syncCompanyFromIndexedDB(tenantId?: string): Promise<CompanyProfile | null> {
  const key = getTenantStorageKey(STORAGE_KEYS.COMPANY, tenantId);
  const stored = await idbGet<CompanyProfile>(key);
  if (stored && !isStalePlaceholderCompany(stored, tenantId)) {
    return stored;
  }
  return null;
}

import { getTenantDefaultData } from '../data/tenantPresetsData';

export function loadProducts(tenantId?: string, fallbackProducts?: Product[]): Product[] {
  const tenantDefault = tenantId ? getTenantDefaultData(tenantId) : null;
  const defaultFallback = tenantDefault ? tenantDefault.products : ((!tenantId || tenantId === 'titufaris') ? initialProducts : []);
  const fallback = fallbackProducts !== undefined ? fallbackProducts : defaultFallback;

  const key = getTenantStorageKey(STORAGE_KEYS.PRODUCTS, tenantId);
  const stored = safeGet<Product[] | null>(key, null);

  if (stored && Array.isArray(stored) && stored.length > 0) {
    const cleanedStored = cleanProductList(stored, tenantId);
    const cleanedFallback = cleanProductList(fallback, tenantId);

    // Self-heal: if stored catalog has fewer items than the official 35-item catalog (e.g. old 23 or 31 cached list),
    // merge missing official items immediately so 0ms render always shows all 35 products
    if (cleanedStored.length < cleanedFallback.length) {
      const map = new Map<string, Product>();
      for (const p of cleanedStored) {
        if (p && p.id) map.set(p.id, p);
      }
      for (const fp of cleanedFallback) {
        if (fp && fp.id && !map.has(fp.id)) {
          map.set(fp.id, fp);
        }
      }
      const healed = Array.from(map.values());
      safeSet(key, healed);
      return healed;
    }

    if (cleanedStored.length > 0) {
      return cleanedStored;
    }
  }

  return JSON.parse(JSON.stringify(cleanProductList(fallback, tenantId)));
}

export function saveProducts(products: Product[], tenantId?: string): void {
  if (!products || products.length === 0) return;
  const key = getTenantStorageKey(STORAGE_KEYS.PRODUCTS, tenantId);
  const cleaned = cleanProductList(products, tenantId);
  safeSet(key, cleaned);
  idbSet(key, cleaned).catch(() => {});
}

export function loadCategories(tenantId?: string, fallbackCategories?: Category[]): Category[] {
  const tenantDefault = tenantId ? getTenantDefaultData(tenantId) : null;
  const defaultFallback = tenantDefault ? tenantDefault.categories : initialCategories;
  const fallback = fallbackCategories !== undefined ? fallbackCategories : defaultFallback;

  const key = getTenantStorageKey(STORAGE_KEYS.CATEGORIES, tenantId);
  const stored = safeGet<Category[] | null>(key, null);
  if (stored && Array.isArray(stored) && stored.length > 0) {
    return stored;
  }

  return JSON.parse(JSON.stringify(fallback));
}

export function saveCategories(categories: Category[], tenantId?: string): void {
  if (!categories || categories.length === 0) return;
  const key = getTenantStorageKey(STORAGE_KEYS.CATEGORIES, tenantId);
  safeSet(key, categories);
  idbSet(key, categories).catch(() => {});
}

export function loadCompany(tenantId?: string, fallbackCompany?: CompanyProfile): CompanyProfile {
  const tenantDefault = tenantId ? getTenantDefaultData(tenantId) : null;
  const defaultFallback = tenantDefault ? tenantDefault.company : initialCompany;
  const fallback = fallbackCompany || defaultFallback;

  const key = getTenantStorageKey(STORAGE_KEYS.COMPANY, tenantId);
  const stored = safeGet<CompanyProfile | null>(key, null);

  if (stored && !isStalePlaceholderCompany(stored, tenantId)) {
    const healed = { ...fallback, ...stored };
    if (
      (!tenantId || tenantId === 'titufaris' || tenantId === 'moncheestanterias') &&
      healed.tagline === 'EQUIPAMIENTO COMERCIAL & LAYOUT'
    ) {
      healed.tagline = 'ESPACIOS QUE RINDEN - NEGOCIOS QUE CRECEN';
    }
    if (!healed.heroImageUrl && fallback.heroImageUrl) {
      healed.heroImageUrl = fallback.heroImageUrl;
    }
    if (tenantId === 'zapas' && !healed.logoUrl && fallback.logoUrl) {
      healed.logoUrl = fallback.logoUrl;
      healed.logo = fallback.logoUrl;
    }
    return healed;
  }

  const fresh = JSON.parse(JSON.stringify(fallback)) as CompanyProfile;
  safeSet(key, fresh);
  return fresh;
}

export function saveCompany(company: CompanyProfile, tenantId?: string): void {
  if (!company || !company.name || isStalePlaceholderCompany(company, tenantId)) return;
  const key = getTenantStorageKey(STORAGE_KEYS.COMPANY, tenantId);
  safeSet(key, company);
  idbSet(key, company).catch(() => {});
}

export const GENERIC_COMPANY_STORAGE_KEY = 'titufaris_generic_company_custom';

export function loadGenericCompany(fallback?: CompanyProfile): CompanyProfile {
  return fallback || initialCompany;
}

export function saveGenericCompany(_company: CompanyProfile): void {
  // no-op
}

export function loadUsers(): User[] {
  const users = safeGet<User[]>(STORAGE_KEYS.USERS, initialUsers);
  let changed = false;
  const sanitized = users.map(u => {
    let updated = { ...u };
    if (!updated.password) {
      updated.password = DEFAULT_INITIAL_PASSWORD;
      if (updated.mustChangePassword === undefined) {
        updated.mustChangePassword = true;
      }
      changed = true;
    }
    return updated;
  });
  if (changed) {
    saveUsers(sanitized);
  }
  return sanitized;
}

export function saveUsers(users: User[]): void {
  safeSet(STORAGE_KEYS.USERS, users);
}

export function loadSales(_tenantId?: string): Sale[] {
  return [];
}

export function saveSales(_sales: Sale[], _tenantId?: string): void {
  // 100% Cloud Architecture: sales are persisted in Firestore
}

export function loadLogs(_tenantId?: string): ActivityLog[] {
  return initialActivityLogs;
}

export function saveLogs(_logs: ActivityLog[], _tenantId?: string): void {
  // 100% Cloud Architecture: activity logs are persisted in Firestore
}

export function loadNotifications(_tenantId?: string): PushNotification[] {
  return initialNotifications;
}

export function saveNotifications(_notifs: PushNotification[], _tenantId?: string): void {
  // In-memory session notifications
}

export function getActiveUserId(): string {
  return safeGet<string>(STORAGE_KEYS.ACTIVE_USER_ID, 'usr-1');
}

export function setActiveUserId(id: string): void {
  safeSet(STORAGE_KEYS.ACTIVE_USER_ID, id);
}

// Queue for offline mutations (disabled in 100% cloud real-time mode)
export interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: string;
}

export function getSyncQueue(): QueuedAction[] {
  return [];
}

export function addToSyncQueue(_action: Omit<QueuedAction, 'id' | 'timestamp'>): void {
  // no-op in 100% Cloud mode
}

export function clearSyncQueue(): void {
  // no-op in 100% Cloud mode
}

// Currency formatter
export function formatCurrency(amount: number, symbol = '$'): string {
  return `${symbol} ${Number(amount || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

// Date formatter
export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

// ==========================================
// Copia de Seguridad: Generación y Descarga
// ==========================================

export function generateBackupData(
  products: Product[],
  categories: Category[],
  company: CompanyProfile,
  users?: User[],
  sales?: Sale[],
  activityLogs?: ActivityLog[]
): AppBackupData {
  return {
    app: 'Titufaris',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    totalProducts: products.length,
    products,
    categories,
    company,
    users,
    sales,
    activityLogs,
  };
}

export function downloadBackupJSONFile(backup: AppBackupData, customFileName?: string): void {
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const fileName = customFileName || `titufaris-respaldo-catalogo-${dateStr}.json`;

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseAndValidateBackup(jsonString: string): {
  valid: boolean;
  data?: AppBackupData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'El archivo no contiene un formato JSON válido.' };
    }

    // Check if products array exists
    if (!Array.isArray(parsed.products)) {
      return {
        valid: false,
        error: 'El archivo no contiene un listado de productos válido (propiedad "products").',
      };
    }

    // Minimum sanity checks for products
    for (let i = 0; i < Math.min(parsed.products.length, 5); i++) {
      const p = parsed.products[i];
      if (!p.id || !p.name) {
        return {
          valid: false,
          error: `Estructura de producto inválida en la posición ${i + 1}.`,
        };
      }
    }

    const backupData: AppBackupData = {
      app: parsed.app || 'Titufaris',
      version: parsed.version || '1.0',
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      totalProducts: parsed.products.length,
      products: parsed.products,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      company: parsed.company || initialCompany,
      users: Array.isArray(parsed.users) ? parsed.users : undefined,
      sales: Array.isArray(parsed.sales) ? parsed.sales : undefined,
      activityLogs: Array.isArray(parsed.activityLogs) ? parsed.activityLogs : undefined,
    };

    return { valid: true, data: backupData };
  } catch (err) {
    return {
      valid: false,
      error: `Error al procesar el archivo: ${err instanceof Error ? err.message : 'JSON malformado'}`,
    };
  }
}

