export type UserRole = 'admin' | 'supervisor' | 'cajero' | 'vendedor';

export interface UserPermissions {
  canEditPrices: boolean;
  canManageInventory: boolean;
  canProcessSales: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
  canEditCompany: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: 'active' | 'inactive';
  permissions: UserPermissions;
  lastActive: string;
  pin?: string;
  password?: string;
  mustChangePassword?: boolean;
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  color: string;
  description?: string;
}

export interface ProductSpecification {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  costPrice?: number;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  retailPrice: number;
  stock: number;
  branchStock?: Record<string, number>;
  minStock?: number;
  minStockAlert?: number;
  unit: string; // e.g., 'unidad', 'metro', 'm2', 'juego'
  imageUrl?: string;
  publicImageUrl?: string;
  images?: string[];
  barcode?: string;
  tags?: string[];
  dimensions?: string;
  brand?: string;
  specifications?: ProductSpecification[];
  featured?: boolean;
  sortOrder?: number;
  isMadeToOrder?: boolean; // True si el producto es fabricado a pedido
  leadTimeDays?: number; // Días estimados de fabricación y entrega (ej. 7, 10, 15 días)
  active: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface BrandColors {
  primary: string; // Hex color e.g. '#ea580c'
  secondary?: string; // Hex color e.g. '#0f172a'
  accent?: string; // Hex color e.g. '#f97316'
  headerBg?: string; // Hex color for the main header (e.g. '#ffffff' or custom)
  topBarBg?: string; // Hex color for the top announcement bar (e.g. '#020617')
  heroBg?: string; // Hex color for the hero banner section (e.g. '#020617')
}

export interface CompanyValueBadge {
  id?: string;
  icon?: string; // 'building' | 'shield' | 'truck' | 'creditCard' | 'store' | 'shoppingBag' | 'messageCircle' | 'check' | 'sparkles' | 'award' | 'clock' | 'heartHandshake';
  title: string;
  subtitle: string;
  linkTab?: string;
}

export type PolicyBadge = CompanyValueBadge;

export function getDefaultPolicyBadges(companyName: string = '', isTitufaris: boolean = false): PolicyBadge[] {
  if (isTitufaris) {
    return [
      { id: 'badge-1', icon: 'store', title: 'Directo de Fábrica', subtitle: 'Sin intermediarios', linkTab: 'terms' },
      { id: 'badge-2', icon: 'shield', title: 'Garantía 12 Meses', subtitle: 'Estructuras reforzadas', linkTab: 'warranty' },
      { id: 'badge-3', icon: 'truck', title: 'Envíos a Todo el País', subtitle: 'Embalaje de fábrica', linkTab: 'shipping' },
      { id: 'badge-4', icon: 'card', title: 'Medios de Pago', subtitle: 'Transferencia, cuotas y MP', linkTab: 'payment' },
    ];
  }
  return [
    { id: 'badge-1', icon: 'store', title: 'Catálogo Oficial', subtitle: `${companyName || 'Tienda'} online`, linkTab: 'terms' },
    { id: 'badge-2', icon: 'message', title: 'Ventas Directas', subtitle: 'Atención personalizada', linkTab: 'terms' },
    { id: 'badge-3', icon: 'truck', title: 'Envíos y Retiro', subtitle: 'Logística y entregas', linkTab: 'shipping' },
    { id: 'badge-4', icon: 'card', title: 'Medios de Pago', subtitle: 'Efectivo, tarjetas y MP', linkTab: 'payment' },
  ];
}

export interface CompanyProfile {
  name: string;
  tagline: string;
  legalName: string;
  taxId: string; // CUIT / RUT / RFC
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  currencySymbol: string;
  bankAccount: {
    bank: string;
    alias: string;
    cbu: string;
    holder: string;
    mercadoPagoAlias?: string;
    mercadoPagoLink?: string;
  };
  logoUrl?: string;
  logo?: string; // Alias for backward compatibility
  faviconUrl?: string;
  brandColors?: BrandColors;
  fontFamily?: string; // e.g. 'Inter', 'Outfit', 'Plus Jakarta Sans', 'Montserrat', 'Playfair Display', etc.
  announcementBarText?: string;
  showAnnouncementBar?: boolean;
  catalogNotes: string;
  termsAndConditions: string;
  whatsappCatalogUrl?: string;
  showWhatsAppCatalogButton?: boolean;
  metaCatalogConfig?: MetaCatalogConfig;

  // Personalización de Portada / Página de Inicio (Hero) y SEO
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  heroCtaText?: string;
  metaDescription?: string;

  // Venta Mayorista Configurable
  wholesaleEnabled?: boolean; // True si la tienda ofrece venta mayorista (default: true)
  wholesaleMinUnits?: number; // Cantidad mínima de unidades para considerar venta mayorista (default: 10)

  // Políticas & Beneficios de Portada (Los 4 Botones / Badges de la Tienda)
  valueBadges?: CompanyValueBadge[];
  heroBadges?: CompanyValueBadge[];

  // Personalización del Encabezado & Renglón Superior
  headerBgStyle?: 'brand' | 'dark' | 'custom';
  headerBgColor?: string;
  topBarBgColor?: string;

  // Redes Sociales Oficiales
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    tiktok?: string;
  };
}

export interface MetaCatalogConfig {
  catalogId?: string;
  accessToken?: string;
  businessId?: string;
  autoSyncOnChange?: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: 'success' | 'error' | 'idle';
  lastSyncResult?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  priceType: 'retail' | 'wholesale';
}

export type PaymentMethod = 'credit_card' | 'debit_card' | 'mercadopago_qr' | 'bank_transfer' | 'transferencia' | 'cash';

export interface Sale {
  id: string;
  receiptNumber: string;
  items: {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeGiven: number;
  paymentStatus: 'completed' | 'pending' | 'cancelled';
  status?: 'completed' | 'cancelled' | 'voided';
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  stockReintegrated?: boolean;
  customerName?: string;
  customerDoc?: string;
  customerEmail?: string;
  taxPayerType?: 'consumidor_final' | 'responsable_inscripto' | 'monotributo' | 'exento';
  deliveryAddress?: string;
  deliverySchedule?: string;
  customerPhone?: string;
  transferProofUrl?: string;
  transferProofName?: string;
  cashierId: string;
  cashierName: string;
  branchId?: string;
  branchName?: string;
  createdAt: string;
  notes?: string;
}

export type ActivityAction = 
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'category_created'
  | 'category_deleted'
  | 'stock_adjusted'
  | 'price_updated'
  | 'sale_completed'
  | 'sale_cancelled'
  | 'catalog_exported'
  | 'user_updated'
  | 'user_login'
  | 'company_updated'
  | 'catalog_reordered'
  | 'backup_downloaded'
  | 'backup_restored';

export interface AppBackupData {
  app: string;
  version: string;
  exportedAt: string;
  totalProducts: number;
  products: Product[];
  categories: Category[];
  company: CompanyProfile;
  users?: User[];
  sales?: Sale[];
  activityLogs?: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: ActivityAction;
  title: string;
  details: string;
  productId?: string;
  amount?: number;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: 'inventory_alert' | 'sale' | 'sync' | 'system';
  read: boolean;
  timestamp: string;
  linkAction?: string;
  productId?: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'pending';

export interface CustomerRemarketingProfile {
  id: string;
  name: string;
  doc?: string;
  taxPayerType?: 'consumidor_final' | 'responsable_inscripto' | 'monotributo' | 'exento';
  phone?: string;
  email?: string;
  address?: string;
  deliverySchedule?: string;
  ordersCount: number;
  totalSpent: number;
  firstOrderDate: string;
  lastOrderDate: string;
  purchasedProducts: {
    name: string;
    sku: string;
    quantity: number;
    totalAmount: number;
  }[];
  salesReceipts: string[];
}

export * from './branch';
export * from './saas';
