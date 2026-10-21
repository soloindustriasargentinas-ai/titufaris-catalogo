import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
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
  Share2,
  ExternalLink,
  Globe,
  Construction,
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
import { triggerStoreDailyBackup } from './utils/dailyBackup';

import {
  validateFirestoreConnection,
  fetchProductsFromFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  seedProductsToFirestore,
  subscribeToProductsFirestore,
  subscribeToCategoriesFirestore,
  subscribeToCompanyFirestore,
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
  saveSaaSTenantToFirestore,
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
import { ShareProductModal } from './components/ShareProductModal';
import { DemoModeBanner } from './components/DemoModeBanner';
import { SiteMapModal } from './components/SiteMapModal';
import { genericCompany, genericCategories, genericProducts, genericUsers } from './data/genericStoreData';
import { updateSeoMetadata, slugify, generateProductDescriptiveSlug } from './utils/seoAndRouting';

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
const MasterAdminPanelModal = lazy(() => import('./components/MasterAdminPanelModal').then(m => ({ default: m.MasterAdminPanelModal })));
const SaaSSubscriptionModal = lazy(() => import('./components/SaaSSubscriptionModal').then(m => ({ default: m.SaaSSubscriptionModal })));
const CreateTenantModal = lazy(() => import('./components/CreateTenantModal').then(m => ({ default: m.CreateTenantModal })));
const CustomDomainModal = lazy(() => import('./components/CustomDomainModal').then(m => ({ default: m.CustomDomainModal })));
const MultiSucursalModal = lazy(() => import('./components/MultiSucursalModal').then(m => ({ default: m.MultiSucursalModal })));
import { sendBrowserPushNotification } from './utils/webNotifications';

import { CookieConsentBanner } from './components/CookieConsentBanner';
import { TenantStatusBanner } from './components/TenantStatusBanner';
import { TenantSuspendedNotice } from './components/TenantSuspendedNotice';
import { LegalTab } from './components/LegalNoticeModal';
import { CartConfirmationToast } from './components/CartConfirmationToast';
import { StoreNotFoundView } from './components/StoreNotFoundView';
import { useCart } from './hooks/useCart';
import { useCatalogFilter } from './hooks/useCatalogFilter';
import { playBeep, playSuccessChime, playWarningAlert } from './utils/audio';
import { scanBrowserForLostProducts } from './utils/recovery';
import { syncSingleProductToMetaCatalog, deleteProductFromMetaCatalog } from './utils/metaCatalogApi';
import { SaaSTenantStore } from './types/saas';
import { loadSaaSTenants, saveSaaSTenants, getActiveTenantId, setActiveTenantId, syncTenantsWithFirestore } from './utils/saasStorage';
import { saasCompany, saasCategories, saasProducts, saasUsers } from './data/saasDemoData';

export default function App() {
  // Authoritative initial tenant resolution
  const resolvedTenantId = useMemo(() => getActiveTenantId(), []);

  // Main State initialized with the CURRENT tenant's data (isolated branding & products)
  const [products, setProducts] = useState<Product[]>(() => {
    if (resolvedTenantId === 'titufaris') return loadProducts('titufaris');
    if (resolvedTenantId === 'demo-generica') return genericProducts;
    return loadProducts(resolvedTenantId);
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    if (resolvedTenantId === 'titufaris') return loadCategories('titufaris');
    if (resolvedTenantId === 'demo-generica') return genericCategories;
    return loadCategories(resolvedTenantId);
  });
  const [company, setCompany] = useState<CompanyProfile>(() => {
    if (resolvedTenantId === 'titufaris') return loadCompany('titufaris');
    if (resolvedTenantId === 'demo-generica') return genericCompany;
    return loadCompany(resolvedTenantId);
  });
  const [users, setUsers] = useState<User[]>(loadUsers);
  const [sales, setSales] = useState<Sale[]>(() => loadSales(resolvedTenantId));
  const [logs, setLogs] = useState<ActivityLog[]>(() => loadLogs(resolvedTenantId));
  const [notifications, setNotifications] = useState<PushNotification[]>(() => loadNotifications(resolvedTenantId));

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
  } = useCart(company);

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
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
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
  const [isSitemapModalOpen, setIsSitemapModalOpen] = useState(false);
  const [isMultiSucursalModalOpen, setIsMultiSucursalModalOpen] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState<string>('branch-central');

  const handleOpenLegalModal = (tab: LegalTab = 'terms') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  // ---------------- GENERIC STORE DEMO MODE (MARCA BLANCA) ----------------
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const hostname = window.location.hostname.toLowerCase();
      // tiendas.titufaris.online siempre muestra la tienda genérica con la oferta de 3 meses gratis
      if (hostname === 'tiendas.titufaris.online' || hostname === 'www.tiendas.titufaris.online') {
        return true;
      }
      const p = new URLSearchParams(window.location.search);
      return (
        p.get('demo') === 'generica' ||
        p.get('demo') === 'true' ||
        p.get('demo') === '1' ||
        p.get('tienda') === 'demo' ||
        p.get('tienda') === 'generica' ||
        p.get('tienda') === 'tiendas'
      );
    } catch {
      return false;
    }
  });

  const isTiendasHost = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const h = window.location.hostname.toLowerCase();
    return h === 'tiendas.titufaris.online' || h === 'www.tiendas.titufaris.online';
  }, []);

  const isDemoModeRef = useRef(isDemoMode);
  isDemoModeRef.current = isDemoMode;

  const realDataBackupRef = useRef<{
    products: Product[];
    categories: Category[];
    company: CompanyProfile;
    users: User[];
  } | null>(null);

  const handleEnterDemoMode = () => {
    realDataBackupRef.current = {
      products,
      categories,
      company,
      users,
    };
    setProducts(genericProducts);
    setCategories(genericCategories);
    setCompany(genericCompany);
    setUsers(genericUsers);
    setSelectedCategory('all');
    setSearchQuery('');
    setDetailProduct(null);
    setIsDemoMode(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('demo', 'generica');
      window.history.pushState({}, '', url.toString());
      document.title = 'Mi Tienda - Demostración de Catálogo Genérico';
    } catch {}
  };

  const handleExitDemoMode = () => {
    if (realDataBackupRef.current) {
      setProducts(realDataBackupRef.current.products);
      setCategories(realDataBackupRef.current.categories);
      setCompany(realDataBackupRef.current.company);
      setUsers(realDataBackupRef.current.users);
    } else {
      setProducts(loadProducts());
      setCategories(loadCategories());
      setCompany(loadCompany());
      setUsers(loadUsers());
    }
    setSelectedCategory('all');
    setSearchQuery('');
    setDetailProduct(null);
    setIsDemoMode(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('demo');
      url.searchParams.delete('tienda');
      window.history.pushState(
        {},
        '',
        url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '')
      );
      document.title = 'Titufaris - Catálogo, Precios & POS';
    } catch {}
  };

  // If initial URL had demo=generica, initialize demo data on mount
  useEffect(() => {
    if (isDemoMode) {
      realDataBackupRef.current = {
        products: loadProducts(),
        categories: loadCategories(),
        company: loadCompany(),
        users: loadUsers(),
      };
      setProducts(genericProducts);
      setCategories(genericCategories);
      setCompany(genericCompany);
      setUsers(genericUsers);
      document.title = 'Mi Tienda - Demostración de Catálogo Genérico';
    }
  }, []);

  // ---------------- SAAS MULTI-TENANCY & MASTER PANEL ----------------
  const [saasTenants, setSaaSTenants] = useState<SaaSTenantStore[]>(loadSaaSTenants);
  const [activeTenantId, setActiveTenantIdState] = useState<string>(getActiveTenantId);
  const [isMasterPanelOpen, setIsMasterPanelOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname.toLowerCase();
    // admin.titufaris.online abre directamente las herramientas de administración de la SaaS con contraseña
    if (hostname === 'admin.titufaris.online' || hostname === 'www.admin.titufaris.online') {
      return true;
    }
    const p = new URLSearchParams(window.location.search);
    return p.get('panel') === 'maestro' || p.get('admin') === 'saas' || p.get('saas') === '1';
  });
  const [isSaaSSubscriptionModalOpen, setIsSaaSSubscriptionModalOpen] = useState<boolean>(false);
  const [isCreateTenantModalOpen, setIsCreateTenantModalOpen] = useState<boolean>(false);
  const [isCustomDomainModalOpen, setIsCustomDomainModalOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const p = new URLSearchParams(window.location.search);
    return p.get('dominio') === 'config' || p.get('domain') === 'setup';
  });

  // Verification of subdomain existence (protect against uncreated subdomains like roca.titufaris.online)
  const isKnownTenantLocally = useMemo(() => {
    if (resolvedTenantId === 'titufaris' || resolvedTenantId === 'demo-generica') return true;
    return saasTenants.some(
      t => t.id.toLowerCase() === resolvedTenantId.toLowerCase() || t.slug.toLowerCase() === resolvedTenantId.toLowerCase()
    );
  }, [resolvedTenantId, saasTenants]);

  const [isTenantChecking, setIsTenantChecking] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (resolvedTenantId === 'titufaris' || resolvedTenantId === 'demo-generica') return false;
    return !isKnownTenantLocally;
  });
  const [tenantNotFound, setTenantNotFound] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (resolvedTenantId === 'titufaris' || resolvedTenantId === 'demo-generica') return false;
    return !isKnownTenantLocally;
  });

  const activeTenant = useMemo(() => {
    const found = saasTenants.find(
      t => t.id === activeTenantId || t.slug.toLowerCase() === activeTenantId.toLowerCase()
    );
    if (found) return found;
    return saasTenants[0];
  }, [saasTenants, activeTenantId]);

  // Sync tenants with Firestore cloud on startup & verify active custom domain tenant
  useEffect(() => {
    syncTenantsWithFirestore(saasTenants).then(synced => {
      setSaaSTenants(synced);
      const currentResolved = getActiveTenantId();
      if (currentResolved !== 'titufaris' && currentResolved !== 'demo-generica') {
        const matched = synced.find(
          t => t.id.toLowerCase() === currentResolved.toLowerCase() || t.slug.toLowerCase() === currentResolved.toLowerCase()
        );
        if (matched) {
          setTenantNotFound(false);
          setIsTenantChecking(false);
          setActiveTenantIdState(matched.id);
          setActiveTenantId(matched.id);
          handleSelectTenant(matched.id, synced);
        } else {
          // The subdomain does NOT exist in Firestore -> Display 404!
          setTenantNotFound(true);
          setIsTenantChecking(false);
        }
      } else {
        setTenantNotFound(false);
        setIsTenantChecking(false);
      }
    }).catch(err => {
      console.warn('Firestore tenants sync error:', err);
      setIsTenantChecking(false);
      if (!isKnownTenantLocally) {
        setTenantNotFound(true);
      }
    });

    if (activeTenantId && activeTenantId !== 'titufaris' && activeTenantId !== 'demo-generica') {
      const known = saasTenants.find(
        t => t.id.toLowerCase() === activeTenantId.toLowerCase() || t.slug.toLowerCase() === activeTenantId.toLowerCase()
      );
      if (known) {
        handleSelectTenant(known.id);
      }
    }
  }, []);

  const handleSelectTenant = (tenantId: string, currentTenantsList?: SaaSTenantStore[]) => {
    const listToSearch = currentTenantsList || saasTenants;
    const tenant = listToSearch.find(
      t => t.id === tenantId || t.slug.toLowerCase() === tenantId.toLowerCase()
    );
    const resolvedTenantId = tenant ? tenant.id : tenantId;

    setActiveTenantIdState(resolvedTenantId);
    setActiveTenantId(resolvedTenantId);

    if (resolvedTenantId === 'titufaris') {
      // Flagship Titufaris store: Always keep and restore standard Titufaris catalog and settings
      handleExitDemoMode();
      const tituProds = loadProducts('titufaris');
      setProducts(tituProds);
      const tituCats = loadCategories('titufaris');
      setCategories(tituCats);
      const tituComp = loadCompany('titufaris');
      setCompany(tituComp);
      const tituSales = loadSales('titufaris');
      setSales(tituSales);
      const tituLogs = loadLogs('titufaris');
      setLogs(tituLogs);
      const tituNotifs = loadNotifications('titufaris');
      setNotifications(tituNotifs);

      fetchProductsFromFirestore('titufaris').then(res => {
        if (res.success && res.data && res.data.length > 0) {
          setProducts(res.data);
          saveProducts(res.data, 'titufaris');
        }
      });
      fetchCategoriesFromFirestore('titufaris').then(remoteCats => {
        if (remoteCats && remoteCats.length > 0) {
          setCategories(remoteCats);
          saveCategories(remoteCats, 'titufaris');
        }
      });
      fetchSalesFromFirestore('titufaris').then(remoteSales => {
        if (remoteSales && remoteSales.length > 0) {
          setSales(remoteSales);
          saveSales(remoteSales, 'titufaris');
        }
      });
      document.title = 'Titufaris - Catálogo, Precios & POS';
    } else {
      // If switching to an individual tenant (like zapas), exit demo mode completely and clean trailing slugs
      if (resolvedTenantId !== 'demo-generica') {
        setIsDemoMode(false);
        try {
          const url = new URL(window.location.href);
          if (url.searchParams.has('demo') || url.searchParams.has('tienda')) {
            url.searchParams.delete('demo');
            url.searchParams.delete('tienda');
            window.history.replaceState(
              {},
              '',
              url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '')
            );
          }
        } catch {}
      }

      const tenantToUse: SaaSTenantStore = tenant || {
        id: resolvedTenantId,
        name: resolvedTenantId.charAt(0).toUpperCase() + resolvedTenantId.slice(1),
        slug: resolvedTenantId.toLowerCase(),
        customDomain: `${resolvedTenantId.toLowerCase()}.titufaris.online`,
        domainStatus: 'ssl_active',
        ownerName: `${resolvedTenantId.charAt(0).toUpperCase() + resolvedTenantId.slice(1)} Admin`,
        ownerEmail: `contacto@${resolvedTenantId.toLowerCase()}.titufaris.online`,
        ownerPhone: '+54 9 11 5829-4310',
        planId: 'pro',
        subscriptionStatus: 'trial',
        pricePerMonthARS: 16990,
        billingCycle: 'monthly',
        createdAt: new Date().toISOString(),
        trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        nextBillingDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        technicalHealth: {
          status: 'healthy',
          productsCount: 0,
          categoriesCount: 0,
          salesCount: 0,
          lastSyncAt: new Date().toISOString(),
          storageKB: 120,
          maintenanceMode: false,
          issuesDetected: [],
          lastDiagnosticAt: new Date().toISOString()
        }
      };

      const tenantComp = loadCompany(resolvedTenantId);
      setCompany(tenantComp);

      // Synchronously load cached tenant data FIRST so user-saved changes are immediately active
      const tenantProds = loadProducts(resolvedTenantId);
      setProducts(tenantProds);

      const tenantCats = loadCategories(resolvedTenantId);
      setCategories(tenantCats);

      const tenantSales = loadSales(resolvedTenantId);
      setSales(tenantSales);

      const tenantLogs = loadLogs(resolvedTenantId);
      setLogs(tenantLogs);

      const tenantNotifs = loadNotifications(resolvedTenantId);
      setNotifications(tenantNotifs);

      // Then check Firestore for any newer cloud updates or seed if empty
      fetchCompanyFromFirestore(resolvedTenantId).then(remoteCompany => {
        if (remoteCompany) {
          setCompany(remoteCompany);
          saveCompany(remoteCompany, resolvedTenantId);
        } else {
          saveCompanyToFirestore(tenantComp, resolvedTenantId).catch(() => {});
        }
      });

      fetchProductsFromFirestore(resolvedTenantId).then(res => {
        if (res.success && res.data && res.data.length > 0) {
          const cleaned = cleanProductList(res.data, resolvedTenantId);
          setProducts(cleaned);
          saveProducts(cleaned, resolvedTenantId);
        } else if (tenantProds.length > 0) {
          seedProductsToFirestore(tenantProds, resolvedTenantId).catch(() => {});
        }
      });

      fetchCategoriesFromFirestore(resolvedTenantId).then(remoteCats => {
        if (remoteCats && remoteCats.length > 0) {
          setCategories(remoteCats);
          saveCategories(remoteCats, resolvedTenantId);
        } else if (tenantCats.length > 0) {
          seedCategoriesToFirestore(tenantCats, resolvedTenantId).catch(() => {});
        }
      });

      fetchSalesFromFirestore(resolvedTenantId).then(remoteSales => {
        if (remoteSales && remoteSales.length > 0) {
          setSales(remoteSales);
          saveSales(remoteSales, resolvedTenantId);
        }
      });

      setSelectedCategory('all');
      setSearchQuery('');
      setDetailProduct(null);
      document.title = `${tenantToUse.name} - Catálogo & POS Oficial`;
    }
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

    // Deep link query check for QR codes, sitemap, categories and direct product URLs
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const prodId = urlParams.get('p') || urlParams.get('id') || urlParams.get('producto') || urlParams.get('product');
      const sku = urlParams.get('sku');
      const catParam = urlParams.get('categoria') || urlParams.get('cat');
      const viewParam = urlParams.get('vista') || urlParams.get('view');

      if (viewParam === 'mapa-del-sitio' || urlParams.has('sitemap')) {
        setIsSitemapModalOpen(true);
      }

      if (catParam) {
        const foundCat = categories.find(c => c.id === catParam || slugify(c.name) === catParam);
        if (foundCat) setSelectedCategory(foundCat.id);
      }

      if (prodId || sku) {
        const found = products.find(
          p =>
            (prodId && (
              p.id === prodId ||
              slugify(p.name) === prodId ||
              generateProductDescriptiveSlug(p) === prodId ||
              (p as any).slug === prodId ||
              prodId.startsWith(slugify(p.name)) ||
              (p.sku && prodId.includes(slugify(p.sku)))
            )) ||
            (sku && p.sku.toLowerCase() === sku.toLowerCase())
        );
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

  // Reactive QR scan / deep link handler: opens product or sitemap as soon as products list is synced from DB
  const hasProcessedDeepLinkRef = useRef(false);
  useEffect(() => {
    if (products.length === 0 || hasProcessedDeepLinkRef.current) return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const prodId = urlParams.get('p') || urlParams.get('id') || urlParams.get('producto') || urlParams.get('product');
      const sku = urlParams.get('sku');
      const catParam = urlParams.get('categoria') || urlParams.get('cat');
      const viewParam = urlParams.get('vista') || urlParams.get('view');

      if (viewParam === 'mapa-del-sitio' || urlParams.has('sitemap')) {
        setIsSitemapModalOpen(true);
      }

      if (catParam) {
        const foundCat = categories.find(c => c.id === catParam || slugify(c.name) === catParam);
        if (foundCat) setSelectedCategory(foundCat.id);
      }

      if (prodId || sku) {
        const found = products.find(
          p =>
            (prodId && (
              p.id === prodId ||
              slugify(p.name) === prodId ||
              generateProductDescriptiveSlug(p) === prodId ||
              (p as any).slug === prodId ||
              prodId.startsWith(slugify(p.name)) ||
              (p.sku && prodId.includes(slugify(p.sku)))
            )) ||
            (sku && p.sku.toLowerCase() === sku.toLowerCase())
        );
        if (found) {
          setDetailProduct(found);
          hasProcessedDeepLinkRef.current = true;
        }
      }
    } catch {
      // Safe catch
    }
  }, [products, categories]);

  // Dynamic URL Synchronization and SEO Metadata Updates (Titles, Meta Descriptions & Canonical URLs)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentUrl = new URL(window.location.href);

    if (detailProduct) {
      // Product Detail View: URL descriptiva relativa al producto donde se lee la descripción
      const descriptiveSlug = generateProductDescriptiveSlug(detailProduct);

      currentUrl.searchParams.set('producto', descriptiveSlug);
      currentUrl.searchParams.set('p', detailProduct.id);
      currentUrl.searchParams.delete('vista');
      window.history.replaceState({ productId: detailProduct.id }, '', currentUrl.toString());

      const pageTitle = `${detailProduct.name} | ${company.name}`;
      const pageDesc = `${detailProduct.name} (${detailProduct.sku}) en ${company.name}: ${
        detailProduct.description ? detailProduct.description.slice(0, 110) : 'Equipamiento comercial'
      }. Precio: ${formatCurrency(detailProduct.retailPrice)}. Atención y envíos por WhatsApp.`;
      const prodImg = (detailProduct.images && detailProduct.images[0]) || detailProduct.imageUrl;

      updateSeoMetadata({
        title: pageTitle,
        description: pageDesc,
        ogImage: prodImg,
        canonicalUrl: currentUrl.toString(),
      });
    } else if (isSitemapModalOpen) {
      // Sitemap View
      currentUrl.searchParams.set('vista', 'mapa-del-sitio');
      currentUrl.searchParams.delete('producto');
      currentUrl.searchParams.delete('p');
      window.history.replaceState({ view: 'mapa-del-sitio' }, '', currentUrl.toString());

      updateSeoMetadata({
        title: `Mapa del Sitio Web | ${company.name}`,
        description: `Estructura de navegación jerárquica y mapa del sitio web de ${company.name}. Acceso directo a todas las categorías, productos y formato sitemap.xml para buscadores.`,
        canonicalUrl: currentUrl.toString(),
      });
    } else {
      // General Store / Home View
      let hasUrlModifications = false;
      if (currentUrl.searchParams.has('p') || currentUrl.searchParams.has('producto') || currentUrl.searchParams.has('vista')) {
        currentUrl.searchParams.delete('p');
        currentUrl.searchParams.delete('id');
        currentUrl.searchParams.delete('producto');
        currentUrl.searchParams.delete('product');
        currentUrl.searchParams.delete('vista');
        currentUrl.searchParams.delete('view');
        currentUrl.searchParams.delete('sku');
        currentUrl.searchParams.delete('from');
        hasUrlModifications = true;
      }

      if (selectedCategory && selectedCategory !== 'all') {
        const cat = categories.find(c => c.id === selectedCategory);
        if (cat) {
          currentUrl.searchParams.set('categoria', slugify(cat.name));
          currentUrl.searchParams.set('cat', cat.id);
          hasUrlModifications = true;
        }
      } else {
        if (currentUrl.searchParams.has('categoria') || currentUrl.searchParams.has('cat')) {
          currentUrl.searchParams.delete('categoria');
          currentUrl.searchParams.delete('cat');
          hasUrlModifications = true;
        }
      }

      if (hasUrlModifications) {
        const cleanPath = currentUrl.pathname + (currentUrl.searchParams.toString() ? `?${currentUrl.searchParams.toString()}` : '');
        window.history.replaceState({}, '', cleanPath);
      }

      // Dynamic Title & Meta Description for Home / Category
      if (selectedCategory && selectedCategory !== 'all') {
        const cat = categories.find(c => c.id === selectedCategory);
        const catName = cat?.name || selectedCategory;
        updateSeoMetadata({
          title: `${catName} | Catálogo ${company.name}`,
          description: `Línea de ${catName} en ${company.name}: catálogo con listas de precios mayorista y minorista, especificaciones técnicas y envíos a todo el país.`,
          canonicalUrl: currentUrl.toString(),
        });
      } else {
        const homeTitle = isDemoMode
          ? 'Mi Tienda | Catálogo Digital & POS'
          : company.heroTitle
          ? `${company.name} | ${company.heroTitle.slice(0, 48)}`
          : 'Titufaris | Góndolas, Estanterías Metálicas y Racks';

        const homeDesc =
          company.metaDescription ||
          (isDemoMode
            ? 'Demostración interactiva de catálogo digital multirubro y punto de venta para negocios y empresas: diseño responsivo, stock en vivo y pedidos a WhatsApp.'
            : 'Fabricación directa de góndolas comerciales, estanterías metálicas, racks y lockers para comercios e industrias. Envíos a todo el país y atención personalizada.');

        updateSeoMetadata({
          title: homeTitle,
          description: homeDesc,
          ogImage: company.heroImageUrl,
          canonicalUrl: currentUrl.toString(),
        });
      }
    }
  }, [detailProduct, isSitemapModalOpen, selectedCategory, company, isDemoMode]);

  // Handle browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const prodId = urlParams.get('p') || urlParams.get('id') || urlParams.get('producto') || urlParams.get('product');
        const sku = urlParams.get('sku');
        const catParam = urlParams.get('categoria') || urlParams.get('cat');
        const viewParam = urlParams.get('vista') || urlParams.get('view');

        if (viewParam === 'mapa-del-sitio' || urlParams.has('sitemap')) {
          setIsSitemapModalOpen(true);
        } else {
          setIsSitemapModalOpen(false);
        }

        if (catParam) {
          const foundCat = categories.find(c => c.id === catParam || slugify(c.name) === catParam);
          if (foundCat) setSelectedCategory(foundCat.id);
        }

        if (prodId || sku) {
          const found = products.find(
            p =>
              (prodId && (p.id === prodId || slugify(p.name) === prodId || (p as any).slug === prodId)) ||
              (sku && p.sku.toLowerCase() === sku.toLowerCase())
          );
          if (found) {
            setDetailProduct(found);
          }
        } else {
          setDetailProduct(null);
        }
      } catch {
        // Safe catch
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products, categories]);

  // Sync from high-capacity IndexedDB and Firebase Firestore on startup & real-time listeners for all stores
  useEffect(() => {
    let isCancelled = false;
    let unsubProducts: (() => void) | undefined;
    let unsubCategories: (() => void) | undefined;
    let unsubCompany: (() => void) | undefined;

    const currentTenant = activeTenantId || 'titufaris';

    // 1. Fast local load from IndexedDB
    syncProductsFromIndexedDB(currentTenant).then(idbProducts => {
      if (isCancelled) return;
      if (idbProducts && Array.isArray(idbProducts) && idbProducts.length > 0) {
        setProducts(idbProducts);
      }
    });

    // 2. Parallel cloud fetch from Firestore (Zero latency canary bypass)
    const syncCloudData = async () => {
      try {
        const [prodRes, remoteCats, remoteCompany] = await Promise.all([
          fetchProductsFromFirestore(currentTenant),
          fetchCategoriesFromFirestore(currentTenant),
          fetchCompanyFromFirestore(currentTenant)
        ]);

        if (isCancelled) return;

        // Products sync & auto-seed if cloud collection is empty for this tenant
        if (prodRes.success && Array.isArray(prodRes.data) && prodRes.data.length > 0) {
          const cleaned = cleanProductList(prodRes.data, currentTenant);
          setProducts(cleaned);
          saveProducts(cleaned, currentTenant);
          setSyncStatus('synced');
        } else {
          const localProducts = loadProducts(currentTenant);
          if (localProducts && localProducts.length > 0) {
            setProducts(localProducts);
            seedProductsToFirestore(localProducts, currentTenant).catch(() => {});
          }
        }

        // Categories sync & auto-seed
        if (remoteCats && Array.isArray(remoteCats) && remoteCats.length > 0) {
          setCategories(remoteCats);
          saveCategories(remoteCats, currentTenant);
        } else {
          const localCats = loadCategories(currentTenant);
          if (localCats && localCats.length > 0) {
            setCategories(localCats);
            seedCategoriesToFirestore(localCats, currentTenant).catch(() => {});
          }
        }

        // Company profile sync & auto-seed
        if (remoteCompany) {
          setCompany(remoteCompany);
          saveCompany(remoteCompany, currentTenant);
        } else {
          const localComp = loadCompany(currentTenant);
          if (localComp) {
            saveCompanyToFirestore(localComp, currentTenant).catch(() => {});
          }
        }

        // Sales records sync
        fetchSalesFromFirestore(currentTenant).then(remoteSales => {
          if (isCancelled) return;
          const validRemoteSales = (remoteSales || []).filter(
            s => s && s.id && !s.id.startsWith('sale-init') && s.id !== 'sale-1789132222175'
          );
          if (validRemoteSales.length > 0) {
            const currentLocalSales = loadSales(currentTenant);
            const salesMap = new Map<string, Sale>();
            validRemoteSales.forEach(s => salesMap.set(s.id, s));
            currentLocalSales.forEach(s => {
              if (!salesMap.has(s.id)) salesMap.set(s.id, s);
            });
            const mergedSales = Array.from(salesMap.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setSales(mergedSales);
            saveSales(mergedSales, currentTenant);
          }
        });

        // Activity logs sync
        fetchActivityLogsFromFirestore(currentTenant, 100).then(remoteLogs => {
          if (isCancelled) return;
          if (remoteLogs && remoteLogs.length > 0) {
            const localLogs = loadLogs(currentTenant);
            const logsMap = new Map<string, ActivityLog>();
            remoteLogs.forEach(l => logsMap.set(l.id, l));
            localLogs.forEach(l => {
              if (!logsMap.has(l.id)) logsMap.set(l.id, l);
            });
            const mergedLogs = Array.from(logsMap.values()).sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ).slice(0, 200);
            setLogs(mergedLogs);
            saveLogs(mergedLogs, currentTenant);
          }
        });

        // Users sync (credentials)
        fetchUsersFromFirestore().then(remoteUsers => {
          if (isCancelled) return;
          if (remoteUsers && remoteUsers.length > 0) {
            const localUsers = loadUsers();
            const userMap = new Map<string, User>();
            localUsers.forEach(u => userMap.set(u.id, u));
            remoteUsers.forEach(u => userMap.set(u.id, u));
            const mergedUsers = Array.from(userMap.values());
            setUsers(mergedUsers);
            saveUsers(mergedUsers);
          }
        });
      } catch (err) {
        console.warn('Firestore multi-tenant sync notification:', err);
      }
    };

    syncCloudData();

    // 3. Attach real-time subscriptions for ALL tenants so any modification in any browser broadcasts live!
    unsubProducts = subscribeToProductsFirestore((remoteProducts) => {
      if (isCancelled) return;
      if (remoteProducts && Array.isArray(remoteProducts) && remoteProducts.length > 0) {
        const cleaned = cleanProductList(remoteProducts, currentTenant);
        setProducts(cleaned);
        saveProducts(cleaned, currentTenant);
        setSyncStatus('synced');
      }
    }, undefined, currentTenant);

    unsubCategories = subscribeToCategoriesFirestore((remoteCats) => {
      if (isCancelled) return;
      if (remoteCats && Array.isArray(remoteCats) && remoteCats.length > 0) {
        setCategories(remoteCats);
        saveCategories(remoteCats, currentTenant);
      }
    }, undefined, currentTenant);

    unsubCompany = subscribeToCompanyFirestore((remoteComp) => {
      if (isCancelled) return;
      if (remoteComp) {
        setCompany(remoteComp);
        saveCompany(remoteComp, currentTenant);
      }
    }, undefined, currentTenant);

    return () => {
      isCancelled = true;
      unsubProducts?.();
      unsubCategories?.();
      unsubCompany?.();
    };
  }, [activeTenantId]);

  // Save changes to persistent storage
  useEffect(() => {
    saveProducts(products, activeTenantId);
  }, [products, activeTenantId]);

  useEffect(() => {
    saveCategories(categories, activeTenantId);
  }, [categories, activeTenantId]);

  useEffect(() => {
    saveCompany(company, activeTenantId);
  }, [company, activeTenantId]);

  // Automated Daily Snapshot: Overwrites single rolling daily backup per tenant in Firestore and local storage
  useEffect(() => {
    if (products.length > 0 && !isDemoModeRef.current) {
      triggerStoreDailyBackup(
        activeTenantId,
        activeTenant?.name || activeTenantId,
        products,
        categories,
        company,
        { debounced: true }
      );
    }
  }, [products, categories, company, activeTenantId, activeTenant?.name]);

  useEffect(() => {
    saveUsers(users);
  }, [users]);

  useEffect(() => {
    saveSales(sales, activeTenantId);
  }, [sales, activeTenantId]);

  useEffect(() => {
    saveLogs(logs, activeTenantId);
  }, [logs, activeTenantId]);

  useEffect(() => {
    saveNotifications(notifications, activeTenantId);
  }, [notifications, activeTenantId]);

  // Cloud Sync Handler: Reconciles all local data with Firestore
  const triggerCloudSync = async () => {
    if (isDemoModeRef.current) {
      setSyncStatus('synced');
      return;
    }

    if (isSimulatedOffline || !isOnline) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');
    try {
      await seedProductsToFirestore(products, activeTenantId);
      await seedCategoriesToFirestore(categories, activeTenantId);
      const realSales = (sales || []).filter(s => s && s.id && !s.id.startsWith('sale-init') && s.id !== 'sale-1789132222175');
      if (realSales.length > 0) {
        await seedSalesToFirestore(realSales, activeTenantId);
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
      saveActivityLogToFirestore(newLog, activeTenantId).catch(err => console.warn('Activity log firestore error:', err));
      setTimeout(() => setSyncStatus('synced'), 800);
    }
  };

  // Product Handlers
  const handleSaveProduct = async (
    productData: Omit<Product, 'id' | 'updatedAt' | 'updatedBy'> & { id?: string }
  ) => {
    const now = new Date().toISOString();

    if (isDemoMode) {
      if (productData.id) {
        const updatedProduct = {
          ...productData,
          updatedAt: now,
          updatedBy: currentUser.name,
        } as Product;
        setProducts(prev => prev.map(p => (p.id === productData.id ? updatedProduct : p)));
        if (detailProduct?.id === productData.id) setDetailProduct(updatedProduct);
        if (editingProduct?.id === productData.id) setEditingProduct(null);
      } else {
        const newProduct = {
          ...productData,
          id: `demo-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
          updatedBy: currentUser.name,
        } as Product;
        setProducts(prev => [newProduct, ...prev]);
      }
      setIsProductFormOpen(false);
      return;
    }

    if (productData.id) {
      unmarkProductAsDeleted(productData.id, activeTenantId);
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
        saveProducts(next, activeTenantId);
        return next;
      });

      if (detailProduct?.id === productData.id) {
        setDetailProduct(updatedProduct);
      }
      if (editingProduct?.id === productData.id) {
        setEditingProduct(null);
      }

      const res = await saveProductToFirestore(updatedProduct, activeTenantId);
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
      // Create new product - Enforce trial and Emprendedor (250 products) limits
      const isTrial = activeTenant.id !== 'titufaris' && (activeTenant.planId === 'trial' || activeTenant.subscriptionStatus === 'trial');
      const isBasic = activeTenant.id !== 'titufaris' && activeTenant.planId === 'basic';
      if (isTrial && products.length >= 250) {
        alert('Has alcanzado el límite de 250 productos de tu prueba gratuita bonificada de 3 meses. Todas las funciones permanecen activas, pero para incorporar más artículos por favor escala al Plan Negocio Pro con productos ilimitados.');
        setIsSaaSSubscriptionModalOpen(true);
        return;
      }
      if (isBasic && products.length >= 250) {
        alert('Has alcanzado el límite de 250 productos del Plan Emprendedor. Para contar con productos ilimitados y multi-caja, por favor escala al Plan Negocio Pro.');
        setIsSaaSSubscriptionModalOpen(true);
        return;
      }

      const newId = 'prod-' + Date.now();
      unmarkProductAsDeleted(newId, activeTenantId);
      const createdProd: Product = {
        id: newId,
        ...productData,
        updatedAt: now,
        updatedBy: currentUser.name,
      };

      setProducts(prev => {
        const next = [createdProd, ...prev];
        saveProducts(next, activeTenantId);
        return next;
      });

      const res = await saveProductToFirestore(createdProd, activeTenantId);
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

  const handleOpenNewProduct = () => {
    const isTrial = activeTenant.id !== 'titufaris' && (activeTenant.planId === 'trial' || activeTenant.subscriptionStatus === 'trial');
    const isBasic = activeTenant.id !== 'titufaris' && activeTenant.planId === 'basic';
    if (isTrial && products.length >= 250) {
      alert('Has alcanzado el límite de 250 productos de tu prueba gratuita bonificada de 3 meses. Todas las funciones permanecen activas, pero para incorporar más artículos por favor escala al Plan Negocio Pro.');
      setIsSaaSSubscriptionModalOpen(true);
      return;
    }
    if (isBasic && products.length >= 250) {
      alert('Has alcanzado el límite de 250 productos del Plan Emprendedor. Para contar con productos ilimitados, por favor escala al Plan Negocio Pro.');
      setIsSaaSSubscriptionModalOpen(true);
      return;
    }
    setEditingProduct(null);
    setIsDuplicateMode(false);
    setIsProductFormOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    if (isDemoMode) {
      setProducts(prev => prev.filter(p => p.id !== product.id));
      removeByProductId(product.id);
      if (detailProduct?.id === product.id) setDetailProduct(null);
      setProductToDelete(null);
      return;
    }

    // 0. Mark permanently as deleted so it can never be resurrected
    markProductAsDeleted(product.id, activeTenantId);

    // 1. Remove from active product catalog and cloud
    setProducts(prev => {
      const next = prev.filter(p => p.id !== product.id);
      saveProducts(next, activeTenantId);
      return next;
    });
    deleteProductFromFirestore(product.id, activeTenantId);

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
    const isTrial = activeTenant.id !== 'titufaris' && (activeTenant.planId === 'trial' || activeTenant.subscriptionStatus === 'trial');
    const isBasic = activeTenant.id !== 'titufaris' && activeTenant.planId === 'basic';
    if (isTrial && products.length >= 250) {
      alert('Has alcanzado el límite de 250 productos de tu prueba gratuita bonificada de 3 meses. Para duplicar y agregar más productos, por favor escala al Plan Negocio Pro.');
      setIsSaaSSubscriptionModalOpen(true);
      return;
    }
    if (isBasic && products.length >= 250) {
      alert('Has alcanzado el límite de 250 productos del Plan Emprendedor. Por favor escala al Plan Negocio Pro para productos ilimitados.');
      setIsSaaSSubscriptionModalOpen(true);
      return;
    }
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
      saveProducts(next, activeTenantId);
      return next;
    });
    saveProductToFirestore(updated, activeTenantId);

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
    setProducts(prev => {
      const next = prev.map(p => (p.id === product.id ? updated : p));
      saveProducts(next, activeTenantId);
      return next;
    });
    saveProductToFirestore(updated, activeTenantId);

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
    saveCategoryToFirestore(newCategory, activeTenantId);
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

  const handleUpdateCategory = (updatedCategory: Category) => {
    setCategories(prev => {
      const updated = prev.map(c => c.id === updatedCategory.id ? updatedCategory : c);
      saveCategories(updated, activeTenantId);
      return updated;
    });
    saveCategoryToFirestore(updatedCategory, activeTenantId);
    addActivity(
      'category_updated',
      `Categoría modificada: ${updatedCategory.name}`,
      `Descripción o color editado por ${currentUser.name}`
    );
    const notif: PushNotification = {
      id: 'notif-' + Date.now(),
      title: 'Categoría Actualizada',
      message: `La categoría "${updatedCategory.name}" fue actualizada en el catálogo y la base de datos.`,
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
    deleteCategoryFromFirestore(categoryId, activeTenantId);

    if (targetCategoryId) {
      const updatedProducts = products.map(p => (p.category === categoryId ? { ...p, category: targetCategoryId } : p));
      seedProductsToFirestore(updatedProducts, activeTenantId);
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
      branchId: activeBranchId,
      branchName: activeBranchId === 'branch-norte' ? 'Sucursal Norte' : activeBranchId === 'branch-deposito' ? 'Depósito Central' : 'Sucursal Central',
      createdAt: new Date().toISOString(),
      ...saleData,
    };

    // 1. Optimistic Local Stock Deduction (including multi-branch stock)
    setProducts(prev => {
      const updated = [...prev];
      saleData.items.forEach(item => {
        const idx = updated.findIndex(p => p.id === item.productId);
        if (idx !== -1) {
          const currentProd = updated[idx];
          const nextStock = Math.max(0, currentProd.stock - item.quantity);
          const nextBranchStock = { ...(currentProd.branchStock || {}) };
          if (activeBranchId) {
            nextBranchStock[activeBranchId] = Math.max(0, (nextBranchStock[activeBranchId] ?? currentProd.stock) - item.quantity);
          }
          updated[idx] = { ...currentProd, stock: nextStock, branchStock: nextBranchStock };

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
            sendBrowserPushNotification(`⚠️ Stock Crítico: ${item.name}`, {
              body: `Nivel de inventario bajo: solo restan ${nextStock} unidades.`
            });
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
        tenantId: activeTenantId,
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

    // 5. Add In-App Notification & Native Browser Push
    const saleNotif: PushNotification = {
      id: 'notif-' + Date.now(),
      title: `Venta Registrada ${saleData.receiptNumber}`,
      message: `Cobrado: ${formatCurrency(saleData.total)} por ${currentUser.name}. Cliente: ${saleData.customerName || 'Consumidor Final'}.`,
      type: 'sale',
      read: false,
      timestamp: 'Recién',
    };
    setNotifications(prev => [saleNotif, ...prev]);

    // Trigger Native Web Push Notification (Plan Pro & Empresa)
    sendBrowserPushNotification(`🛒 Venta Cobrada: ${createdSale.receiptNumber}`, {
      body: `Cobrado: ${formatCurrency(createdSale.total)} • ${createdSale.items.length} artículos por ${currentUser.name}`
    });
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
      cancellationReason,
      activeTenantId
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
            saveProductToFirestore(updatedProd, activeTenantId);
          }
        });
        saveProducts(updated, activeTenantId);
        return updated;
      });
    }

    // 2. Remove sale from state and Firestore
    setSales(prev => prev.filter(s => s.id !== saleId));
    await deleteSaleFromFirestore(saleId, activeTenantId);

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
    saveSales([], activeTenantId);
    try {
      const remote = await fetchSalesFromFirestore(activeTenantId);
      for (const s of remote) {
        await deleteSaleFromFirestore(s.id, activeTenantId);
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
    saveCompany(updatedCompany, activeTenantId);
    saveCompanyToFirestore(updatedCompany, activeTenantId);

    // Keep tenant list in sync with custom store name, branding & publication status
    if (activeTenantId !== 'titufaris' && activeTenantId !== 'demo-generica') {
      setSaaSTenants(prev => {
        const updated = prev.map(t => {
          if (t.id === activeTenantId || t.slug.toLowerCase() === activeTenantId.toLowerCase()) {
            const nextTenant: SaaSTenantStore = {
              ...t,
              name: updatedCompany.name,
              isPublished: updatedCompany.isPublished !== false,
              underConstructionMessage: updatedCompany.underConstructionMessage,
              technicalHealth: {
                ...t.technicalHealth,
                maintenanceMode: updatedCompany.isPublished === false
              }
            };
            saveSaaSTenantToFirestore(nextTenant).catch(() => {});
            return nextTenant;
          }
          return t;
        });
        saveSaaSTenants(updated);
        return updated;
      });
    }

    addActivity(
      'company_updated',
      `Datos y Branding de ${updatedCompany.name} actualizados`,
      `Estado: ${updatedCompany.isPublished !== false ? 'Publicada' : 'En Construcción'} | CUIT: ${updatedCompany.taxId}`
    );
  };

  const handlePublishCurrentStore = () => {
    const updatedCompany: CompanyProfile = { ...company, isPublished: true };
    handleSaveCompany(updatedCompany);
    alert(`🎉 ¡Excelente! La tienda "${updatedCompany.name}" ha sido publicada exitosamente y ahora es 100% visible para todos los clientes en Internet.`);
  };

  const handleRestoreBackup = (backupData: AppBackupData, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setProducts(backupData.products);
      saveProducts(backupData.products, activeTenantId);

      if (backupData.categories && backupData.categories.length > 0) {
        setCategories(backupData.categories);
        saveCategories(backupData.categories, activeTenantId);
      }
      if (backupData.company) {
        setCompany(backupData.company);
        saveCompany(backupData.company, activeTenantId);
      }
      if (backupData.users && backupData.users.length > 0) {
        setUsers(backupData.users);
        saveUsers(backupData.users);
      }
      if (backupData.sales && backupData.sales.length > 0) {
        setSales(backupData.sales);
        saveSales(backupData.sales, activeTenantId);
      }
    } else {
      // Merge mode: preserve existing items and append new ones by id
      setProducts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newItems = backupData.products.filter(p => !existingIds.has(p.id));
        const merged = [...prev, ...newItems];
        saveProducts(merged, activeTenantId);
        return merged;
      });
      if (backupData.categories && backupData.categories.length > 0) {
        setCategories(prev => {
          const existingCatIds = new Set(prev.map(c => c.id));
          const newCats = backupData.categories.filter(c => !existingCatIds.has(c.id));
          const merged = [...prev, ...newCats];
          saveCategories(merged, activeTenantId);
          return merged;
        });
      }
    }

    // Push restored products and categories to Firestore immediately so they are permanently in cloud for this tenant
    seedProductsToFirestore(backupData.products, activeTenantId).catch(err => {
      console.warn('Sync restored products to Firestore:', err);
    });
    if (backupData.categories && backupData.categories.length > 0) {
      seedCategoriesToFirestore(backupData.categories, activeTenantId).catch(() => {});
    }
    if (backupData.company) {
      saveCompanyToFirestore(backupData.company, activeTenantId).catch(() => {});
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
      saveProducts(merged, activeTenantId);
      return merged;
    });

    // Upload to Firestore right away for the current tenant!
    await seedProductsToFirestore(productsToRestore, activeTenantId);

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

  // 404 Store Not Found handler for arbitrary uncreated subdomains (e.g. roca.titufaris.online)
  if (tenantNotFound) {
    return <StoreNotFoundView subdomain={activeTenantId} />;
  }

  // Brief verifying screen while checking newly accessed subdomains against Firestore
  if (isTenantChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans p-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-300 font-mono">Verificando tienda https://{activeTenantId}.titufaris.online...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-orange-500 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* SaaS Active Tenant Inspection Banner (STRICTLY visible only when owner is in staff/admin mode) */}
      {appMode === 'staff' && activeTenantId !== 'titufaris' && activeTenantId !== 'demo-generica' && (
        <div className="bg-slate-950 text-white text-xs px-4 py-2 border-b border-slate-800 shadow-xs relative z-40">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white">
                {activeTenant.name}
              </span>
              <span className="text-slate-600" aria-hidden="true">&middot;</span>
              <a
                href={`https://${activeTenant.slug}.titufaris.online`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-indigo-300 hover:text-indigo-200 hover:underline flex items-center gap-1"
                title={`Abrir subdominio oficial https://${activeTenant.slug}.titufaris.online`}
              >
                <span>https://{activeTenant.slug}.titufaris.online</span>
                <ExternalLink className="w-3 h-3 inline text-slate-400" />
              </a>
              <span className="text-slate-600 hidden md:inline" aria-hidden="true">&middot;</span>
              <span className="text-emerald-400 text-[11px] font-medium hidden md:inline">
                Subdominio Cloudflare SSL Activo
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSaaSSubscriptionModalOpen(true)}
                className="px-3 py-1 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors cursor-pointer"
              >
                Planes & Facturación
              </button>
              <button
                onClick={() => handleSelectTenant('titufaris')}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Volver a Matriz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Store Demo Mode Banner - STRICTLY on tiendas.titufaris.online only */}
      {isDemoMode && isTiendasHost && (
        <DemoModeBanner
          onExitDemo={handleExitDemoMode}
          onOpenCreateStore={() => setIsCreateTenantModalOpen(true)}
        />
      )}

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
            isDemoMode={isDemoMode && isTiendasHost}
            onToggleDemoMode={() => (isDemoMode ? handleExitDemoMode() : handleEnterDemoMode())}
            onOpenMasterPanel={() => setIsMasterPanelOpen(true)}
            onOpenSubscriptionModal={() => setIsSaaSSubscriptionModalOpen(true)}
            onOpenCreateTenant={() => setIsCreateTenantModalOpen(true)}
            activeStoreName={activeTenant.name}
          />

          {activeTenant.subscriptionStatus === 'canceled' && !activeTenant.isDefaultStore && activeTenant.id !== 'titufaris' ? (
            <TenantSuspendedNotice
              tenant={activeTenant}
              onOpenSubscriptionModal={() => setIsSaaSSubscriptionModalOpen(true)}
              onReturnToTitufaris={() => handleSelectTenant('titufaris')}
            />
          ) : (
            <PublicStoreView
              products={storeFilteredProducts}
              categories={categories}
              company={company}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onOpenProductDetail={setDetailProduct}
              onOpenQR={setQrProduct}
              onShareProduct={setShareProduct}
              onAddToCart={(p) => handleAddToCart(p, 'retail')}
              onOpenCatalogPDF={() => setIsExportModalOpen(true)}
              onSwitchToStaffMode={handleRequestStaffMode}
              onOpenLegalModal={handleOpenLegalModal}
              onOpenCart={() => setIsCustomerCartOpen(true)}
              onOpenSitemap={() => setIsSitemapModalOpen(true)}
              onOpenHeroSettings={currentUser.role === 'admin' ? () => setIsCompanyModalOpen(true) : undefined}
              cartCount={cartItemCount}
              cartTotal={cartSubtotal}
              isDemoMode={isDemoMode}
              isAdmin={currentUser.role === 'admin' || appMode === 'staff'}
              onPublishStore={handlePublishCurrentStore}
            />
          )}

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
          <div className="fixed bottom-16 sm:bottom-4 right-3 sm:right-4 z-40">
            <button
              onClick={handleRequestStaffMode}
              title="Ingresar a Gestión Interna / Terminal POS"
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-2xl backdrop-blur-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
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

          {/* Banner de Modo En Construcción en Panel Administrativo */}
          {company.isPublished === false && activeTenantId !== 'titufaris' && (
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-2 border-b border-amber-600 flex flex-wrap items-center justify-between gap-2 shadow-xs text-xs font-medium z-30">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-slate-950 text-amber-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Construction className="w-3.5 h-3.5" />
                  <span>En Construcción</span>
                </span>
                <span className="font-semibold text-slate-950">
                  Esta tienda está actualmente oculta al público mientras cargas tus productos e inventario.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePublishCurrentStore}
                  className="bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-sm hover:scale-[1.02]"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Publicar Tienda Online</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(true)}
                  className="bg-white/80 hover:bg-white text-slate-950 font-bold text-xs px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  Configurar Mensaje &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Main App Navigation Bar */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            syncStatus={syncStatus}
            isOnline={isOnline && !isSimulatedOffline}
            cartCount={cartItemCount}
            unreadNotifsCount={unreadNotifsCount}
            company={company}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenExport={() => setIsExportModalOpen(true)}
            onOpenWhatsAppCatalog={() => setIsWhatsAppCatalogModalOpen(true)}
            onOpenGoogleMerchant={() => setIsGoogleModalOpen(true)}
            onOpenNewProduct={handleOpenNewProduct}
            onOpenUsersModal={() => setIsUsersModalOpen(true)}
            onOpenCompanySettings={() => setIsCompanyModalOpen(true)}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
            onOpenRecoveryModal={() => setIsRecoveryModalOpen(true)}
            onManualSync={triggerCloudSync}
            onSwitchToStoreMode={handleLockStaffMode}
            onOpenMasterPanel={() => setIsMasterPanelOpen(true)}
            onOpenSubscriptionModal={() => setIsSaaSSubscriptionModalOpen(true)}
            onOpenCustomDomain={() => setIsCustomDomainModalOpen(true)}
            onOpenMultiSucursal={() => setIsMultiSucursalModalOpen(true)}
          />

          <TenantStatusBanner
            tenant={activeTenant}
            onOpenSubscriptionModal={() => setIsSaaSSubscriptionModalOpen(true)}
            onOpenMasterPanel={() => setIsMasterPanelOpen(true)}
            onOpenCustomDomain={() => setIsCustomDomainModalOpen(true)}
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
                    onClick={handleOpenNewProduct}
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
                  onClick={handleOpenNewProduct}
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
                  onShareProduct={setShareProduct}
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
                              onClick={() => setShareProduct(p)}
                              title="Compartir enlace propio"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
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
            activeBranchName={activeBranchId === 'branch-norte' ? 'Sucursal Norte' : activeBranchId === 'branch-deposito' ? 'Depósito Central' : 'Sucursal Central'}
            onOpenMultiSucursal={() => setIsMultiSucursalModalOpen(true)}
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
        onShareProduct={setShareProduct}
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
            onUpdateCategory={handleUpdateCategory}
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

      {/* Share Product Modal */}
      <ShareProductModal
        isOpen={!!shareProduct}
        onClose={() => setShareProduct(null)}
        product={shareProduct}
        company={company}
        isAdmin={(appMode === 'staff' || isStaffAuthenticated) && (currentUser.role === 'admin' || currentUser.permissions.canManageInventory)}
        onOpenQR={(p) => setQrProduct(p)}
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
            planId={activeTenant.planId}
            onOpenUpgradeModal={() => setIsSaaSSubscriptionModalOpen(true)}
            isDefaultStore={activeTenant.id === 'titufaris' || activeTenant.isDefaultStore}
          />
        )}
      </Suspense>

      {/* 7. Company Settings Modal - Exclusive for Admin in Staff Mode */}
      <Suspense fallback={null}>
        {currentUser.role === 'admin' && isCompanyModalOpen && (
          <CompanySettingsModal
            company={company}
            isOpen={isCompanyModalOpen}
            onClose={() => setIsCompanyModalOpen(false)}
            onSave={handleSaveCompany}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
            onOpenCustomDomain={() => setIsCustomDomainModalOpen(true)}
            onOpenSubscriptionModal={() => setIsSaaSSubscriptionModalOpen(true)}
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
            activeTenantId={activeTenantId}
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
            tenantId={activeTenantId}
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

      {/* 13. Visual Site Map & XML Sitemap Modal */}
      <SiteMapModal
        isOpen={isSitemapModalOpen}
        onClose={() => setIsSitemapModalOpen(false)}
        products={products}
        categories={categories}
        company={company}
        isDemoMode={isDemoMode}
        onSelectCategory={setSelectedCategory}
        onOpenProductDetail={setDetailProduct}
        onOpenLegalModal={handleOpenLegalModal}
        onOpenCart={() => setIsCustomerCartOpen(true)}
        onSwitchToStaffMode={handleRequestStaffMode}
      />

      {/* 14. Toast Notification when adding product to cart */}
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

      {/* 15. Master SaaS Admin Control Panel & Diagnostics Modal */}
      {isMasterPanelOpen && (
        <Suspense fallback={null}>
          <MasterAdminPanelModal
            isOpen={isMasterPanelOpen}
            onClose={() => setIsMasterPanelOpen(false)}
            tenants={saasTenants}
            onUpdateTenants={setSaaSTenants}
            activeTenantId={activeTenantId}
            onSelectTenant={handleSelectTenant}
            onOpenCreateTenant={() => setIsCreateTenantModalOpen(true)}
            onRestoreTenantSnapshot={(tenantId, snap) => {
              if (tenantId === activeTenantId) {
                setProducts(snap.products);
                setCategories(snap.categories);
                setCompany(snap.company);
              }
            }}
          />
        </Suspense>
      )}

      {/* 16. SaaS Subscription & Mercado Pago Checkout Modal */}
      {isSaaSSubscriptionModalOpen && (
        <Suspense fallback={null}>
          <SaaSSubscriptionModal
            isOpen={isSaaSSubscriptionModalOpen}
            onClose={() => setIsSaaSSubscriptionModalOpen(false)}
            tenant={activeTenant}
            allTenants={saasTenants}
            onUpdateTenants={setSaaSTenants}
          />
        </Suspense>
      )}

      {/* 17. Create New SaaS Store Onboarding Modal */}
      {isCreateTenantModalOpen && (
        <Suspense fallback={null}>
          <CreateTenantModal
            isOpen={isCreateTenantModalOpen}
            onClose={() => setIsCreateTenantModalOpen(false)}
            tenants={saasTenants}
            onTenantCreated={(newTenant) => {
              setSaaSTenants(prev => [...prev.filter(t => t.id !== newTenant.id), newTenant]);
            }}
            onSelectTenantDirectly={(tenantId) => {
              handleSelectTenant(tenantId);
              setIsCreateTenantModalOpen(false);
            }}
          />
        </Suspense>
      )}

      {/* 18. Custom Domain & DNS Management Modal (Paso 4 SaaS) */}
      {isCustomDomainModalOpen && (
        <Suspense fallback={null}>
          <CustomDomainModal
            isOpen={isCustomDomainModalOpen}
            onClose={() => setIsCustomDomainModalOpen(false)}
            tenant={activeTenant}
            allTenants={saasTenants}
            onUpdateTenants={setSaaSTenants}
            onSelectTenantDomain={(domain) => {
              handleSelectTenant(activeTenant.id);
            }}
          />
        </Suspense>
      )}

      {/* 19. Multi-Sucursal & Unified Real-Time Inventory Modal (Plan Empresa) */}
      {isMultiSucursalModalOpen && (
        <Suspense fallback={null}>
          <MultiSucursalModal
            isOpen={isMultiSucursalModalOpen}
            onClose={() => setIsMultiSucursalModalOpen(false)}
            products={products}
            onUpdateProducts={(updated) => {
              setProducts(updated);
              saveProducts(updated, activeTenantId);
            }}
            currentTenant={activeTenant}
            currentUserName={currentUser.name}
            activeBranchId={activeBranchId}
            onSelectActiveBranch={setActiveBranchId}
            onOpenUpgradeModal={() => {
              setIsMultiSucursalModalOpen(false);
              setIsSaaSSubscriptionModalOpen(true);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
