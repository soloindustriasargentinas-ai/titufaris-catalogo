import { CompanyProfile, Product, Category, User, ActivityLog, PushNotification, Sale } from '../types';
import { moncheClonedCompany, moncheClonedCategories, moncheClonedProducts } from './moncheClonedData';

export const initialCompany: CompanyProfile = {
  ...moncheClonedCompany,
  name: 'Titufaris',
  tagline: 'ESPACIOS QUE RINDEN - NEGOCIOS QUE CRECEN',
  legalName: 'Marta Irene Carrera',
  taxId: '27-25578358-6',
  address: 'Viamonte Nº 564',
  city: 'Quilmes / Buenos Aires, Argentina',
  phone: '+54 9 11 7067-4920',
  email: 'titufaris@gmail.com',
  website: 'https://titufaris.online',
  currency: 'ARS',
  currencySymbol: '$',
  bankAccount: {
    bank: 'Banco Santander Río',
    alias: 'TITUFARISPAGOS',
    cbu: '0720043488000003897854',
    holder: 'Marta Irene Carrera',
    mercadoPagoAlias: 'TITUFARIS.MP',
    mercadoPagoLink: 'https://link.mercadopago.com.ar/titufaris'
  },
  catalogNotes: 'Precios sujetos a variaciones sin previo aviso. Diseños a medida y renders de layout incluidos en proyectos integrales. Envíos a todo el país y armado en obra.',
  termsAndConditions: 'Garantía estructural de 12 meses. Formas de pago: Transferencia bancaria, eCheq, tarjeta de crédito y Mercado Pago. Descuentos por volumen para compras mayoristas a partir de 10 unidades.',
  whatsappCatalogUrl: 'https://wa.me/c/5491170674920',
  showWhatsAppCatalogButton: true,
  heroTitle: 'Buscás Góndolas, Estanterías, Racks Livianos o Pesados, Lockers, Guardarropas y más ?',
  heroSubtitle: 'Encontralos aquí en nuestra Tienda Online! Seleccioná la categoría de Productos que estás buscando, .Abrí la tarjeta del artículo que coincide con tu necesidad. Presioná el botón de compra y agregá todo lo que tu Salón comercial o Depósito precisan, al carrito. Cuando vayas a pagar podrás hacerlo desde tu App sin necesidad de cargar aquí datos de tu tarjeta. Precisás ayuda? Contáctanos por Whatsapp. Siempre te atenderá un humano, nada de bots. Además podemos diseñar tu proyecto en 3D antes de realizar la compra y después de ella te ayudamos con el envío y el armado.',
  heroImageUrl: moncheClonedCompany.heroImageUrl,
  heroCtaText: 'Asesoramiento por WhatsApp',
  metaDescription: 'Comprá góndolas, racks y estanterías en stock. Diseña tu Salón de ventas o Depósito en 3D Gratis',
  isPublished: true,
  socialLinks: {
    instagram: 'https://instagram.com/titufaris',
    facebook: 'https://facebook.com/titufaris2',
    linkedin: 'https://linkedin.com/company/titufaris',
    tiktok: 'https://tiktok.com/@titufaris'
  }
};

export const initialCategories: Category[] = moncheClonedCategories.map(cat => ({ ...cat }));

export const initialProducts: Product[] = moncheClonedProducts.map(prod => ({
  ...prod,
  images: Array.isArray(prod.images) ? [...prod.images] : (prod.imageUrl ? [prod.imageUrl] : []),
  specifications: Array.isArray(prod.specifications) ? prod.specifications.map(s => ({ ...s })) : [],
  tags: Array.isArray(prod.tags) ? [...prod.tags] : []
}));

export const initialSales: Sale[] = [];

export const DEFAULT_INITIAL_PASSWORD = 'Titufaris2025!';

export const initialUsers: User[] = [
  {
    id: 'usr-1',
    name: 'Roberto Martínez',
    email: 'admin@titufaris.com.ar',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    lastActive: new Date().toISOString(),
    password: DEFAULT_INITIAL_PASSWORD,
    mustChangePassword: false,
    permissions: {
      canEditPrices: true,
      canManageInventory: true,
      canProcessSales: true,
      canViewReports: true,
      canManageUsers: true,
      canExportData: true,
      canEditCompany: true,
    }
  },
  {
    id: 'usr-2',
    name: 'Ana Morales',
    email: 'ana.morales@titufaris.com.ar',
    role: 'supervisor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    lastActive: new Date().toISOString(),
    password: DEFAULT_INITIAL_PASSWORD,
    mustChangePassword: false,
    permissions: {
      canEditPrices: true,
      canManageInventory: true,
      canProcessSales: true,
      canViewReports: true,
      canManageUsers: false,
      canExportData: true,
      canEditCompany: false,
    }
  },
  {
    id: 'usr-3',
    name: 'Martín Rodríguez',
    email: 'martin@titufaris.com.ar',
    role: 'cajero',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    lastActive: new Date().toISOString(),
    password: DEFAULT_INITIAL_PASSWORD,
    mustChangePassword: false,
    permissions: {
      canEditPrices: false,
      canManageInventory: false,
      canProcessSales: true,
      canViewReports: false,
      canManageUsers: false,
      canExportData: false,
      canEditCompany: false,
    }
  },
  {
    id: 'usr-4',
    name: 'Diego Fernández',
    email: 'ventas@titufaris.com.ar',
    role: 'vendedor',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    lastActive: new Date().toISOString(),
    password: DEFAULT_INITIAL_PASSWORD,
    mustChangePassword: false,
    permissions: {
      canEditPrices: false,
      canManageInventory: true,
      canProcessSales: true,
      canViewReports: true,
      canManageUsers: false,
      canExportData: false,
      canEditCompany: false,
    }
  }
];

export const initialActivityLogs: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    userId: 'usr-1',
    userName: 'Administrador Titufaris',
    userRole: 'admin',
    action: 'catalog_exported',
    title: 'Catálogo de Artículos Sincronizado',
    details: 'Catálogo oficial con 35 artículos verificado y sincronizado con base de datos.',
  }
];

export const initialNotifications: PushNotification[] = [
  {
    id: 'notif-1',
    title: 'Catálogo Oficial Actualizado',
    message: 'Se cargaron los 35 artículos de equipamiento comercial en el sistema.',
    type: 'system',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  }
];
