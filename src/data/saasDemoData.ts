import { CompanyProfile, Product, Category, User } from '../types';

export const saasCompany: CompanyProfile = {
  name: 'Mi Tienda',
  tagline: 'CATÁLOGO ONLINE & PUNTO DE VENTA',
  legalName: 'Mi Empresa Comercial S.A.',
  taxId: '30-12345678-9',
  address: 'Av. Principal 1234, Centro Comercial',
  city: 'Buenos Aires / Córdoba / Rosario',
  phone: '+54 9 11 1234-5678',
  email: 'contacto@mitienda.com',
  website: 'https://mitienda.com',
  currency: 'ARS',
  currencySymbol: '$',
  bankAccount: {
    bank: 'Banco Santander',
    alias: 'MITIENDA.PAGOS',
    cbu: '0720000000000000000000',
    holder: 'Mi Empresa Comercial S.A.',
    mercadoPagoAlias: 'MITIENDA.MP',
    mercadoPagoLink: 'https://link.mercadopago.com.ar/mitienda'
  },
  catalogNotes: 'Precios sujetos a variación sin previo aviso. Envíos a todo el país y atención personalizada por WhatsApp.',
  termsAndConditions: 'Garantía oficial de 6 a 12 meses. Formas de pago: Transferencia bancaria, tarjeta de débito/crédito, efectivo en mostrador y Mercado Pago.',
  whatsappCatalogUrl: 'https://wa.me/c/5491112345678',
  showWhatsAppCatalogButton: true
};

export const saasCategories: Category[] = [
  {
    id: 'electronica',
    name: 'Electrónica & Audio',
    iconName: 'Smartphone',
    color: '#0284C7',
    description: 'Equipos electrónicos, accesorios de sonido, periféricos y gadgets de última generación.'
  },
  {
    id: 'hogar-deco',
    name: 'Hogar & Muebles',
    iconName: 'Home',
    color: '#F97316',
    description: 'Muebles de diseño, organizadores, iluminación y decoración para todos los ambientes.'
  },
  {
    id: 'indumentaria',
    name: 'Indumentaria & Moda',
    iconName: 'ShoppingBag',
    color: '#8B5CF6',
    description: 'Ropa informal, deportiva, calzado y accesorios de vestir de alta calidad.'
  },
  {
    id: 'bazar-cocina',
    name: 'Bazar & Cocina',
    iconName: 'Utensils',
    color: '#10B981',
    description: 'Vajilla, electrodomésticos para cocina, cafeteras y utensilios gastronómicos.'
  },
  {
    id: 'herramientas',
    name: 'Herramientas & Taller',
    iconName: 'Wrench',
    color: '#EAB308',
    description: 'Herramientas eléctricas y manuales, maletines, cajas organizadoras y ferretería.'
  },
  {
    id: 'ofertas-destacados',
    name: 'Ofertas & Destacados',
    iconName: 'Tag',
    color: '#EC4899',
    description: 'Promociones por temporada, liquidaciones especiales y combos con descuento.'
  }
];

export const saasProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Auriculares Inalámbricos Bluetooth Pro',
    sku: 'ELEC-001',
    category: 'electronica',
    retailPrice: 48500,
    wholesalePrice: 38800,
    wholesaleMinQty: 5,
    stock: 45,
    minStockAlert: 10,
    unit: 'unidad',
    brand: 'SoundMaster',
    description: 'Auriculares inalámbricos con cancelación activa de ruido, estuche de carga rápida y hasta 28 horas de autonomía.',
    tags: ['auriculares', 'bluetooth', 'audio', 'inalambrico'],
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
    specifications: [
      { key: 'Conectividad', value: 'Bluetooth 5.3' },
      { key: 'Batería', value: 'Hasta 28 horas con estuche' },
      { key: 'Resistencia', value: 'IPX5 (sudor y salpicaduras)' }
    ],
    featured: true,
    active: true
  },
  {
    id: 'prod-002',
    name: 'Smartwatch Deportivo Resistente al Agua',
    sku: 'ELEC-002',
    category: 'electronica',
    retailPrice: 65000,
    wholesalePrice: 52000,
    wholesaleMinQty: 3,
    stock: 28,
    minStockAlert: 5,
    unit: 'unidad',
    brand: 'FitPulse',
    description: 'Reloj inteligente con monitor de ritmo cardíaco, GPS integrado, notificaciones de WhatsApp y llamadas.',
    tags: ['reloj', 'smartwatch', 'deporte', 'fitness'],
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
    specifications: [
      { key: 'Pantalla', value: 'AMOLED 1.4 pulgadas' },
      { key: 'Sensores', value: 'Cardíaco, SpO2, Podómetro' },
      { key: 'Compatibilidad', value: 'Android e iOS' }
    ],
    featured: true,
    active: true
  },
  {
    id: 'prod-003',
    name: 'Parlante Portátil Bluetooth Extra Bass',
    sku: 'ELEC-003',
    category: 'electronica',
    retailPrice: 32900,
    wholesalePrice: 26300,
    wholesaleMinQty: 6,
    stock: 60,
    minStockAlert: 15,
    unit: 'unidad',
    brand: 'BassBoom',
    description: 'Parlante portátil de 20W con graves profundos, batería de 12 horas y luces LED sincronizadas con la música.',
    tags: ['parlante', 'altavoz', 'bluetooth', 'musica'],
    images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80'],
    specifications: [
      { key: 'Potencia', value: '20W RMS' },
      { key: 'Batería', value: '4000 mAh (12 horas)' }
    ],
    featured: false,
    active: true
  },
  {
    id: 'prod-101',
    name: 'Sillón Nórdico Tapizado Premium',
    sku: 'HOG-101',
    category: 'hogar-deco',
    retailPrice: 145000,
    wholesalePrice: 116000,
    wholesaleMinQty: 2,
    stock: 15,
    minStockAlert: 3,
    unit: 'unidad',
    brand: 'NordicLiving',
    description: 'Sillón individual con estructura de madera maciza de paraíso y tapizado en pana antimanchas de alta densidad.',
    tags: ['sillon', 'nordico', 'muebles', 'living'],
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'],
    specifications: [
      { key: 'Medidas', value: '80 x 75 x 85 cm' },
      { key: 'Tapizado', value: 'Pana antimanchas lavable' }
    ],
    featured: true,
    active: true
  },
  {
    id: 'prod-102',
    name: 'Lámpara de Escritorio LED Articulada',
    sku: 'HOG-102',
    category: 'hogar-deco',
    retailPrice: 24800,
    wholesalePrice: 19800,
    wholesaleMinQty: 6,
    stock: 35,
    minStockAlert: 8,
    unit: 'unidad',
    brand: 'LuminaTech',
    description: 'Lámpara articulada con control táctil de intensidad y 3 tonos de luz (cálida, neutra y fría) más cargador inalámbrico.',
    tags: ['lampara', 'escritorio', 'led', 'iluminacion'],
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80'],
    specifications: [
      { key: 'Potencia', value: '10W LED' },
      { key: 'Carga', value: 'Base de carga Qi inalámbrica' }
    ],
    featured: false,
    active: true
  },
  {
    id: 'prod-103',
    name: 'Mesa Ratona Industrial Hierro y Madera',
    sku: 'HOG-103',
    category: 'hogar-deco',
    retailPrice: 78000,
    wholesalePrice: 62400,
    wholesaleMinQty: 2,
    stock: 20,
    minStockAlert: 4,
    unit: 'unidad',
    brand: 'IndustrialLoft',
    description: 'Mesa centro de living fabricada con caño estructural negro mate y tapa en madera de eucalipto macizo encerado.',
    tags: ['mesa', 'industrial', 'living', 'madera'],
    images: ['https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80'],
    specifications: [
      { key: 'Medidas', value: '100 x 50 x 45 cm' },
      { key: 'Material', value: 'Hierro 20/20 y Madera Eucalipto' }
    ],
    featured: false,
    active: true
  },
  {
    id: 'prod-201',
    name: 'Cafetera Espresso Automática 15 Bares',
    sku: 'BAZ-201',
    category: 'bazar-cocina',
    retailPrice: 189000,
    wholesalePrice: 151200,
    wholesaleMinQty: 2,
    stock: 12,
    minStockAlert: 3,
    unit: 'unidad',
    brand: 'BaristaPro',
    description: 'Cafetera para café molido y cápsulas compatibles. Bomba italiana de 15 bares con vaporizador para espuma de leche.',
    tags: ['cafetera', 'cafe', 'espresso', 'cocina'],
    images: ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80'],
    specifications: [
      { key: 'Presión', value: '15 Bares' },
      { key: 'Depósito de agua', value: '1.5 Litros' }
    ],
    featured: true,
    active: true
  },
  {
    id: 'prod-202',
    name: 'Set de Cuchillos de Cocina con Soporte Magnético',
    sku: 'BAZ-202',
    category: 'bazar-cocina',
    retailPrice: 42000,
    wholesalePrice: 33600,
    wholesaleMinQty: 4,
    stock: 40,
    minStockAlert: 10,
    unit: 'set',
    brand: 'ChefLine',
    description: 'Set de 5 cuchillos de acero inoxidable con revestimiento antiadherente negro y soporte magnético de pared.',
    tags: ['cuchillos', 'cocina', 'gastronomia', 'acero'],
    images: ['https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=800&q=80'],
    specifications: [
      { key: 'Contenido', value: 'Chef 8", Pan 8", Multiuso 5", Torneador 3.5"' },
      { key: 'Material', value: 'Acero Inoxidable 3Cr13' }
    ],
    featured: false,
    active: true
  },
  {
    id: 'prod-301',
    name: 'Mochila Urbana Impermeable con Puerto USB',
    sku: 'IND-301',
    category: 'indumentaria',
    retailPrice: 38500,
    wholesalePrice: 29900,
    wholesaleMinQty: 6,
    stock: 50,
    minStockAlert: 12,
    unit: 'unidad',
    brand: 'UrbanBag',
    description: 'Mochila porta notebook hasta 15.6 pulgadas con tejido impermeable, bolsillos ocultos antirrobo y puerto USB.',
    tags: ['mochila', 'bolso', 'notebook', 'urbano'],
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'],
    specifications: [
      { key: 'Capacidad', value: '25 Litros' },
      { key: 'Compartimiento', value: 'Notebook hasta 15.6"' }
    ],
    featured: false,
    active: true
  },
  {
    id: 'prod-302',
    name: 'Zapatillas Deportivas Running Air',
    sku: 'IND-302',
    category: 'indumentaria',
    retailPrice: 72000,
    wholesalePrice: 57600,
    wholesaleMinQty: 4,
    stock: 32,
    minStockAlert: 8,
    unit: 'par',
    brand: 'AeroSport',
    description: 'Calzado deportivo liviano con suela de amortiguación neumática y capellada tejida respirable para máximo confort.',
    tags: ['zapatillas', 'calzado', 'running', 'deporte'],
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'],
    specifications: [
      { key: 'Talles', value: '38 al 45' },
      { key: 'Suela', value: 'Cámara de aire y EVA' }
    ],
    featured: true,
    active: true
  },
  {
    id: 'prod-401',
    name: 'Taladro Percutor Inalámbrico 20V con 2 Baterías',
    sku: 'HER-401',
    category: 'herramientas',
    retailPrice: 115000,
    wholesalePrice: 92000,
    wholesaleMinQty: 2,
    stock: 18,
    minStockAlert: 5,
    unit: 'unidad',
    brand: 'PowerTorque',
    description: 'Taladro percutor con motor sin carbones (Brushless), 2 baterías de litio 2.0Ah, cargador rápido y maletín rígido.',
    tags: ['taladro', 'herramientas', 'bateria', 'taller'],
    images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'],
    specifications: [
      { key: 'Voltaje', value: '20V Max' },
      { key: 'Torque', value: '55 Nm regulable' }
    ],
    featured: false,
    active: true
  },
  {
    id: 'prod-402',
    name: 'Set Maletín de Herramientas 108 Piezas',
    sku: 'HER-402',
    category: 'herramientas',
    retailPrice: 89000,
    wholesalePrice: 71200,
    wholesaleMinQty: 3,
    stock: 25,
    minStockAlert: 6,
    unit: 'set',
    brand: 'PowerTorque',
    description: 'Completo maletín con llaves crique de 1/2 y 1/4, bocallaves métricas, puntas torx, destornilladores y accesorios en cromo vanadio.',
    tags: ['herramientas', 'maletin', 'bocallaves', 'taller'],
    images: ['https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=800&q=80'],
    specifications: [
      { key: 'Piezas', value: '108 piezas' },
      { key: 'Material', value: 'Acero Cromo Vanadio (CR-V)' }
    ],
    featured: false,
    active: true
  }
];

export const saasUsers: User[] = [
  {
    id: 'usr-1',
    name: 'Administrador Principal',
    email: 'admin@mitienda.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    lastActive: new Date().toISOString(),
    password: 'Admin1234!',
    pin: '1234',
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
    name: 'Supervisor de Tienda',
    email: 'supervisor@mitienda.com',
    role: 'supervisor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    lastActive: new Date().toISOString(),
    password: 'Admin1234!',
    pin: '1234',
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
    name: 'Cajero de Mostrador',
    email: 'caja@mitienda.com',
    role: 'cajero',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    lastActive: new Date().toISOString(),
    password: 'Admin1234!',
    pin: '1234',
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
    name: 'Vendedor Comercial',
    email: 'ventas@mitienda.com',
    role: 'vendedor',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    status: 'active',
    lastActive: new Date().toISOString(),
    password: 'Admin1234!',
    pin: '1234',
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
