import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import {
  Search,
  Filter,
  Layers,
  Tag,
  AlertTriangle,
  Grid,
  List,
  Plus,
  FolderPlus,
  Download,
  Barcode,
  QrCode,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Info,
  Copy,
  Trash2,
  Edit3,
  ArrowUpDown,
  Move,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Check,
  RotateCcw,
} from 'lucide-react';

import {
  Product,
  Category,
  CompanyProfile,
  User,
  Sale,
  ActivityLog,
  PushNotification,
  CartItem,
  SyncStatus,
  AppBackupData,
} from './types';

import {
  loadProducts,
  saveProducts,
  cleanProductList,
  syncProductsFromIndexedDB,
  loadCategories,
  saveCategories,
  loadCompany,
  saveCompany,
  loadUsers,
  saveUsers,
  loadSales,
  saveSales,
  loadLogs,
  saveLogs,
  loadNotifications,
  saveNotifications,
  getActiveUserId,
  setActiveUserId,
  formatCurrency,
  addToSyncQueue,
  clearSyncQueue,
  getSyncQueue,
  markProductAsDeleted,
  unmarkProductAsDeleted,
} from './utils/storage';
import { initialCategories } from './data/initialData';

import {
  validateFirestoreConnection,
  fetchProductsFromFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  seedProductsToFirestore,
  subscribeToProductsFirestore,
  fetchCategoriesFromFirestore,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  seedCategoriesToFirestore,
  fetchCompanyFromFirestore,
  saveCompanyToFirestore,
  saveSaleToFirestore,
  fetchSalesFromFirestore,
  deleteSaleFromFirestore,
  seedSalesToFirestore,
  recordSaleTransaction,
  recordCancelSaleTransaction,
  saveActivityLogToFirestore,
  fetchActivityLogsFromFirestore,
  seedActivityLogsToFirestore,
  fetchUsersFromFirestore,
  saveUserToFirestore,
  seedUsersToFirestore,
} from './lib/firebase';

import { Navbar } from './components/Navbar';
import { PublicNavbar } from './components/PublicNavbar';
import { PublicStoreView } from './components/PublicStoreView';
import { CustomerCartDrawer } from './components/CustomerCartDrawer';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductFormModal } from './components/ProductFormModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ConfirmDeleteCategoryModal } from './components/ConfirmDeleteCategoryModal';
import { QRCodeModal } from './components/QRCodeModal';
import { PaymentModal } from './components/PaymentModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { OfflineBanner } from './components/OfflineBanner';
import { AuthLoginModal } from './components/AuthLoginModal';
import { UnderConstructionModal } from './components/UnderConstructionModal';

// Code-split heavy views and administrative modals with React.lazy
const CategoryManagerModal = lazy(() => import('./components/CategoryManagerModal').then(m => ({ default: m.CategoryManagerModal })));
const POSView = lazy(() => import('./components/POSView').then(m => ({ default: m.POSView })));
const ExportModal = lazy(() => import('./components/ExportModal').then(m => ({ default: m.ExportModal })));
const AdminUsersModal = lazy(() => import('./components/AdminUsersModal').then(m => ({ default: m.AdminUsersModal })));
const ActivityReportsView = lazy(() => import('./components/ActivityReportsView').then(m => ({ default: m.ActivityReportsView })));
const CompanySettingsModal = lazy(() => import('./components/CompanySettingsModal').then(m => ({ default: m.CompanySettingsModal })));
const BackupRestoreModal = lazy(() => import('./components/BackupRestoreModal').then(m => ({ default: m.BackupRestoreModal })));
const RecoveryModal = lazy(() => import('./components/RecoveryModal').then(m => ({ default: m.RecoveryModal })));
const LegalNoticeModal = lazy(() => import('./components/LegalNoticeModal').then(m => ({ default: m.LegalNoticeModal })));
const WhatsAppCatalogModal = lazy(() => import('./components/WhatsAppCatalogModal').then(m => ({ default: m.WhatsAppCatalogModal })));
const GoogleMerchantModal = lazy(() => import('./components/GoogleMerchantModal').then(m => ({ default: m.GoogleMerchantModal })));

import { CookieConsentBanner } from './components/CookieConsentBanner';
import { LegalTab } from './components/LegalNoticeModal';
import { CartConfirmationToast } from './components/CartConfirmationToast';
import { useCart } from './hooks/useCart';
import { useCatalogFilter } from './hooks/useCatalogFilter';
import { playBeep, playSuccessChime, playWarningAlert } from './utils/audio';
import { scanBrowserForLostProducts } from './utils/recovery';
import { syncSingleProductToMetaCatalog, deleteProductFromMetaCatalog } from './utils/metaCatalogApi';

export default function App() {
  // Main State
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [categories, setCategories] = useState<Category[]>(loadCategories);
  const [company, setCompany] = useState<CompanyProfile>(loadCompany);
  const [users, setUsers] = useState<User[]>(loadUsers);
  const [sales, setSales] = useState<Sale[]>(loadSales);
  const [logs, setLogs] = useState<ActivityLog[]>(loadLogs);
  const [notifications, setNotifications] = useState<PushNotification[]>(loadNotifications);

  // Active User & Authentication State
  const [activeUserId, setActiveUserIdState] = useState<string>(getActiveUserId);
  const currentUser = users.find(u => u.id === activeUserId) || users[0];
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(false);
  const [isAuthLoginModalOpen, setIsAuthLoginModalOpen] = useState<boolean>(false);
  const [isConstructionModalOpen, setIsConstructionModalOpen] = useState<boolean>(false);
  const [scannedQrProduct, setScannedQrProduct] = useState<Product | null>(null);

  // Views & Tabs
  const [appMode, setAppMode] = useState<'store' | 'staff'>('store');
  const [isCustomerCartOpen, setIsCustomerCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'pos' | 'reports'>('catalog');

  // Custom Hooks (Decoupled Architecture - Lote 2)
  const {
    cart,
    setCart,
    posDiscount,
    setPosDiscount,
    cartToast,
    clearCartToast,
    handleAddToCart,
    handleUpdateCartQty,
    handleRemoveCartItem,
    handleClearCart,
    removeByProductId,
    cartItemCount,
    cartSubtotal,
    cartDiscountAmount,
    cartTotal,
  } = useCart();

  const {
    viewLayout,
    setViewLayout,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    stockFilter,
    setStockFilter,
    displayPriceType,
    setDisplayPriceType,
    isReorderMode,
    setIsReorderMode,
    catalogSortOrder,
    setCatalogSortOrder,
    filteredProducts,
    storeFilteredProducts,
  } = useCatalogFilter(products);

  // Network & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getSyncQueue().length);

  // Modals & Drawers
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isWhatsAppCatalogModalOpen, setIsWhatsAppCatalogModalOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [autoRecoveredCount, setAutoRecoveredCount] = useState<number>(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('terms');

  const handleOpenLegalModal = (tab: LegalTab = 'terms') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  // Catalog Reordering & Drag-and-Drop States
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const [dropTargetProductId, setDropTargetProductId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerCloudSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Deep link query check for QR codes and direct product URLs (?view=product&id=... or &sku=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const prodId = urlParams.get('id');
      const sku = urlParams.get('sku');
      if (prodId || sku) {
        const found = products.find(p => (prodId && p.id === prodId) || (sku && p.sku === sku));
        if (found) {
          setDetailProduct(found);
        }
      }
    } catch {
      // Safe catch
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reactive QR scan / deep link handler: opens product as soon as products list is synced from DB
  const hasProcessedDeepLinkRef = useRef(false);
  useEffect(() => {
    if (products.length === 0 || hasProcessedDeepLinkRef.current) return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const prodId = urlParams.get('id');
      const sku = urlParams.get('sku');
      if (prodId || sku) {
        const found = products.find(
          p => (prodId && p.id === prodId) || (sku && p.sku.toLowerCase() === sku.toLowerCase())
        );
        if (found) {
          setDetailProduct(found);
          hasProcessedDeepLinkRef.current = true;
        }
      }
    } catch {
      // Safe catch
    }
  }, [products]);

  // Sync from high-capacity IndexedDB and Firebase Firestore on startup
  useEffect(() => {
    // 1. First sync from IndexedDB
    syncProductsFromIndexedDB().then(idbProducts => {
      if (idbProducts && Array.isArray(idbProducts) && idbProducts.length > 0) {
        setProducts(idbProducts);
      }
    });

    // 2. Validate Firestore connection & synchronize strictly with cloud database
    validateFirestoreConnection().then(async () => {
      try {
        const response = await fetchProductsFromFirestore();
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          const cleaned = cleanProductList(response.data);
          setProducts(cleaned);
          saveProducts(cleaned);
          setSyncStatus('synced');
        }

        // Sync categories from cloud ensuring strictly the 6 defined categories exist
        const remoteCategories = await fetchCategoriesFromFirestore();
        const validCategoryIds = new Set([
          'gondolas',
          'estanterias-metalicas',
          'racks-livianos',
          'racks-selectivos',
          'lockers-guardarropas',
          'otros-productos'
        ]);

        const hasInvalidRemote = remoteCategories && remoteCategories.some(c => !validCategoryIds.has(c.id));
        const hasAllSix =
          remoteCategories &&
          validCategoryIds.size === remoteCategories.length &&
          remoteCategories.every(c => validCategoryIds.has(c.id));

        if (hasAllSix && !hasInvalidRemote) {
          setCategories(remoteCategories);
          saveCategories(remoteCategories);
        } else {
          // Purge any outdated or legacy categories from Firestore
          if (remoteCategories && remoteCategories.length > 0) {
            for (const cat of remoteCategories) {
              if (!validCategoryIds.has(cat.id)) {
                await deleteCategoryFromFirestore(cat.id).catch(() => {});
              }
            }
          }
          // Enforce and seed the 6 exact categories
          setCategories(initialCategories);
          saveCategories(initialCategories);
          await seedCategoriesToFirestore(initialCategories);
        }

        // Sync company profile
        const remoteCompany = await fetchCompanyFromFirestore();
        if (remoteCompany) {
          setCompany(remoteCompany);
          saveCompany(remoteCompany);
        } else {
          const localCompany = loadCompany();
          if (localCompany) {
            await saveCompanyToFirestore(localCompany);
          }
        }

        // Sync sales records with Firestore (only genuine sales, no demo reloads)
        const remoteSales = await fetchSalesFromFirestore();
        const validRemoteSales = (remoteSales || []).filter(
          s => s && s.id && !s.id.startsWith('sale-init') && s.id !== 'sale-1789132222175'
        );
        const currentLocalSales = loadSales();
        const salesMap = new Map<string, Sale>();
        validRemoteSales.forEach(s => salesMap.set(s.id, s));
        currentLocalSales.forEach(s => {
          if (!salesMap.has(s.id)) salesMap.set(s.id, s);
        });

        const mergedSales = Array.from(salesMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSales(mergedSales);
        saveSales(mergedSales);

        // Sync users with Firestore (credentials & security state)
        const remoteUsers = await fetchUsersFromFirestore();
        if (remoteUsers && remoteUsers.length > 0) {
          const localUsers = loadUsers();
          const userMap = new Map<string, User>();
          localUsers.forEach(u => userMap.set(u.id, u));
          remoteUsers.forEach(u => userMap.set(u.id, u));
          const mergedUsers = Array.from(userMap.values());
          setUsers(mergedUsers);
          saveUsers(mergedUsers);
        } else {
          const localUsers = loadUsers();
          if (localUsers && localUsers.length > 0) {
            await seedUsersToFirestore(localUsers);
          }
        }

        // Sync activity logs with Firestore (Audit Trail - Lote 3)
        const remoteLogs = await fetchActivityLogsFromFirestore(100);
        if (remoteLogs && remoteLogs.length > 0) {
          const localLogs = loadLogs();
          const logsMap = new Map<string, ActivityLog>();
          remoteLogs.forEach(l => logsMap.set(l.id, l));
          localLogs.forEach(l => {
            if (!logsMap.has(l.id)) {
              logsMap.set(l.id, l);
            }
          });
          const mergedLogs = Array.from(logsMap.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ).slice(0, 200);
          setLogs(mergedLogs);
          saveLogs(mergedLogs);
        } else {
          const localLogs = loadLogs();
          if (localLogs && localLogs.length > 0) {
            await seedActivityLogsToFirestore(localLogs);
          }
        }
      } catch (err) {
        console.warn('Initial Firestore sync notification:', err);
      }
    });

    // 3. Subscribe to real-time changes across devices
    const unsubscribeProducts = subscribeToProductsFirestore((remoteProducts) => {
      if (remoteProducts && Array.isArray(remoteProducts) && remoteProducts.length > 0) {
        const cleaned = cleanProductList(remoteProducts);
        setProducts(cleaned);
        saveProducts(cleaned);
        setSyncStatus('synced');
      }
    });

    return () => {
      unsubscribeProducts();
    };
  }, []);

  // Save changes to persistent storage
  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveCompany(company);
  }, [company]);

  useEffect(() => {
    saveUsers(users);
  }, [users]);

  useEffect(() => {
    saveSales(sales);
  }, [sales]);

  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  // Cloud Sync Handler: Reconciles all local data with Firestore
  const triggerCloudSync = async () => {
    if (isSimulatedOffline || !isOnline) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');
    try {
      await seedProductsToFirestore(products);
      await seedCategoriesToFirestore(categories);
      await saveCompanyToFirestore(company);
      const realSales = (sales || []).filter(s => s && s.id && !s.id.startsWith('sale-init') && s.id !== 'sale-1789132222175');
      if (realSales.length > 0) {
        await seedSalesToFirestore(realSales);
      }
      clearSyncQueue();
      setPendingSyncCount(0);
      setSyncStatus('synced');

      // Add sync notification
      const newNotif: PushNotification = {
        id: 'notif-' + Date.now(),
        title: 'Base de Datos Firestore Sincronizada',
        message: `Los ${products.length} productos del catálogo oficial se han respaldado de forma permanente en Google Cloud Firestore.`,
        type: 'sync',
        read: false,
        timestamp: 'Recién ahora',
      };
      setNotifications(prev => [newNotif, ...prev]);
    } catch (err) {
      console.error('Error during cloud sync:', err);
      setSyncStatus('offline');
    }
  };

  // Staff Mode & Security Handlers
  const handleRequestStaffMode = () => {
    if (isStaffAuthenticated) {
      setAppMode('staff');
    } else {
      setIsAuthLoginModalOpen(true);
    }
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setActiveUserIdState(authenticatedUser.id);
    setActiveUserId(authenticatedUser.id);
    setIsStaffAuthenticated(true);
    setAppMode('staff');
    playSuccessChime();
    addActivity(
      'user_login',
      'Acceso al Panel de Gestión',
      `Usuario ${authenticatedUser.name} (${authenticatedUser.role}) autenticado con éxito.`
    );
  };

  const handleLockStaffMode = () => {
    setIsStaffAuthenticated(false);
    setAppMode('store');
  };

  const addActivity = (action: ActivityLog['action'], title: string, details: string, amount?: number, productId?: string) => {
    const newLog: ActivityLog = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      title,
      details,
      amount,
      productId,
    };

    setLogs(prev => [newLog, ...prev]);

    // Offline sync queue & Firestore sync
    addToSyncQueue({ type: action, payload: { title, details, amount } });
    setPendingSyncCount(prev => prev + 1);

    if (isOnline && !isSimulatedOffline) {
      setSyncStatus('syncing');
      saveActivityLogToFirestore(newLog).catch(err => console.warn('Activity log firestore error:', err));
      setTimeout(() => setSyncStatus('synced'), 800);
    }
  };

  // Product Handlers
  const handleSaveProduct = async (
    productData: Omit<Product, 'id' | 'updatedAt' | 'updatedBy'> & { id?: string }
  ) => {
    const now = new Date().toISOString();

    if (productData.id) {
      unmarkProductAsDeleted(productData.id);
      // Update
      const updatedProduct = {
        ...productData,
        updatedAt: now,
        updatedBy: currentUser.name,
      } as Product;

      setProducts(prev => {
        const next = prev.map(p =>
          p.id === productData.id ? updatedProduct : p
        );
        saveProducts(next);
        return next;
      });

      if (detailProduct?.id === productData.id) {
        setDetailProduct(updatedProduct);
      }
      if (editingProduct?.id === productData.id) {
        setEditingProduct(null);
      }

      const res = await saveProductToFirestore(updatedProduct);
      if (!res.success) {
        console.warn('Alerta al sincronizar producto en la nube:', res.error);
        const warnNotif: PushNotification = {
          id: 'notif-' + Date.now(),
          title: 'Guardado Local Exitoso',
          message: `"${productData.name}" se guardó en tu dispositivo. Sincronización en la nube en espera: ${res.error || 'revisar conexión'}`,
          type: 'inventory_alert',
          read: false,
          timestamp: 'Recién',
          productId: productData.id,
        };
        setNotifications(prev => [warnNotif, ...prev]);
      }

      addActivity(
        'product_updated',
        `Artículo modificado: ${productData.name}`,
        `Precio Min: ${formatCurrency(productData.retailPrice)} | Stock: ${productData.stock} ${productData.unit}`,
        undefined,
        productData.id
      );

      // Auto-sync with Meta WhatsApp / Facebook Catalog
      if (
        company.metaCatalogConfig?.catalogId &&
        company.metaCatalogConfig?.accessToken &&
        company.metaCatalogConfig?.autoSyncOnChange !== false
      ) {
        syncSingleProductToMetaCatalog({
          catalogId: company.metaCatalogConfig.catalogId,
          accessToken: company.metaCatalogConfig.accessToken,
          product: updatedProduct,
          categories,
          company,
        }).then(metaRes => {
          if (metaRes.ok) {
            console.log('✓ Sincronizado automáticamente con WhatsApp/Facebook (Meta):', updatedProduct.name);
          } else {
            console.warn('Alerta al auto-sincronizar con Meta:', metaRes.error);
          }
        }).catch(err => console.warn('Error en auto-sync Meta:', err));
      }
    } else {
      // Create
      const newId = 'prod-' + Date.now();
      unmarkProductAsDeleted(newId);
      const createdProd: Product = {
        id: newId,
        ...productData,
        updatedAt: now,
        updatedBy: currentUser.name,
      };

      setProducts(prev => {
        const next = [createdProd, ...prev];
        saveProducts(next);
        return next;
      });

      const res = await saveProductToFirestore(createdProd);
      if (!res.success) {
        console.warn('Alerta al sincronizar nuevo producto en la nube:', res.error);
        const warnNotif: PushNotification = {
          id: 'notif-' + Date.now(),
          title: 'Guardado Local Exitoso',
          message: `"${productData.name}" se guardó en tu dispositivo. Sincronización en la nube en espera: ${res.error || 'revisar conexión'}`,
          type: 'inventory_alert',
          read: false,
          timestamp: 'Recién',
          productId: newId,
        };
        setNotifications(prev => [warnNotif, ...prev]);
      }

      addActivity(
        'product_created',
        `Nuevo artículo incorporado: ${productData.name}`,
        `SKU: ${productData.sku} | Categoría: ${productData.category} | PVP: ${formatCurrency(productData.retailPrice)}`,
        undefined,
        newId
      );

      // Auto-sync new product with Meta WhatsApp / Facebook Catalog
      if (
        company.metaCatalogConfig?.catalogId &&
        company.metaCatalogConfig?.accessToken &&
        company.metaCatalogConfig?.autoSyncOnChange !== false
      ) {
        syncSingleProductToMetaCatalog({
          catalogId: company.metaCatalogConfig.catalogId,
          accessToken: company.metaCatalogConfig.accessToken,
          product: createdProd,
          categories,
          company,
        }).then(metaRes => {
          if (metaRes.ok) {
            console.log('✓ Nuevo artículo sincronizado automáticamente con WhatsApp/Facebook (Meta):', createdProd.name);
          } else {
            console.warn('Alerta al auto-sincronizar con Meta:', metaRes.error);
          }
        }).catch(err => console.warn('Error en auto-sync Meta:', err));
      }
    }
  };

  const handleDeleteProduct = (product: Product) => {
    // 0. Mark permanently as deleted so it can never be resurrected
    markProductAsDeleted(product.id);

    // 1. Remove from active product catalog and cloud
    setProducts(prev => {
      const next = prev.filter(p => p.id !== product.id);
      saveProducts(next);
      return next;
    });
    deleteProductFromFirestore(product.id);

    // Auto-delete from Meta WhatsApp / Facebook Catalog
    if (
      company.metaCatalogConfig?.catalogId &&
      company.metaCatalogConfig?.accessToken &&
      company.metaCatalogConfig?.autoSyncOnChange !== false
    ) {
      deleteProductFromMetaCatalog({
        catalogId: company.metaCatalogConfig.catalogId,
        accessToken: company.metaCatalogConfig.accessToken,
        retailerId: product.sku || product.id,
      }).catch(err => console.warn('Alerta al eliminar artículo de Meta:', err));
    }

    // 2. Clean from POS cart if present
    removeByProductId(product.id);

    // 3. Close open views
    if (detailProduct?.id === product.id) {
      setDetailProduct(null);
    }
    if (editingProduct?.id === product.id) {
      setEditingProduct(null);
      setIsDuplicateMode(false);
      setIsProductFormOpen(false);
    }
    setProductToDelete(null);

    // 4. Audit Log
    addActivity(
      'product_deleted',
      `Artículo eliminado: ${product.name}`,
      `SKU: ${product.sku} | Eliminado por ${currentUser.name}`
    );

    // 5. Notification
    const notif: PushNotification = {
      id: 'notif-' + Date.now(),
      title: 'Artículo Eliminado',
      message: `El producto "${product.name}" (${product.sku}) fue eliminado exitosamente del catálogo.`,
      type: 'system',
      read: false,
      timestamp: 'Recién',
    };
    setNotifications(prev => [notif, ...prev]);
    playBeep();
  };

  const handleDuplicateProduct = (product: Product) => {
    setEditingProduct(product);
    setIsDuplicateMode(true);
    setIsProductFormOpen(true);
  };

  const handleUpdateProductImages = (product: Product, newImages: string[]) => {
    const safeImages = newImages;
    const primaryImage =
      safeImages.length > 0
        ? safeImages[0]
        : (product.imageUrl || '');

    const updated: Product = {
      ...product,
      imageUrl: primaryImage,
      images: safeImages,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };

    setProducts(prev => {
      const next = prev.map(p => (p.id === product.id ? updated : p));
      saveProducts(next);
      return next;
    });
    saveProductToFirestore(updated);

    if (detailProduct && detailProduct.id === product.id) {
      setDetailProduct(updated);
    }

    addActivity(
      'product_updated',
      `Fotos actualizadas: ${product.name}`,
      `Se actualizaron ${newImages.length} fotografía(s) por ${currentUser.name}`,
      undefined,
      product.id
    );

    const notif: PushNotification = {
      id: 'notif-' + Date.now(),
      title: 'Fotografías Actualizadas',
      message: `Las fotos de "${product.name}" fueron actualizadas (${newImages.length} imagen(es)).`,
      type: 'system',
      read: false,
      timestamp: 'Recién',
      productId: product.id,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const handleStockChange = (product: Product, newStock: number) => {
    const diff = newStock - product.stock;
    if (diff === 0) return;

    const updated = { ...product, stock: newStock, updatedAt: new Date().toISOString() };
    setProducts(prev =>
      prev.map(p => (p.id === product.id ? updated : p))
    );
    saveProductToFirestore(updated);

    addActivity(
      'stock_adjusted',
      `Ajuste de stock: ${product.name}`,
      `Se cambió el stock de ${product.stock} a ${newStock} ${product.unit}s (${diff > 0 ? '+' : ''}${diff})`,
      undefined,
      product.id
    );

    // Stock alert check
    if (newStock <= product.minStock) {
      playWarningAlert();
      const notif: PushNotification = {
        id: 'notif-' + Date.now(),
        title: '¡Alerta de Stock Crítico!',
        message: `El artículo "${product.name}" (${product.sku}) quedó con solo ${newStock} unidades disponibles (mínimo: ${product.minStock}).`,
        type: 'inventory_alert',
        read: false,
        timestamp: 'Hace un instante',
        productId: product.id,
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  const handleAddCategory = (newCategory: Category) => {
    setCategories(prev => [...prev, newCategory]);
    saveCategoryToFirestore(newCategory);
    addActivity(
      'category_created',
      `Nueva categoría: ${newCategory.name}`,
      `Creada por ${currentUser.name}`
    );
    const notif: PushNotification = {
      id: 'notif-' + Date.now(),
      title: 'Categoría Creada',
      message: `La categoría "${newCategory.name}" fue incorporada al catálogo.`,
      type: 'system',
      read: false,
      timestamp: 'Recién',
    };
    setNotifications(prev => [notif, ...prev]);
    playSuccessChime();
  };

  const handleRequestDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
  };

  const handleDeleteCategory = (categoryId: string, targetCategoryId?: string) => {
    const catToDelete = categories.find(c => c.id === categoryId);
    if (!catToDelete) return;

    // 1. Reassign products if needed
    if (targetCategoryId) {
      const targetCat = categories.find(c => c.id === targetCategoryId);
      setProducts(prev =>
        prev.map(p => (p.category === categoryId ? { ...p, category: targetCategoryId } : p))
      );
      addActivity(
        'category_deleted',
        `Categoría eliminada: ${catToDelete.name}`,
        `Productos reubicados en "${targetCat?.name || targetCategoryId}" por ${currentUser.name}`
      );
    } else {
      addActivity(
        'category_deleted',
        `Categoría eliminada: ${catToDelete.name}`,
        `Eliminada por ${currentUser.name} (sin artículos vinculados)`
      );
    }

    // 2. Remove category
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    deleteCategoryFromFirestore(categoryId);

    if (targetCategoryId) {
      const updatedProducts = products.map(p => (p.category === categoryId ? { ...p, category: targetCategoryId } : p));
      seedProductsToFirestore(updatedProducts);
    }

    // 3. Reset selectedCategory if it was the deleted one
    if (selectedCategory === categoryId) {
      setSelectedCategory('all');
    }

    setCategoryToDelete(null);

    // 4. Notification & Sound
    const notif: PushNotification = {
      id: 'notif-' + Date.now(),
      title: 'Categoría Eliminada',
      message: `La categoría "${catToDelete.name}" fue eliminada del catálogo.`,
      type: 'system',
      read: false,
      timestamp: 'Recién',
    };
    setNotifications(prev => [notif, ...prev]);
    playBeep();
  };

  const handleCompleteSale = async (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    const saleId = 'sale-' + Date.now();
    const createdSale: Sale = {
      id: saleId,
      createdAt: new Date().toISOString(),
      ...saleData,
    };

    // 1. Optimistic Local Stock Deduction
    setProducts(prev => {
      const updated = [...prev];
      saleData.items.forEach(item => {
        const idx = updated.findIndex(p => p.id === item.productId);
        if (idx !== -1) {
          const currentProd = updated[idx];
          const nextStock = Math.max(0, currentProd.stock - item.quantity);
          updated[idx] = { ...currentProd, stock: nextStock };

          // Trigger warning if reached low threshold
          if (nextStock <= currentProd.minStock) {
            const notif: PushNotification = {
              id: 'notif-' + Date.now() + '-' + item.productId,
              title: 'Alerta de Inventario por Venta',
              message: `El producto "${item.name}" quedó en nivel crítico (${nextStock} u.) tras la venta ${saleData.receiptNumber}.`,
              type: 'inventory_alert',
              read: false,
              timestamp: 'Recién',
              productId: item.productId,
            };
            setNotifications(n => [notif, ...n]);
          }
        }
      });
      return updated;
    });

    // 2. Add Sale record locally
    setSales(prev => [createdSale, ...prev]);

    // 3. ATOMIC TRANSACTION (LOTE 3): Verify stock & commit sale in Firestore
    try {
      const txResult = await recordSaleTransaction(createdSale, {
        isOffline: !isOnline || isSimulatedOffline,
      });

      if (!txResult.success && txResult.error) {
        console.warn('Advertencia de concurrencia en venta:', txResult.error);
        const conflictNotif: PushNotification = {
          id: 'notif-conflict-' + Date.now(),
          title: 'Aviso de Inventario Concurrente',
          message: `${txResult.error}. La venta se guardó localmente y se conciliará con el stock en la nube.`,
          type: 'inventory_alert',
          read: false,
          timestamp: 'Recién',
        };
        setNotifications(prev => [conflictNotif, ...prev]);
        playWarningAlert();
      } else if (txResult.stockUpdates && txResult.stockUpdates.length > 0) {
        // Synchronize with authoritative cloud stock computed inside the transaction
        const stockMap = new Map(txResult.stockUpdates.map(u => [u.productId, u.newStock]));
        setProducts(prev =>
          prev.map(p => {
            if (stockMap.has(p.id)) {
              return { ...p, stock: stockMap.get(p.id)!, updatedAt: new Date().toISOString() };
            }
            return p;
          })
        );
      }
    } catch (err) {
      console.warn('Venta diferida a sincronización offline:', err);
    }

    // 4. Add Activity Log
    addActivity(
      'sale_completed',
      `Venta completada ${saleData.receiptNumber}`,
      `Cobro de ${formatCurrency(saleData.total)} mediante ${saleData.paymentMethod.toUpperCase()} (${saleData.items.length} líneas)`,
      saleData.total
    );

    // 5. Add Notification
    const saleNotif: PushNotification = {
      id: 'notif-' + Date.now(),
      title: `Venta Registrada ${saleData.receiptNumber}`,
      message: `Cobrado: ${formatCurrency(saleData.total)} por ${currentUser.name}. Cliente: ${saleData.customerName || 'Consumidor Final'}.`,
      type: 'sale',
      read: false,
      timestamp: 'Recién',
    };
    setNotifications(prev => [saleNotif, ...prev]);
  };

  const handleCancelSale = async (saleId: string, restoreStock: boolean, reason?: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    // 1. ATOMIC TRANSACTION (LOTE 3): Cancel sale and restore stock in Firestore
    const cancellationReason = reason || 'Anulación de venta';
    await recordCancelSaleTransaction(
      sale,
      restoreStock,
      currentUser.name,
      cancellationReason
    );

    // 2. Reintegrate stock locally if requested
    if (restoreStock && sale.items && sale.items.length > 0) {
      setProducts(prev => {
        const updated = [...prev];
        sale.items.forEach(item => {
          const idx = updated.findIndex(p => p.id === item.productId);
          if (idx !== -1) {
            const currentProd = updated[idx];
            const nextStock = currentProd.stock + item.quantity;
            updated[idx] = { ...currentProd, stock: nextStock, updatedAt: new Date().toISOString() };
          }
        });
        return updated;
      });
    }

    // 3. Mark sale as cancelled in local state
    const updatedSale: Sale = {
      ...sale,
      paymentStatus: 'cancelled',
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy: currentUser.name,
      cancellationReason,
      stockReintegrated: restoreStock,
    };

    setSales(prev => prev.map(s => (s.id === saleId ? updatedSale : s)));

    // 4. Activity Log & Push Notification
    addActivity(
      'sale_cancelled',
      `Venta anulada: ${sale.receiptNumber}`,
      `Anulada por ${currentUser.name}. Motivo: ${cancellationReason}.${
        restoreStock ? ' Se restituyeron las unidades vendidas al stock.' : ''
      }`,
      -sale.total
    );

    const notif: PushNotification = {
      id: 'notif-' + Date.now(),
      title: `Venta Anulada ${sale.receiptNumber}`,
      message: `El ticket ${sale.receiptNumber} (${formatCurrency(sale.total)}) fue cancelado por ${currentUser.name}.${
        restoreStock ? ' Stock restituido.' : ''
      }`,
      type: 'system',
      read: false,
      timestamp: 'Recién',
    };
    setNotifications(prev => [notif, ...prev]);
    playWarningAlert();
  };

  const handleDeleteSale = async (saleId: string, restoreStock: boolean) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    // 1. Reintegrate stock if requested and not previously cancelled with stock restored
    if (restoreStock && !sale.stockReintegrated && sale.items && sale.items.length > 0) {
      setProducts(prev => {
        const updated = [...prev];
        sale.items.forEach(item => {
          const idx = updated.findIndex(p => p.id === item.productId);
          if (idx !== -1) {
            const currentProd = updated[idx];
            const nextStock = currentProd.stock + item.quantity;
            const updatedProd = { ...currentProd, stock: nextStock, updatedAt: new Date().toISOString() };
            updated[idx] = updatedProd;
            saveProductToFirestore(updatedProd);
          }
        });
        return updated;
      });
    }

    // 2. Remove sale from state and Firestore
    setSales(prev => prev.filter(s => s.id !== saleId));
    await deleteSaleFromFirestore(saleId);

    // 3. Activity Log
    addActivity(
      'sale_cancelled',
      `Registro de venta eliminado: ${sale.receiptNumber}`,
      `Eliminado permanentemente por ${currentUser.name}.${
        restoreStock ? ' Se restituyó el stock de los artículos.' : ''
      }`
    );

    const notif: PushNotification = {
      id: 'notif-' + Date.now(),
      title: 'Ticket Eliminado',
      message: `El ticket ${sale.receiptNumber} fue borrado permanentemente del sistema.`,
      type: 'system',
      read: false,
      timestamp: 'Recién',
    };
    setNotifications(prev => [notif, ...prev]);
    playBeep();
  };

  const handleClearAllSales = async () => {
    if (!window.confirm('¿Está seguro de que desea eliminar todos los registros de ventas del sistema? Esta acción dejará solo las ventas que genere a partir de ahora.')) {
      return;
    }
    setSales([]);
    saveSales([]);
    try {
      const remote = await fetchSalesFromFirestore();
      for (const s of remote) {
        await deleteSaleFromFirestore(s.id);
      }
      addActivity(
        'sale_cancelled',
        'Historial de ventas vaciado',
        `Todos los registros de ventas anteriores fueron eliminados por ${currentUser.name}.`
      );
      playBeep();
    } catch (err) {
      console.error('Error clearing sales:', err);
    }
  };

  // User Switcher & Management
  const handleSwitchUser = (userId: string) => {
    setActiveUserIdState(userId);
    setActiveUserId(userId);
    playBeep();
  };

  const handleSaveUser = (user: User) => {
    setUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      const updated = exists ? prev.map(u => (u.id === user.id ? user : u)) : [...prev, user];
      saveUsers(updated);
      return updated;
    });

    saveUserToFirestore(user);

    addActivity(
      'user_updated',
      `Usuario modificado: ${user.name}`,
      `Rol: ${user.role} | Credenciales y permisos actualizados`
    );
  };

  const handleUpdateUserPassword = async (userId: string, newPassword: string) => {
    let targetUser: User | undefined;
    setUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === userId) {
          targetUser = {
            ...u,
            password: newPassword,
            mustChangePassword: false,
            lastActive: 'Activo ahora',
          };
          return targetUser;
        }
        return u;
      });
      saveUsers(updated);
      return updated;
    });

    if (targetUser) {
      await saveUserToFirestore(targetUser);
      addActivity(
        'user_updated',
        `Contraseña actualizada: ${targetUser.name}`,
        'El usuario completó con éxito el cambio obligatorio de contraseña en su primer inicio de sesión.'
      );
    }
  };

  const handleSaveCompany = (updatedCompany: CompanyProfile) => {
    setCompany(updatedCompany);
    saveCompanyToFirestore(updatedCompany);
    addActivity(
      'company_updated',
      'Datos de Empresa Titufaris actualizados',
      `CUIT: ${updatedCompany.taxId} | Razón Social: ${updatedCompany.legalName}`
    );
  };

  const handleRestoreBackup = (backupData: AppBackupData, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setProducts(backupData.products);
      saveProducts(backupData.products);

      if (backupData.categories && backupData.categories.length > 0) {
        setCategories(backupData.categories);
        saveCategories(backupData.categories);
      }
      if (backupData.company) {
        setCompany(backupData.company);
        saveCompany(backupData.company);
      }
      if (backupData.users && backupData.users.length > 0) {
        setUsers(backupData.users);
        saveUsers(backupData.users);
      }
      if (backupData.sales && backupData.sales.length > 0) {
        setSales(backupData.sales);
        saveSales(backupData.sales);
      }
    } else {
      // Merge mode: preserve existing items and append new ones by id
      setProducts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newItems = backupData.products.filter(p => !existingIds.has(p.id));
        const merged = [...prev, ...newItems];
        saveProducts(merged);
        return merged;
      });
      if (backupData.categories && backupData.categories.length > 0) {
        setCategories(prev => {
          const existingCatIds = new Set(prev.map(c => c.id));
          const newCats = backupData.categories.filter(c => !existingCatIds.has(c.id));
          const merged = [...prev, ...newCats];
          saveCategories(merged);
          return merged;
        });
      }
    }

    // Push restored products and categories to Firestore immediately so they are permanently in cloud
    seedProductsToFirestore(backupData.products).catch(err => {
      console.warn('Sync restored products to Firestore:', err);
    });
    if (backupData.categories && backupData.categories.length > 0) {
      seedCategoriesToFirestore(backupData.categories).catch(() => {});
    }
    if (backupData.company) {
      saveCompanyToFirestore(backupData.company).catch(() => {});
    }

    addActivity(
      'backup_restored',
      'Copia de seguridad restaurada',
      `Se restauraron ${backupData.products.length} artículos en modo ${
        mode === 'replace' ? 'Reemplazo Total' : 'Combinado'
      }`
    );

    playSuccessChime();

    const notif: PushNotification = {
      id: 'notif-' + Date.now(),
      title: 'Copia de Seguridad Restaurada',
      message: `Se cargaron ${backupData.products.length} productos correctamente y se subieron a Firestore.`,
      type: 'system',
      read: false,
      timestamp: 'Recién',
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const handleRecoverProducts = async (productsToRestore: Product[]) => {
    setProducts(prev => {
      const map = new Map<string, Product>();
      prev.forEach(p => map.set(p.id, p));
      productsToRestore.forEach(p => map.set(p.id, p));
      const merged = Array.from(map.values());
      saveProducts(merged);
      return merged;
    });

    // Upload to Firestore right away!
    await seedProductsToFirestore(productsToRestore);

    addActivity(
      'product_created',
      `Recuperación: ${productsToRestore.length} artículos guardados en Firestore`,
      `Artículos recuperados o cargados masivamente e indexados permanentemente en la nube.`
    );

    playSuccessChime();

    const notif: PushNotification = {
      id: 'notif-' + Date.now(),
      title: 'Artículos Guardados en la Nube',
      message: `Se sincronizaron ${productsToRestore.length} artículos correctamente en Firestore.`,
      type: 'system',
      read: false,
      timestamp: 'Recién',
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Reorder Products: Move product from sourceId to targetId position
  const handleReorderProducts = (sourceId: string, targetId: string, position: 'before' | 'after' = 'before') => {
    if (sourceId === targetId) return;

    setProducts(prevProducts => {
      const sourceIdx = prevProducts.findIndex(p => p.id === sourceId);
      const targetIdx = prevProducts.findIndex(p => p.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prevProducts;

      const next = [...prevProducts];
      const [movedItem] = next.splice(sourceIdx, 1);
      const newTargetIdx = next.findIndex(p => p.id === targetId);
      const insertIdx = position === 'before' ? newTargetIdx : newTargetIdx + 1;
      next.splice(insertIdx, 0, movedItem);

      // Re-index sortOrder on each product for serialization/backups
      const updated = next.map((item, idx) => ({
        ...item,
        sortOrder: idx + 1,
      }));

      saveProducts(updated);
      return updated;
    });

    setCatalogSortOrder('manual');
    playSuccessChime();

    const movedProduct = products.find(p => p.id === sourceId);
    if (movedProduct) {
      addActivity(
        'catalog_reordered',
        `Catálogo reorganizado`,
        `Se reubicó el artículo "${movedProduct.name}"`
      );
    }
  };

  // Step Move Product in currently visible list ('up' | 'down' | 'first' | 'last')
  const handleMoveProduct = (productId: string, direction: 'up' | 'down' | 'first' | 'last') => {
    const currentIdxInFiltered = filteredProducts.findIndex(p => p.id === productId);
    if (currentIdxInFiltered === -1) return;

    let targetIdx = currentIdxInFiltered;
    let position: 'before' | 'after' = 'before';

    if (direction === 'up') {
      if (currentIdxInFiltered <= 0) return;
      targetIdx = currentIdxInFiltered - 1;
      position = 'before';
    } else if (direction === 'down') {
      if (currentIdxInFiltered >= filteredProducts.length - 1) return;
      targetIdx = currentIdxInFiltered + 1;
      position = 'after';
    } else if (direction === 'first') {
      if (currentIdxInFiltered <= 0) return;
      targetIdx = 0;
      position = 'before';
    } else if (direction === 'last') {
      if (currentIdxInFiltered >= filteredProducts.length - 1) return;
      targetIdx = filteredProducts.length - 1;
      position = 'after';
    }

    const targetProduct = filteredProducts[targetIdx];
    if (!targetProduct || targetProduct.id === productId) return;

    handleReorderProducts(productId, targetProduct.id, position);
  };

  // Drag-and-Drop Handlers
  const handleDragStart = (e: React.DragEvent, productId: string) => {
    setDraggedProductId(productId);
    e.dataTransfer.setData('text/plain', productId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetProductId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedProductId && draggedProductId !== targetProductId) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const midY = rect.top + rect.height / 2;
      const isAfter = viewLayout === 'grid' ? e.clientX > midX : e.clientY > midY;

      setDropTargetProductId(targetProductId);
      setDropPosition(isAfter ? 'after' : 'before');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX >= rect.right ||
      e.clientY < rect.top ||
      e.clientY >= rect.bottom
    ) {
      setDropTargetProductId(null);
      setDropPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetProductId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedProductId;
    if (sourceId && targetProductId && sourceId !== targetProductId) {
      handleReorderProducts(sourceId, targetProductId, dropPosition || 'before');
    }
    setDraggedProductId(null);
    setDropTargetProductId(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedProductId(null);
    setDropTargetProductId(null);
    setDropPosition(null);
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-orange-500 selection:text-white">
      {/* ---------------- PUBLIC STOREFRONT MODE (CLIENTES) ---------------- */}
      {appMode === 'store' ? (
        <>
          <PublicNavbar
            company={company}
            cartCount={cartItemCount}
            cartTotal={cartSubtotal}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenCart={() => setIsCustomerCartOpen(true)}
            onOpenCatalogPDF={() => setIsExportModalOpen(true)}
            onSwitchToStaffMode={handleRequestStaffMode}
          />

          <PublicStoreView
            products={storeFilteredProducts}
            categories={categories}
            company={company}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onOpenProductDetail={setDetailProduct}
            onOpenQR={setQrProduct}
            onAddToCart={(p) => handleAddToCart(p, 'retail')}
            onOpenCatalogPDF={() => setIsExportModalOpen(true)}
            onSwitchToStaffMode={handleRequestStaffMode}
            onOpenLegalModal={handleOpenLegalModal}
            onOpenCart={() => setIsCustomerCartOpen(true)}
            cartCount={cartItemCount}
            cartTotal={cartSubtotal}
          />

          {/* Customer Cart Drawer */}
          <CustomerCartDrawer
            isOpen={isCustomerCartOpen}
            onClose={() => setIsCustomerCartOpen(false)}
            cart={cart}
            company={company}
            onUpdateQty={handleUpdateCartQty}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onProceedToOnlinePayment={() => {
              setIsCustomerCartOpen(false);
              setIsPaymentModalOpen(true);
            }}
            onOpenLegalNotice={handleOpenLegalModal}
          />

          {/* Cookie & Storage Consent Banner */}
          <CookieConsentBanner onOpenPrivacyPolicy={() => handleOpenLegalModal('privacy')} />

          {/* Quick Floating Access for Staff on Tablets or Desktops */}
          <div className="fixed bottom-4 right-4 z-30">
            <button
              onClick={handleRequestStaffMode}
              title="Ingresar a Gestión Interna / Terminal POS"
              className="px-4 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-2xl backdrop-blur-md flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <span>Panel POS / Admin</span>
            </button>
          </div>
        </>
      ) : (
        /* ---------------- INTERNAL STAFF / POS / ADMIN MODE ---------------- */
        <>
          {/* Offline / Sync Banner */}
          <OfflineBanner
            isOnline={isOnline}
            syncStatus={syncStatus}
            pendingCount={pendingSyncCount}
            onManualSync={triggerCloudSync}
            isSimulatedOffline={isSimulatedOffline}
            onToggleSimulatedOffline={() => {
              const next = !isSimulatedOffline;
              setIsSimulatedOffline(next);
              if (next) setSyncStatus('offline');
              else triggerCloudSync();
            }}
          />

          {/* Main App Navigation Bar */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            syncStatus={syncStatus}
            isOnline={isOnline && !isSimulatedOffline}
            cartCount={cartItemCount}
            unreadNotifsCount={unreadNotifsCount}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenExport={() => setIsExportModalOpen(true)}
            onOpenWhatsAppCatalog={() => setIsWhatsAppCatalogModalOpen(true)}
            onOpenGoogleMerchant={() => setIsGoogleModalOpen(true)}
            onOpenNewProduct={() => {
              setEditingProduct(null);
              setIsDuplicateMode(false);
              setIsProductFormOpen(true);
            }}
            onOpenUsersModal={() => setIsUsersModalOpen(true)}
            onOpenCompanySettings={() => setIsCompanyModalOpen(true)}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
            onOpenRecoveryModal={() => setIsRecoveryModalOpen(true)}
            onManualSync={triggerCloudSync}
            onSwitchToStoreMode={handleLockStaffMode}
          />

          {/* Quick Floating Access to Web Store in Staff Mode */}
          <div className="fixed bottom-4 right-4 z-30">
            <button
              onClick={handleLockStaffMode}
              title="Bloquear terminal y ver Tienda Web Pública (Vista de Clientes)"
              className="px-4 py-2.5 rounded-full bg-emerald-700/95 hover:bg-emerald-700 text-white text-xs font-bold border border-emerald-500 shadow-2xl backdrop-blur-md flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <span>Ver Tienda Web</span>
            </button>
          </div>

          {/* VIEW: 1. CATALOG & INVENTORY */}
          {activeTab === 'catalog' && (
        <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-6 space-y-5">
          {/* Persistent Rescue / Recovery Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-950">
                  {autoRecoveredCount > 0
                    ? `¡Se recuperaron e integraron automáticamente ${autoRecoveredCount} artículos de tu memoria local a Firestore!`
                    : 'Recuperador de Artículos & Carga Masiva a Firestore'}
                </p>
                <p className="text-[11px] text-amber-800/90 mt-0.5">
                  Restaura artículos anteriores de tu navegador, sube copias de seguridad o pega listas de productos directamente a la base de datos en la nube.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsRecoveryModalOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Abrir Recuperador & Carga</span>
            </button>
          </div>

          {/* Top Catalog Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            {/* Catalog Action Header with prominent "Nuevo Producto" button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>Inventario & Catálogo de Artículos</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold">
                    {products.length} productos
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gestiona precios minoristas y mayoristas, fotos, stock y códigos QR sincronizados con Firestore.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {(currentUser.role === 'admin' || currentUser.permissions.canManageInventory) && (
                  <button
                    id="btn-add-new-product-main"
                    onClick={() => {
                      setEditingProduct(null);
                      setIsDuplicateMode(false);
                      setIsProductFormOpen(true);
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-600/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Cargar y dar de alta un nuevo producto o artículo en el catálogo"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>＋ Cargar Nuevo Producto</span>
                  </button>
                )}

                {(currentUser.role === 'admin' || currentUser.permissions.canManageInventory) && (
                  <button
                    id="btn-manage-categories-main"
                    onClick={() => setIsCategoryManagerOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    title="Crear o editar líneas y categorías de productos"
                  >
                    <FolderPlus className="w-4 h-4 text-slate-600" />
                    <span className="hidden md:inline">Líneas / Categorías</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar en catálogo por nombre, SKU, código de barras o etiqueta..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-orange-500 font-medium"
                />
              </div>

              {/* Price Type View Toggle & Grid/List View */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
                {/* Price Mode */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setDisplayPriceType('retail')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      displayPriceType === 'retail'
                        ? 'bg-white text-orange-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    PVP Minorista
                  </button>
                  <button
                    onClick={() => setDisplayPriceType('wholesale')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      displayPriceType === 'wholesale'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mayorista
                  </button>
                </div>

                {/* Stock filter */}
                <select
                  value={stockFilter}
                  onChange={e => setStockFilter(e.target.value as typeof stockFilter)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none font-medium text-slate-700 cursor-pointer"
                >
                  <option value="all">Todo el Stock</option>
                  <option value="low_stock">Stock Crítico</option>
                  <option value="in_stock">Solo con Stock</option>
                  <option value="out_of_stock">Agotados</option>
                </select>

                {/* Catalog Sort Order filter */}
                <select
                  value={catalogSortOrder}
                  onChange={e => {
                    const val = e.target.value as typeof catalogSortOrder;
                    setCatalogSortOrder(val);
                    if (val !== 'manual' && isReorderMode) {
                      setIsReorderMode(false);
                    }
                  }}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none font-medium text-slate-700 cursor-pointer"
                  title="Criterio de ordenación de los productos"
                >
                  <option value="manual">Orden Personalizado (Manual)</option>
                  <option value="featured_first">Destacados Primero</option>
                  <option value="name_asc">Nombre: A - Z</option>
                  <option value="price_asc">Precio: Menor a Mayor</option>
                  <option value="price_desc">Precio: Mayor a Menor</option>
                </select>

                {/* Grid / List switch */}
                <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewLayout('grid')}
                    title="Vista en Grilla"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewLayout === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewLayout('list')}
                    title="Vista en Lista Detallada"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewLayout === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter Pills (Tablet horizontal scrolling) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Todas las Líneas</span>
                <span className="text-[10px] font-mono opacity-80">({products.length})</span>
              </button>
              {categories.map(c => {
                const count = products.filter(p => p.category === c.id).length;
                const isSelected = selectedCategory === c.id;
                const canManage = currentUser.role === 'admin' || currentUser.permissions.canManageInventory;
                const catColor = c.color || '#F97316';
                return (
                  <div
                    key={c.id}
                    style={
                      isSelected
                        ? { backgroundColor: catColor, color: '#ffffff' }
                        : { borderColor: `${catColor}40` }
                    }
                    className={`flex items-center rounded-xl overflow-hidden font-bold whitespace-nowrap transition-all shrink-0 border ${
                      isSelected
                        ? 'shadow-xs border-transparent'
                        : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedCategory(c.id)}
                      className="px-3.5 py-1.5 cursor-pointer flex items-center gap-2"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                        style={{
                          backgroundColor: isSelected ? '#ffffff' : catColor,
                        }}
                      />
                      <span>{c.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                    {canManage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestDeleteCategory(c);
                        }}
                        title={`Eliminar categoría "${c.name}"`}
                        className={`p-1.5 pr-2.5 transition-colors cursor-pointer ${
                          isSelected
                            ? 'text-white/75 hover:text-white hover:bg-black/10'
                            : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => setIsCategoryManagerOpen(true)}
                title="Administrar y crear o eliminar categorías del catálogo"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold whitespace-nowrap transition-colors cursor-pointer shadow-2xs shrink-0"
              >
                <Layers className="w-3.5 h-3.5 text-orange-600" />
                <span>Gestionar Categorías</span>
              </button>
            </div>
          </div>

          {/* Results Summary & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-500 px-1">
            <span>
              Mostrando <strong>{filteredProducts.length}</strong> de {products.length} productos
              {selectedCategory !== 'all' && ` en ${categories.find(c => c.id === selectedCategory)?.name}`}
              {catalogSortOrder === 'manual' && (
                <span className="ml-1.5 text-orange-600 font-semibold">• Orden Personalizado</span>
              )}
            </span>
            <div className="flex items-center gap-2.5">
              {/* Reorganize Catalog Button */}
              {(currentUser.role === 'admin' || currentUser.permissions.canManageInventory) && (
                <button
                  onClick={() => {
                    const next = !isReorderMode;
                    setIsReorderMode(next);
                    if (next) {
                      setCatalogSortOrder('manual');
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isReorderMode
                      ? 'bg-orange-600 text-white shadow-xs ring-2 ring-orange-400'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs'
                  }`}
                  title="Activar modo para mover y reordenar productos en el catálogo"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>{isReorderMode ? 'Listo / Guardar' : 'Mover / Reorganizar'}</span>
                </button>
              )}

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="text-orange-600 hover:text-orange-700 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Catálogo PDF
              </button>
            </div>
          </div>

          {/* Banner for Reorder Mode */}
          {isReorderMode && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Move className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-orange-950 text-xs sm:text-sm">
                    Modo Reorganización Activo
                  </h4>
                  <p className="text-[11px] sm:text-xs text-orange-800">
                    Arrastre los productos para cambiarlos de lugar o utilice los botones <strong>Antes</strong> / <strong>Después</strong> para desplazarlos. El orden se guarda en tiempo real.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsReorderMode(false);
                  playSuccessChime();
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Finalizar Reorganización</span>
              </button>
            </div>
          )}

          {/* Product Grid / List Layout */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <Layers className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <h3 className="font-bold text-slate-700 text-base">No hay productos que coincidan</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Pruebe ajustando los filtros de búsqueda o categoría, o cargue un nuevo artículo.
              </p>
              {(currentUser.role === 'admin' || currentUser.permissions.canManageInventory) && (
                <button
                  id="btn-add-product-empty-state"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsDuplicateMode(false);
                    setIsProductFormOpen(true);
                  }}
                  className="mt-4 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-600/25 transition-all hover:scale-105 cursor-pointer"
                >
                  ＋ Cargar Nuevo Artículo
                </button>
              )}
            </div>
          ) : viewLayout === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {filteredProducts.map((p, idx) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  category={categories.find(c => c.id === p.category)}
                  currentUser={currentUser}
                  displayPriceType={displayPriceType}
                  isReorderMode={isReorderMode}
                  orderIndex={idx + 1}
                  totalProducts={filteredProducts.length}
                  onMove={handleMoveProduct}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedProductId === p.id}
                  isDropTarget={dropTargetProductId === p.id}
                  dropPosition={dropTargetProductId === p.id ? dropPosition : null}
                  onOpenDetail={setDetailProduct}
                  onOpenQR={setQrProduct}
                  onAddToCart={handleAddToCart}
                  onStockChange={handleStockChange}
                  onOpenEdit={(productToEdit) => {
                    setEditingProduct(productToEdit);
                    setIsDuplicateMode(false);
                    setIsProductFormOpen(true);
                  }}
                  onDuplicate={handleDuplicateProduct}
                  onDelete={(productToDelete) => setProductToDelete(productToDelete)}
                />
              ))}
            </div>
          ) : (
            /* LIST / TABLE VIEW */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-white uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3 py-3 w-16 text-center"># Pos</th>
                      <th className="px-4 py-3">Artículo / SKU</th>
                      <th className="px-4 py-3">Categoría</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3">P. Mayorista</th>
                      <th className="px-4 py-3">P. Minorista</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p, idx) => (
                      <tr
                        key={p.id}
                        draggable={currentUser.role === 'admin' || currentUser.permissions.canManageInventory}
                        onDragStart={(e) => handleDragStart(e, p.id)}
                        onDragOver={(e) => handleDragOver(e, p.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, p.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setDetailProduct(p)}
                        className={`transition-colors cursor-pointer ${
                          draggedProductId === p.id
                            ? 'opacity-30 bg-slate-100'
                            : dropTargetProductId === p.id
                            ? 'bg-orange-100/60 ring-2 ring-orange-500'
                            : isReorderMode
                            ? 'hover:bg-orange-50/50'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Position & Step Reorder Column */}
                        <td
                          className="px-2 py-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span
                              title="Arrastrar fila para reordenar"
                              className="text-slate-400 hover:text-orange-600 cursor-grab active:cursor-grabbing p-0.5"
                            >
                              <GripVertical className="w-4 h-4" />
                            </span>
                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                            {isReorderMode && (
                              <div className="flex items-center gap-0.5 ml-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveProduct(p.id, 'up')}
                                  title="Mover una posición antes (arriba)"
                                  className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-20 cursor-pointer"
                                >
                                  <ArrowUp className="w-3.5 h-3.5 text-orange-600" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === filteredProducts.length - 1}
                                  onClick={() => handleMoveProduct(p.id, 'down')}
                                  title="Mover una posición después (abajo)"
                                  className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-20 cursor-pointer"
                                >
                                  <ArrowDown className="w-3.5 h-3.5 text-orange-600" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                (p.images && p.images.length > 0 && p.images[0] && p.images[0].trim() !== '')
                                  ? p.images[0]
                                  : (p.imageUrl && p.imageUrl.trim() !== '')
                                  ? p.imageUrl
                                  : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80'
                              }
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-200 shrink-0"
                            />
                            <div>
                              <span className="font-mono text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-sm">
                                {p.sku}
                              </span>
                              <div className="font-bold text-slate-900 mt-0.5">
                                {p.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const cat = categories.find(c => c.id === p.category);
                            const catColor = cat?.color || '#F97316';
                            return (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold shadow-2xs"
                                style={{
                                  backgroundColor: `${catColor}15`,
                                  color: catColor,
                                  border: `1px solid ${catColor}30`,
                                }}
                              >
                                <span
                                  className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                                  style={{ backgroundColor: catColor }}
                                />
                                <span className="truncate max-w-[140px]">
                                  {cat?.name || p.category}
                                </span>
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-bold ${
                              p.stock <= p.minStock ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            {p.stock} {p.unit}s
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">
                          {formatCurrency(p.wholesalePrice)}
                        </td>
                        <td className="px-4 py-3 font-black text-orange-600 text-sm">
                          {formatCurrency(p.retailPrice)}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setQrProduct(p)}
                              title="Ver Código QR"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicateProduct(p)}
                              title="Duplicar para variante"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            {currentUser.permissions.canEditPrices && (
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setIsDuplicateMode(false);
                                  setIsProductFormOpen(true);
                                }}
                                title="Editar producto"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {(currentUser.role === 'admin' || currentUser.permissions.canManageInventory) && (
                              <button
                                onClick={() => setProductToDelete(p)}
                                title="Eliminar artículo"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleAddToCart(p, displayPriceType)}
                              disabled={p.stock <= 0}
                              className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-colors disabled:opacity-40 cursor-pointer ml-1"
                            >
                              Vender
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      )}

      {/* VIEW: 2. TABLET POS / CHECKOUT TERMINAL */}
      {activeTab === 'pos' && (
        <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>}>
          <POSView
            products={products}
            categories={categories}
            cart={cart}
            company={company}
            currentUser={currentUser}
            onAddToCart={handleAddToCart}
            onUpdateCartQty={handleUpdateCartQty}
            onRemoveCartItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onOpenCheckout={(discount) => {
              setPosDiscount(discount);
              setIsPaymentModalOpen(true);
            }}
          />
        </Suspense>
      )}

      {/* VIEW: 3. AUDIT & ACTIVITY REPORTS */}
      {activeTab === 'reports' && (
        <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>}>
          <ActivityReportsView
            logs={logs}
            products={products}
            sales={sales}
            company={company}
            currentUser={currentUser}
            onCancelSale={handleCancelSale}
            onDeleteSale={handleDeleteSale}
            onClearAllSales={handleClearAllSales}
          />
        </Suspense>
      )}
        </>
      )}

      {/* MODALS */}
      {/* 1. Technical Specs / Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        category={categories.find(c => c.id === detailProduct?.category)}
        company={company}
        currentUser={currentUser}
        isOpen={!!detailProduct}
        isStaffMode={appMode !== 'store'}
        onClose={() => setDetailProduct(null)}
        onOpenEdit={(p) => {
          setEditingProduct(p);
          setIsDuplicateMode(false);
          setIsProductFormOpen(true);
        }}
        onOpenQR={setQrProduct}
        onAddToCart={handleAddToCart}
        onStockChange={handleStockChange}
        onDuplicateProduct={handleDuplicateProduct}
        onDeleteProduct={(p) => setProductToDelete(p)}
        onUpdateProductImages={handleUpdateProductImages}
      />

      {/* 2. Product Create / Edit Form Modal */}
      <ProductFormModal
        product={editingProduct}
        isDuplicate={isDuplicateMode}
        categories={categories}
        isOpen={isProductFormOpen}
        onClose={() => {
          setIsProductFormOpen(false);
          setEditingProduct(null);
          setIsDuplicateMode(false);
        }}
        onSave={handleSaveProduct}
        onAddCategory={handleAddCategory}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
        onDeleteCategory={handleRequestDeleteCategory}
        onDelete={(p) => setProductToDelete(p)}
        onDuplicate={(p) => handleDuplicateProduct(p)}
      />

      {/* Confirmation Modal for safe deletion */}
      <ConfirmDeleteModal
        isOpen={!!productToDelete}
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteProduct}
      />

      {/* Category Manager Modal */}
      <Suspense fallback={null}>
        {isCategoryManagerOpen && (
          <CategoryManagerModal
            isOpen={isCategoryManagerOpen}
            onClose={() => setIsCategoryManagerOpen(false)}
            categories={categories}
            products={products}
            currentUser={currentUser}
            onAddCategory={handleAddCategory}
            onRequestDeleteCategory={handleRequestDeleteCategory}
          />
        )}
      </Suspense>

      {/* Confirmation Modal for safe category deletion */}
      <ConfirmDeleteCategoryModal
        isOpen={!!categoryToDelete}
        category={categoryToDelete}
        categories={categories}
        products={products}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
      />

      {/* 3. Dynamic QR Code Modal */}
      <QRCodeModal
        product={qrProduct}
        company={company}
        isOpen={!!qrProduct}
        onClose={() => setQrProduct(null)}
        onOpenProductDetail={setDetailProduct}
      />

      {/* 4. Export PDF / Excel Modal */}
      <Suspense fallback={null}>
        {isExportModalOpen && (
          <ExportModal
            products={products}
            categories={categories}
            company={company}
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            onLoggedExport={(exportTitle) => {
              addActivity('catalog_exported', `Exportación: ${exportTitle}`, 'Generado con jspdf');
            }}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
            onOpenWhatsAppCatalog={() => setIsWhatsAppCatalogModalOpen(true)}
            onOpenGoogleMerchant={() => setIsGoogleModalOpen(true)}
            isAdmin={appMode === 'staff' && (currentUser.role === 'admin' || currentUser.permissions.canManageInventory)}
            isPublicStore={appMode === 'store'}
          />
        )}
      </Suspense>

      {/* WhatsApp Business & Meta Commerce Catalog Hub */}
      <Suspense fallback={null}>
        {isWhatsAppCatalogModalOpen && (
          <WhatsAppCatalogModal
            isOpen={isWhatsAppCatalogModalOpen}
            onClose={() => setIsWhatsAppCatalogModalOpen(false)}
            products={products}
            categories={categories}
            company={company}
            onUpdateCompany={handleSaveCompany}
            onLoggedExport={(exportTitle) => {
              addActivity('catalog_exported', `Exportación WhatsApp: ${exportTitle}`, 'Generado para Meta Commerce Manager');
            }}
          />
        )}
      </Suspense>

      {/* Google Shopping & Google Merchant Center Hub */}
      <Suspense fallback={null}>
        {isGoogleModalOpen && (
          <GoogleMerchantModal
            isOpen={isGoogleModalOpen}
            onClose={() => setIsGoogleModalOpen(false)}
            products={products}
            categories={categories}
            company={company}
            onLoggedExport={(exportTitle) => {
              addActivity('catalog_exported', `Exportación Google: ${exportTitle}`, 'Generado para Google Merchant Center');
            }}
          />
        )}
      </Suspense>

      {/* 5. Payment Gateway / POS Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cart={cart}
        total={cartTotal}
        subtotal={cartSubtotal}
        discount={posDiscount}
        company={company}
        currentUser={currentUser}
        isPublicStore={appMode === 'store'}
        onCompleteSale={handleCompleteSale}
        onClearCart={handleClearCart}
      />

      {/* 6. Admin Users & Permissions Modal */}
      <Suspense fallback={null}>
        {isUsersModalOpen && (
          <AdminUsersModal
            users={users}
            currentUser={currentUser}
            isOpen={isUsersModalOpen}
            onClose={() => setIsUsersModalOpen(false)}
            onSaveUser={handleSaveUser}
            onSwitchUser={handleSwitchUser}
          />
        )}
      </Suspense>

      {/* 7. Company Settings Modal - Exclusive for Admin in Staff Mode */}
      <Suspense fallback={null}>
        {appMode === 'staff' && currentUser.role === 'admin' && isCompanyModalOpen && (
          <CompanySettingsModal
            company={company}
            isOpen={isCompanyModalOpen}
            onClose={() => setIsCompanyModalOpen(false)}
            onSave={handleSaveCompany}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
          />
        )}
      </Suspense>

      {/* 8. Backup & Restore Modal (Download & Import JSON) - Admin Only */}
      <Suspense fallback={null}>
        {appMode === 'staff' && currentUser.role === 'admin' && isBackupModalOpen && (
          <BackupRestoreModal
            isOpen={isBackupModalOpen}
            onClose={() => setIsBackupModalOpen(false)}
            products={products}
            categories={categories}
            company={company}
            users={users}
            sales={sales}
            activityLogs={logs}
            onRestore={handleRestoreBackup}
            onLoggedActivity={(title, details) => {
              addActivity('backup_downloaded', title, details);
            }}
            onOpenRecoveryModal={() => setIsRecoveryModalOpen(true)}
          />
        )}
      </Suspense>

      {/* Recovery & Mass Import Modal - Staff Mode Only */}
      <Suspense fallback={null}>
        {appMode === 'staff' && isRecoveryModalOpen && (
          <RecoveryModal
            isOpen={isRecoveryModalOpen}
            onClose={() => setIsRecoveryModalOpen(false)}
            currentProducts={products}
            onRecoverProducts={handleRecoverProducts}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
          />
        )}
      </Suspense>

      {/* 9. Real-time Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }}
        onClearAll={() => setNotifications([])}
        onSelectNotification={(notif) => {
          if (notif.productId) {
            const p = products.find(prod => prod.id === notif.productId);
            if (p) setDetailProduct(p);
          }
          setIsNotificationsOpen(false);
        }}
      />

      {/* 10. Staff Login Modal (Password Security & Mandatory Setup) */}
      <AuthLoginModal
        isOpen={isAuthLoginModalOpen}
        onClose={() => setIsAuthLoginModalOpen(false)}
        users={users}
        onSuccess={handleAuthSuccess}
        onUpdateUserPassword={handleUpdateUserPassword}
        company={company}
      />

      {/* 11. QR Code Scanned Under Construction Notice */}
      <UnderConstructionModal
        isOpen={isConstructionModalOpen}
        onClose={() => {
          setIsConstructionModalOpen(false);
          setScannedQrProduct(null);
        }}
        product={scannedQrProduct}
        company={company}
      />

      {/* 12. Legal Notice Modal (Terms, Privacy Law 25.326 & Warranty) */}
      <Suspense fallback={null}>
        {isLegalModalOpen && (
          <LegalNoticeModal
            isOpen={isLegalModalOpen}
            onClose={() => setIsLegalModalOpen(false)}
            company={company}
            initialTab={legalModalTab}
          />
        )}
      </Suspense>

      {/* 13. Toast Notification when adding product to cart */}
      <CartConfirmationToast
        toast={cartToast}
        onClose={clearCartToast}
        onOpenCart={() => {
          if (appMode === 'store') {
            setIsCustomerCartOpen(true);
          } else {
            setActiveTab('pos');
          }
        }}
      />
    </div>
  );
}
