import { Product, Category, CompanyProfile, User, ActivityLog, PushNotification, Sale, SyncStatus, AppBackupData, ProductSpecification } from '../types';
import { initialProducts, initialCategories, initialCompany, initialUsers, initialActivityLogs, initialNotifications, initialSales, DEFAULT_INITIAL_PASSWORD } from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'titufaris_products_v1',
  CATEGORIES: 'titufaris_categories_v1',
  COMPANY: 'titufaris_company_v1',
  USERS: 'titufaris_users_v1',
  SALES: 'titufaris_sales_v1',
  LOGS: 'titufaris_activity_logs_v1',
  NOTIFICATIONS: 'titufaris_notifications_v1',
  ACTIVE_USER_ID: 'titufaris_active_user_id',
  SYNC_QUEUE: 'titufaris_sync_queue_v1',
  DELETED_PRODUCT_IDS: 'titufaris_deleted_product_ids_v1',
};

export function getDeletedProductIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_PRODUCT_IDS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function markProductAsDeleted(productId: string): void {
  try {
    const deleted = getDeletedProductIds();
    deleted.add(productId);
    localStorage.setItem(STORAGE_KEYS.DELETED_PRODUCT_IDS, JSON.stringify(Array.from(deleted)));
    idbSet(STORAGE_KEYS.DELETED_PRODUCT_IDS, Array.from(deleted)).catch(() => {});
  } catch (err) {
    console.warn('Error marking product as deleted:', err);
  }
}

export function unmarkProductAsDeleted(productId: string): void {
  try {
    const deleted = getDeletedProductIds();
    if (deleted.has(productId)) {
      deleted.delete(productId);
      localStorage.setItem(STORAGE_KEYS.DELETED_PRODUCT_IDS, JSON.stringify(Array.from(deleted)));
      idbSet(STORAGE_KEYS.DELETED_PRODUCT_IDS, Array.from(deleted)).catch(() => {});
    }
  } catch (err) {
    console.warn('Error unmarking product as deleted:', err);
  }
}

// Safe JSON parser
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
  } catch (err) {
    console.warn('Storage quota exceeded or error saving to localStorage:', err);
  }
}

// ==========================================
// IndexedDB High-Capacity Storage Engine
// (No 5MB quota limit - persists gigabytes safely)
// ==========================================
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
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export const FAKE_ITEMS_TO_PURGE = new Set([
  'prod-2',
  'prod-3',
  'prod-4',
  'prod-5',
  'prod-6',
  'prod-7',
  'prod-8',
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
  'prod-exh-rectangular'
]);

export function cleanProductList(list: Product[]): Product[] {
  const deletedIds = getDeletedProductIds();

  // Purge user-deleted items and fake/demo items
  const filtered = list.filter(
    p => p && p.id && !deletedIds.has(p.id) && !FAKE_ITEMS_TO_PURGE.has(p.id) && !FAKE_ITEMS_TO_PURGE.has(p.sku)
  );

  return filtered.map(p => {
    // Preserve exactly what the user configured without altering or constraining categories, specs, or images
    // If the product has images array with user-uploaded image(s), ensure imageUrl points to it
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

export async function syncProductsFromIndexedDB(): Promise<Product[] | null> {
  try {
    const idbProducts = await idbGet<Product[]>(STORAGE_KEYS.PRODUCTS);
    if (idbProducts && Array.isArray(idbProducts) && idbProducts.length > 0) {
      const cleaned = cleanProductList(idbProducts);
      await idbSet(STORAGE_KEYS.PRODUCTS, cleaned);
      return cleaned;
    }
  } catch {
    // ignore
  }
  return null;
}

export function loadProducts(): Product[] {
  const raw = safeGet<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts);
  const cleaned = cleanProductList(raw);
  saveProducts(cleaned);
  return cleaned;
}

export function saveProducts(products: Product[]): void {
  // 1. Persist asynchronously to unlimited-capacity IndexedDB
  idbSet(STORAGE_KEYS.PRODUCTS, products).catch(() => {});

  // 2. Persist synchronously to localStorage for immediate next-load
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.warn('LocalStorage quota limit reached, saving optimized copy in localStorage while IndexedDB retains full fidelity:', err);
    try {
      const optimized = products.map(p => ({
        ...p,
        images: p.images ? p.images.slice(0, 1) : [],
      }));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(optimized));
    } catch {
      // IndexedDB has already safely written the full product catalogue
    }
  }
}

export function loadCategories(): Category[] {
  const loaded = safeGet<Category[]>(STORAGE_KEYS.CATEGORIES, initialCategories);
  const validIds = new Set([
    'gondolas',
    'estanterias-metalicas',
    'racks-livianos',
    'racks-selectivos',
    'lockers-guardarropas',
    'otros-productos'
  ]);
  const hasInvalid = loaded.some(c => !validIds.has(c.id));
  const hasAll = validIds.size === loaded.length && loaded.every(c => validIds.has(c.id));
  if (hasInvalid || !hasAll) {
    safeSet(STORAGE_KEYS.CATEGORIES, initialCategories);
    return initialCategories;
  }
  return loaded;
}

export function saveCategories(categories: Category[]): void {
  safeSet(STORAGE_KEYS.CATEGORIES, categories);
}

export function loadCompany(): CompanyProfile {
  const comp = safeGet<CompanyProfile>(STORAGE_KEYS.COMPANY, initialCompany);
  if (comp.termsAndConditions && comp.termsAndConditions.includes('5 unidades')) {
    comp.termsAndConditions = comp.termsAndConditions.replace('5 unidades', '10 unidades');
    saveCompany(comp);
  }
  return comp;
}

export function saveCompany(company: CompanyProfile): void {
  safeSet(STORAGE_KEYS.COMPANY, company);
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

export function loadSales(): Sale[] {
  const loaded = safeGet<Sale[]>(STORAGE_KEYS.SALES, []);
  if (!loaded || loaded.length === 0) {
    return [];
  }
  // Strip out any legacy demo/mock sales
  const clean = loaded.filter(s => s && s.id && !s.id.startsWith('sale-init') && s.id !== 'sale-1789132222175');
  if (clean.length !== loaded.length) {
    safeSet(STORAGE_KEYS.SALES, clean);
  }
  return clean;
}

export function saveSales(sales: Sale[]): void {
  safeSet(STORAGE_KEYS.SALES, sales);
}

export function loadLogs(): ActivityLog[] {
  return safeGet<ActivityLog[]>(STORAGE_KEYS.LOGS, initialActivityLogs);
}

export function saveLogs(logs: ActivityLog[]): void {
  safeSet(STORAGE_KEYS.LOGS, logs);
}

export function loadNotifications(): PushNotification[] {
  return safeGet<PushNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
}

export function saveNotifications(notifs: PushNotification[]): void {
  safeSet(STORAGE_KEYS.NOTIFICATIONS, notifs);
}

export function getActiveUserId(): string {
  return safeGet<string>(STORAGE_KEYS.ACTIVE_USER_ID, 'usr-1');
}

export function setActiveUserId(id: string): void {
  safeSet(STORAGE_KEYS.ACTIVE_USER_ID, id);
}

// Queue for offline mutations
export interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: string;
}

export function getSyncQueue(): QueuedAction[] {
  return safeGet<QueuedAction[]>(STORAGE_KEYS.SYNC_QUEUE, []);
}

export function addToSyncQueue(action: Omit<QueuedAction, 'id' | 'timestamp'>): void {
  const queue = getSyncQueue();
  queue.push({
    id: 'sync-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    ...action
  });
  safeSet(STORAGE_KEYS.SYNC_QUEUE, queue);
}

export function clearSyncQueue(): void {
  safeSet(STORAGE_KEYS.SYNC_QUEUE, []);
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

