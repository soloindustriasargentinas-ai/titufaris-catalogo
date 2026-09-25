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
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  minStock: number;
  unit: string; // e.g., 'unidad', 'metro', 'm2', 'juego'
  imageUrl: string;
  publicImageUrl?: string;
  images?: string[];
  barcode: string;
  tags: string[];
  specifications: ProductSpecification[];
  featured?: boolean;
  sortOrder?: number;
  isMadeToOrder?: boolean; // True si el producto es fabricado a pedido
  leadTimeDays?: number; // Días estimados de fabricación y entrega (ej. 7, 10, 15 días)
  active: boolean;
  updatedAt: string;
  updatedBy: string;
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
  catalogNotes: string;
  termsAndConditions: string;
  whatsappCatalogUrl?: string;
  showWhatsAppCatalogButton?: boolean;
  metaCatalogConfig?: MetaCatalogConfig;
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
