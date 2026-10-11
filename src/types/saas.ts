export type SaaSSubscriptionStatus = 'active' | 'trial' | 'past_due' | 'canceled' | 'suspended';
export type SaaSPlanId = 'trial' | 'basic' | 'pro' | 'enterprise';

export interface SaaSRecontactEntry {
  id: string;
  date: string;
  channel: 'whatsapp' | 'email' | 'phone';
  notes: string;
  outcome: 'pending' | 'contacted' | 'interested' | 'declined' | 'reactivated';
}

export interface SaaSTechnicalHealth {
  status: 'healthy' | 'warning' | 'error';
  productsCount: number;
  categoriesCount: number;
  salesCount: number;
  lastSyncAt: string;
  storageKB: number;
  maintenanceMode: boolean;
  customMaintenanceMessage?: string;
  emergencyPin?: string;
  emergencyPinExpiresAt?: string;
  dnsResolved?: boolean;
  dbLatencyMs?: number;
  issuesDetected: string[];
  lastDiagnosticAt: string;
  lastRepairedAt?: string;
  lastRepairAction?: string;
}

export interface SaaSSubscriptionRecord {
  id: string;
  tenantId: string;
  storeName: string;
  amount: number;
  currency: string;
  status: SaaSSubscriptionStatus;
  payerEmail: string;
  timestamp: string;
  mercadoPagoPaymentId: string;
  eventType?: string;
  notes?: string;
}

export type TechnicalRepairType =
  | 'all'
  | 'catalog'
  | 'cache'
  | 'dns'
  | 'firestore'
  | 'credentials'
  | 'categories';

export type SaaSDomainStatus =
  | 'unconfigured'
  | 'pending_dns'
  | 'propagating'
  | 'verified'
  | 'ssl_active'
  | 'error';

export interface SaaSDomainDnsRecord {
  type: 'A' | 'CNAME' | 'TXT';
  name: string; // e.g. '@', 'www', '_titufaris-verify'
  target: string; // e.g. '76.76.21.21', 'cname.titufaris.online', 'titufaris-verify=...'
  status: 'pending' | 'resolved' | 'error';
  ttl?: number;
  description?: string;
}

export interface SaaSDomainConfig {
  domain: string; // e.g. 'mitienda.com', 'www.mitienda.com'
  status: SaaSDomainStatus;
  sslActive: boolean;
  sslIssuer?: string; // e.g. "Let's Encrypt Authority X3" or "Cloudflare Edge SSL"
  sslExpiresAt?: string;
  forceHttps: boolean;
  dnsRecords: SaaSDomainDnsRecord[];
  verifiedAt?: string;
  lastDnsCheckAt?: string;
  dnsErrorDetails?: string;
  verificationToken: string;
}

export interface SaaSTenantStore {
  id: string; // e.g. 'titufaris', 'tienda-demo', 'tienda-electro'
  name: string; // e.g. 'Titufaris Equipamiento', 'Electro Mundo'
  slug: string; // e.g. 'titufaris', 'electromundo'
  isDefaultStore?: boolean; // true for titufaris (titufaris.online)
  customDomain?: string; // e.g. 'titufaris.online', 'mitienda.com'
  domainStatus?: SaaSDomainStatus;
  domainConfig?: SaaSDomainConfig;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  planId: SaaSPlanId;
  subscriptionStatus: SaaSSubscriptionStatus;
  pricePerMonthARS: number;
  billingCycle: 'monthly' | 'yearly';
  mercadoPagoSubscriptionId?: string; // Preapproval ID from MP
  mercadoPagoPayerId?: string;
  createdAt: string;
  trialEndsAt: string;
  nextBillingDate: string;
  canceledAt?: string;
  churnReason?: string;
  recontactHistory?: SaaSRecontactEntry[];
  technicalHealth: SaaSTechnicalHealth;
  notes?: string;
}

export interface SaaSBillingMetrics {
  mrrARS: number;
  arrARS: number;
  activeCount: number;
  trialCount: number;
  churnCount: number;
  pastDueCount: number;
  totalStores: number;
  totalSubscribers: number;
  conversionRate: number;
}

export interface MercadoPagoSettings {
  publicKey: string;
  accessToken: string;
  webhookSecret: string;
  sandboxMode: boolean;
  plans: {
    basicPlanId: string;
    proPlanId: string;
    enterprisePlanId: string;
  };
}
