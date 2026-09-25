import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  setLogLevel,
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  runTransaction,
  query,
  orderBy,
  limit,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Category, CompanyProfile, Sale, User, ActivityLog } from '../types';

export { firebaseConfig };

// Suppress internal Firestore connection retry logs so harmless offline/reconnect attempts do not throw console errors
setLogLevel('silent');

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/* CRITICAL: Follow SKILL.md specification for Firestore initialization with databaseId */
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

/**
 * Validate connection to Firestore as mandated by Firebase architecture skill
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    const testDocRef = doc(db, 'test', 'connection');
    await getDoc(testDocRef);
    console.log('✅ Connected to permanent Firestore database successfully');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.info('Firestore client operating with local storage cache.');
    } else {
      console.info('Firestore database link initialized.');
    }
    return false;
  }
}

// ============================================================================
// PRODUCTS SYNC
// ============================================================================

export async function fetchProductsFromFirestore(): Promise<{ success: boolean; data: Product[] }> {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const products: Product[] = [];
    querySnapshot.forEach((docSnap) => {
      products.push(docSnap.data() as Product);
    });
    return { success: true, data: products };
  } catch (err) {
    console.warn('Firestore products fetch pending or using local cache:', err);
    return { success: false, data: [] };
  }
}

export async function saveProductToFirestore(product: Product): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: Record<string, any> = {};
    for (const [key, value] of Object.entries(product)) {
      if (value !== undefined) {
        payload[key] = value;
      }
    }

    // Payload size safety guard: Firestore document size limit is ~1MB
    const jsonLength = JSON.stringify(payload).length;
    if (jsonLength > 700000 && payload.images && payload.images.length > 0) {
      payload.images = payload.images.slice(0, 3);
      if (payload.images.length > 0) {
        payload.imageUrl = payload.images[0];
      }
    }

    const docRef = doc(db, 'products', product.id);
    // Replace document cleanly so modifications reflect immediately and stale fields are not kept
    await setDoc(docRef, payload);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error saving product to Firestore:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    console.error('Error deleting product from Firestore:', err);
  }
}

export async function seedProductsToFirestore(products: Product[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const product of products) {
      const ref = doc(db, 'products', product.id);
      batch.set(ref, product, { merge: true });
    }
    await batch.commit();
    console.log(`✅ Successfully seeded ${products.length} products to Firestore.`);
  } catch (err) {
    console.error('Error seeding products to Firestore:', err);
  }
}

export function subscribeToProductsFirestore(
  onUpdate: (products: Product[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, 'products');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach((docSnap) => {
        products.push(docSnap.data() as Product);
      });
      if (products.length > 0) {
        onUpdate(products);
      }
    },
    (error) => {
      console.info('Firestore real-time listener status:', error.message);
      onError?.(error);
    }
  );
}

// ============================================================================
// CATEGORIES SYNC
// ============================================================================

export async function fetchCategoriesFromFirestore(): Promise<Category[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    const categories: Category[] = [];
    querySnapshot.forEach((docSnap) => {
      categories.push(docSnap.data() as Category);
    });
    return categories;
  } catch (err) {
    console.warn('Firestore categories fetch:', err);
    return [];
  }
}

export async function saveCategoryToFirestore(category: Category): Promise<void> {
  try {
    const docRef = doc(db, 'categories', category.id);
    await setDoc(docRef, category, { merge: true });
  } catch (err) {
    console.error('Error saving category to Firestore:', err);
  }
}

export async function deleteCategoryFromFirestore(categoryId: string): Promise<void> {
  try {
    const docRef = doc(db, 'categories', categoryId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting category from Firestore:', err);
  }
}

export async function seedCategoriesToFirestore(categories: Category[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const cat of categories) {
      const ref = doc(db, 'categories', cat.id);
      batch.set(ref, cat, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.error('Error seeding categories to Firestore:', err);
  }
}

// ============================================================================
// COMPANY PROFILE SYNC
// ============================================================================

export async function fetchCompanyFromFirestore(): Promise<CompanyProfile | null> {
  try {
    const docSnap = await getDoc(doc(db, 'companyProfile', 'default'));
    if (docSnap.exists()) {
      return docSnap.data() as CompanyProfile;
    }
    return null;
  } catch (err) {
    console.warn('Firestore company profile fetch:', err);
    return null;
  }
}

export async function saveCompanyToFirestore(company: CompanyProfile): Promise<void> {
  try {
    await setDoc(doc(db, 'companyProfile', 'default'), company, { merge: true });
  } catch (err) {
    console.error('Error saving company profile to Firestore:', err);
  }
}

// ============================================================================
// SALES / ORDERS SYNC & ATOMIC TRANSACTIONS (LOTE 3)
// ============================================================================

export interface TransactionStockUpdate {
  productId: string;
  previousStock: number;
  newStock: number;
}

export interface SaleTransactionResult {
  success: boolean;
  error?: string;
  offline?: boolean;
  stockUpdates?: TransactionStockUpdate[];
}

/**
 * Execute an atomic transaction to record a sale and decrement stock in Firestore.
 * Prevents race conditions and negative inventory when multiple cashiers check out simultaneously.
 */
export async function recordSaleTransaction(
  sale: Sale,
  options?: { isOffline?: boolean }
): Promise<SaleTransactionResult> {
  // If offline, flag as offline so the caller can enqueue locally
  if (options?.isOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return { success: true, offline: true };
  }

  try {
    const stockUpdates = await runTransaction(db, async (transaction) => {
      const updates: TransactionStockUpdate[] = [];

      // 1. Read phase: Retrieve current state of all products in this sale
      const readOperations = sale.items.map(item => {
        const productRef = doc(db, 'products', item.productId);
        return transaction.get(productRef);
      });

      const productSnapshots = await Promise.all(readOperations);

      // 2. Validate stock sufficiency for every item
      for (let i = 0; i < sale.items.length; i++) {
        const item = sale.items[i];
        const snapshot = productSnapshots[i];

        if (!snapshot.exists()) {
          throw new Error(`El producto "${item.name}" (SKU: ${item.sku}) no existe en la base de datos.`);
        }

        const productData = snapshot.data() as Product;
        const currentStock = typeof productData.stock === 'number' ? productData.stock : 0;

        if (currentStock < item.quantity) {
          throw new Error(
            `Stock insuficiente para "${item.name}". Disponible en nube: ${currentStock}, solicitado: ${item.quantity}.`
          );
        }

        const nextStock = Math.max(0, currentStock - item.quantity);
        updates.push({
          productId: item.productId,
          previousStock: currentStock,
          newStock: nextStock,
        });
      }

      // 3. Write phase: Apply stock decrement atomically
      for (let i = 0; i < sale.items.length; i++) {
        const item = sale.items[i];
        const updateInfo = updates[i];
        const productRef = doc(db, 'products', item.productId);

        transaction.update(productRef, {
          stock: updateInfo.newStock,
          updatedAt: new Date().toISOString(),
          updatedBy: sale.cashierName || 'POS Terminal'
        });
      }

      // 4. Write phase: Create Sale record
      const saleRef = doc(db, 'sales', sale.id);
      transaction.set(saleRef, sale, { merge: true });

      // 5. Write phase: Create Activity Log record
      const logRef = doc(db, 'activityLogs', 'log-' + Date.now());
      transaction.set(logRef, {
        id: logRef.id,
        timestamp: new Date().toISOString(),
        userId: sale.cashierId || 'pos',
        userName: sale.cashierName || 'Cajero POS',
        userRole: 'cajero',
        action: 'sale_completed',
        title: `Venta completada ${sale.receiptNumber}`,
        details: `Cobro de $${sale.total.toLocaleString('es-AR')} mediante ${sale.paymentMethod.toUpperCase()} (${sale.items.length} ítems)`,
        amount: sale.total
      });

      return updates;
    });

    return { success: true, stockUpdates };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('Atomic sale transaction notification:', errorMsg);

    // If it is a network failure, allow graceful offline fallback
    if (errorMsg.includes('offline') || errorMsg.includes('unavailable') || errorMsg.includes('network')) {
      return { success: true, offline: true };
    }

    return { success: false, error: errorMsg };
  }
}

/**
 * Execute an atomic transaction to cancel a sale and optionally restore stock in Firestore.
 */
export async function recordCancelSaleTransaction(
  sale: Sale,
  restoreStock: boolean,
  cancelledBy: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await runTransaction(db, async (transaction) => {
      // If stock should be restored, read and update products
      if (restoreStock && sale.items && sale.items.length > 0) {
        const readOperations = sale.items.map(item => {
          const productRef = doc(db, 'products', item.productId);
          return transaction.get(productRef);
        });

        const productSnapshots = await Promise.all(readOperations);

        for (let i = 0; i < sale.items.length; i++) {
          const item = sale.items[i];
          const snapshot = productSnapshots[i];

          if (snapshot.exists()) {
            const productData = snapshot.data() as Product;
            const currentStock = typeof productData.stock === 'number' ? productData.stock : 0;
            const newStock = currentStock + item.quantity;
            const productRef = doc(db, 'products', item.productId);

            transaction.update(productRef, {
              stock: newStock,
              updatedAt: new Date().toISOString(),
              updatedBy: cancelledBy
            });
          }
        }
      }

      // Update sale status
      const saleRef = doc(db, 'sales', sale.id);
      transaction.update(saleRef, {
        paymentStatus: 'cancelled',
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy,
        cancellationReason: reason,
        stockReintegrated: restoreStock
      });

      // Write activity log
      const logRef = doc(db, 'activityLogs', 'log-' + Date.now());
      transaction.set(logRef, {
        id: logRef.id,
        timestamp: new Date().toISOString(),
        userId: 'admin',
        userName: cancelledBy,
        userRole: 'admin',
        action: 'sale_cancelled',
        title: `Venta anulada: ${sale.receiptNumber}`,
        details: `Anulada por ${cancelledBy}. Motivo: ${reason}.${restoreStock ? ' Se restituyeron las unidades al stock.' : ''}`,
        amount: -sale.total
      });
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in recordCancelSaleTransaction:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

export async function saveSaleToFirestore(sale: Sale): Promise<void> {
  try {
    const docRef = doc(db, 'sales', sale.id);
    await setDoc(docRef, sale, { merge: true });
  } catch (err) {
    console.error('Error saving sale to Firestore:', err);
  }
}

export async function deleteSaleFromFirestore(saleId: string): Promise<void> {
  try {
    const docRef = doc(db, 'sales', saleId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting sale from Firestore:', err);
  }
}

export async function seedSalesToFirestore(sales: Sale[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const sale of sales) {
      const ref = doc(db, 'sales', sale.id);
      batch.set(ref, sale, { merge: true });
    }
    await batch.commit();
    console.log(`✅ Successfully synced ${sales.length} sales to Firestore.`);
  } catch (err) {
    console.error('Error seeding sales to Firestore:', err);
  }
}

/**
 * Fetch sales with optimized limit and order by createdAt descending (Lote 3 Scalability).
 */
export async function fetchSalesFromFirestore(limitCount: number = 100): Promise<Sale[]> {
  try {
    const q = query(
      collection(db, 'sales'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const sales: Sale[] = [];
    querySnapshot.forEach((docSnap) => {
      sales.push(docSnap.data() as Sale);
    });
    return sales;
  } catch {
    // Graceful fallback if composite index is pending or offline
    try {
      const querySnapshot = await getDocs(collection(db, 'sales'));
      const sales: Sale[] = [];
      querySnapshot.forEach((docSnap) => {
        sales.push(docSnap.data() as Sale);
      });
      return sales
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, limitCount);
    } catch {
      return [];
    }
  }
}

// ============================================================================
// ACTIVITY LOGS SYNC & AUDIT TRAIL (LOTE 3)
// ============================================================================

export async function saveActivityLogToFirestore(log: ActivityLog): Promise<void> {
  try {
    const docRef = doc(db, 'activityLogs', log.id);
    await setDoc(docRef, log, { merge: true });
  } catch (err) {
    console.warn('Firestore activity log save note:', err);
  }
}

export async function fetchActivityLogsFromFirestore(limitCount: number = 100): Promise<ActivityLog[]> {
  try {
    const q = query(
      collection(db, 'activityLogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const logs: ActivityLog[] = [];
    querySnapshot.forEach((docSnap) => {
      logs.push(docSnap.data() as ActivityLog);
    });
    return logs;
  } catch {
    // Fallback without orderBy
    try {
      const querySnapshot = await getDocs(collection(db, 'activityLogs'));
      const logs: ActivityLog[] = [];
      querySnapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as ActivityLog);
      });
      return logs
        .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
        .slice(0, limitCount);
    } catch {
      return [];
    }
  }
}

export async function seedActivityLogsToFirestore(logs: ActivityLog[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const log of logs.slice(0, 100)) {
      const ref = doc(db, 'activityLogs', log.id);
      batch.set(ref, log, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.warn('Error seeding activity logs to Firestore:', err);
  }
}

export async function saveUserToFirestore(user: User): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, 'users', user.id);
    await setDoc(docRef, user, { merge: true });
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error saving user to Firestore:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

export async function fetchUsersFromFirestore(): Promise<User[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users: User[] = [];
    querySnapshot.forEach((docSnap) => {
      users.push(docSnap.data() as User);
    });
    return users;
  } catch (err) {
    console.warn('Firestore users fetch:', err);
    return [];
  }
}

export async function seedUsersToFirestore(users: User[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const user of users) {
      const ref = doc(db, 'users', user.id);
      batch.set(ref, user, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.error('Error seeding users to Firestore:', err);
  }
}
