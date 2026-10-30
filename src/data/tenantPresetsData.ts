import { CompanyProfile, Product, Category } from '../types';
import { initialCompany, initialCategories, initialProducts } from './initialData';
import { moncheClonedCompany, moncheClonedCategories, moncheClonedProducts } from './moncheClonedData';
import { ZAPAS_OFFICIAL_LOGO_BASE64 } from './zapasLogoData';

// ============================================================================
// PRESET OFICIAL: ZAPAS (zapas.titufaris.online) - Calzado, Sneakers & Moda Urbana
// ============================================================================

export const zapasCompany: CompanyProfile = {
  name: 'Zapas - Calzado & Sneakers Oficial',
  tagline: 'LAS ZAPATILLAS DE TUS SUEÑOS',
  logo: ZAPAS_OFFICIAL_LOGO_BASE64,
  logoUrl: ZAPAS_OFFICIAL_LOGO_BASE64,
  legalName: 'Zapas Argentina S.A.',
  taxId: '30-71649281-4',
  address: 'Viamonte Nº 564, Quilmes',
  city: 'Buenos Aires / Envíos a todo el país',
  phone: '+54 9 11 7067-4920',
  email: 'titufaris@gmail.com',
  website: 'https://zapas.titufaris.online',
  currency: 'ARS',
  currencySymbol: '$',
  bankAccount: {
    bank: 'Banco Galicia',
    alias: 'ZAPAS.OFICIAL.ARG',
    cbu: '0070123456789012345678',
    holder: 'Zapas Argentina S.A.',
    mercadoPagoAlias: 'ZAPAS.MP',
    mercadoPagoLink: 'https://link.mercadopago.com.ar/zapasoficial'
  },
  catalogNotes: 'Calzado 100% original con cambio asegurado. Envíos express en 24/48hs a todo el país. Venta minorista y mayorista con descuento automático por curva o volumen.',
  termsAndConditions: 'Cambio gratis dentro de los 30 días de recibido el producto. Garantía de autenticidad y factura A o B. Medios de pago: Tarjetas de crédito en hasta 6 cuotas, débito, transferencia bancaria (10% OFF adicional) y Mercado Pago.',
  whatsappCatalogUrl: 'https://wa.me/c/5491170674920',
  showWhatsAppCatalogButton: true,
  catalogTitle: 'Catálogo de Sneakers, Calzado Urbano & Zapatillas',
  catalogDescription: 'Explorá los modelos más buscados en zapatillas urbanas, running, botines y calzado casual con stock en tiempo real y pedidos directos por WhatsApp.',
  heroTitle: 'Sneakers, Calzado Urbano & Zapatillas de Tendencia: Calidad y Confort',
  heroSubtitle: 'Descubrí los modelos más buscados en zapatillas urbanas, running, botines y calzado casual. Envíos gratis a todo el país a partir de $45.000 y precios especiales para revendedores.',
  heroImageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=80',
  heroCtaText: 'Asesoramiento por WhatsApp',
  metaDescription: 'Tienda oficial de Zapas. Calzado urbano, zapatillas running, sneakers de moda y accesorios. Envíos a todo el país.',
  brandColors: {
    primary: '#E11D48',
    secondary: '#09090B',
    accent: '#BE123C',
    topBarBg: '#09090B',
    headerBg: '#FFFFFF',
    heroBg: '#0F172A',
  },
  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  wholesaleEnabled: true,
  wholesaleMinUnits: 6,
  valueBadges: [
    {
      id: 'badge-1',
      title: '100% Original',
      subtitle: 'Garantía oficial directa de fábrica',
      iconName: 'ShieldCheck'
    },
    {
      id: 'badge-2',
      title: 'Envíos a Todo el País',
      subtitle: 'Despacho rápido en 24/48 horas',
      iconName: 'Truck'
    },
    {
      id: 'badge-3',
      title: 'Mayoristas & Revendedores',
      subtitle: 'Precios especiales desde 6 pares',
      iconName: 'Sparkles'
    },
    {
      id: 'badge-4',
      title: 'Cambio Asegurado',
      subtitle: '30 días de prueba sin costo',
      iconName: 'Award'
    }
  ],
  socialLinks: {
    instagram: 'https://instagram.com/zapas.oficial',
    facebook: 'https://facebook.com/zapas.oficial',
    tiktok: 'https://tiktok.com/@zapas.oficial'
  }
};

export const zapasCategories: Category[] = [
  {
    id: 'sneakers-urbanos',
    name: 'Sneakers Urbanos',
    iconName: 'ShoppingBag',
    color: '#E11D48',
    description: 'Zapatillas urbanas de corte moderno para uso diario, estilo streetwear y máxima comodidad.'
  },
  {
    id: 'running-training',
    name: 'Running & Training',
    iconName: 'Activity',
    color: '#0284C7',
    description: 'Calzado deportivo con amortiguación reactiva, suela de alto agarre y mesh respirable.'
  },
  {
    id: 'borcegos-botas',
    name: 'Borcegos & Botas',
    iconName: 'Archive',
    color: '#D97706',
    description: 'Borcegos de cuero ecológico y cuero vacuno, botas acordonadas y calzado todo terreno.'
  },
  {
    id: 'calzado-casual',
    name: 'Casual & Náuticos',
    iconName: 'Layers',
    color: '#10B981',
    description: 'Mocasines, náuticos livianos y calzado casual para salidas, trabajo y fin de semana.'
  }
];

export const zapasProducts: Product[] = [
  {
    id: 'zapas-01',
    sku: 'ZAP-URB-001',
    name: 'Sneakers Urban Street Air White',
    description: 'Zapatillas urbanas unisex confeccionadas en eco-cuero premium microperforado. Suela de goma antideslizante con cápsula de amortiguación Air para confort durante todo el día. Talles del 36 al 45.',
    retailPrice: 58900,
    wholesalePrice: 42500,
    stock: 45,
    minOrderQty: 1,
    unit: 'par',
    category: 'sneakers-urbanos',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80'
    ],
    featured: true,
    active: true,
    tags: ['sneakers', 'blanco', 'urbano', 'unisex', 'mas-vendido'],
    isMadeToOrder: false,
    specifications: [
      { key: 'Material', value: 'Eco-cuero premium y mesh' },
      { key: 'Suela', value: 'Goma EVA termoformada antideslizante' },
      { key: 'Talles disponibles', value: '36 al 45' },
      { key: 'Género', value: 'Unisex' }
    ]
  },
  {
    id: 'zapas-02',
    sku: 'ZAP-RUN-002',
    name: 'Zapatillas Running Pro Carbon Fly',
    description: 'Calzado técnico de running con placa de impulso ligero y capellada textil tejida ultra respirable. Drop de 8mm ideal para carreras de 5K, 10K y entrenamientos diarios intensos.',
    retailPrice: 74900,
    wholesalePrice: 54900,
    stock: 30,
    minOrderQty: 1,
    unit: 'par',
    category: 'running-training',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80'
    ],
    featured: true,
    active: true,
    tags: ['running', 'carbon', 'deportivo', 'rojo', 'ligero'],
    isMadeToOrder: false,
    specifications: [
      { key: 'Peso', value: '235 gramos (talle 41)' },
      { key: 'Suela', value: 'Caucho continental de alto agarre' },
      { key: 'Uso recomendado', value: 'Asfalto y cinta' }
    ]
  },
  {
    id: 'zapas-03',
    sku: 'ZAP-BOR-003',
    name: 'Borcego Cuero Urbano Explorer Black',
    description: 'Borcegos de cuero vacuno curtido con cierre lateral reforzado y cordones encerados. Suela tractorada de caucho vulcanizado cosida 360 grados. Resistencia extrema y estilo auténtico.',
    retailPrice: 89900,
    wholesalePrice: 65900,
    stock: 22,
    minOrderQty: 1,
    unit: 'par',
    category: 'borcegos-botas',
    imageUrl: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80'
    ],
    featured: true,
    active: true,
    tags: ['borcegos', 'cuero', 'botas', 'negro', 'invierno'],
    isMadeToOrder: false,
    specifications: [
      { key: 'Material', value: 'Cuero vacuno genuino' },
      { key: 'Cierre', value: 'Cierre YKK lateral + cordones' },
      { key: 'Suela', value: 'Caucho tractorado antideslizante' }
    ]
  },
  {
    id: 'zapas-04',
    sku: 'ZAP-CAS-004',
    name: 'Mocasín Náutico Confort Navy',
    description: 'Calzado náutico ultra liviano con plantilla acolchada memory foam. Cuero gamuzado suave y cordones de cuero natural. Perfecto para combinar con bermudas o pantalones chinos.',
    retailPrice: 49900,
    wholesalePrice: 36500,
    stock: 35,
    minOrderQty: 1,
    unit: 'par',
    category: 'calzado-casual',
    imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80'
    ],
    featured: false,
    active: true,
    tags: ['nautico', 'casual', 'azul', 'verano'],
    isMadeToOrder: false,
    specifications: [
      { key: 'Material', value: 'Gamuza tratada resistente a manchas' },
      { key: 'Plantilla', value: 'Memory Foam transpirable' }
    ]
  },
  {
    id: 'zapas-05',
    sku: 'ZAP-URB-005',
    name: 'Retro Skate 90s Low Suede',
    description: 'Sneakers de silueta retro noventera con puntera de gamuza reforzada y lengüeta acolchada. Suela waffle de goma vulcanizada para mayor durabilidad y tracción en tabla y calle.',
    retailPrice: 62500,
    wholesalePrice: 45000,
    stock: 28,
    minOrderQty: 1,
    unit: 'par',
    category: 'sneakers-urbanos',
    imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80'
    ],
    featured: true,
    active: true,
    tags: ['skate', 'retro', 'sneakers', 'gamuza'],
    isMadeToOrder: false,
    specifications: [
      { key: 'Construcción', value: 'Vulcanizada doble banda' },
      { key: 'Plantilla', value: 'Impact Foam con absorción de golpes' }
    ]
  },
  {
    id: 'zapas-06',
    sku: 'ZAP-RUN-006',
    name: 'Zapatillas Training Flex HIIT',
    description: 'Diseñadas para entrenamientos funcionales, cross training y gimnasio. Estabilidad lateral reforzada y soporte de arco medial que previene torceduras.',
    retailPrice: 59900,
    wholesalePrice: 43500,
    stock: 40,
    minOrderQty: 1,
    unit: 'par',
    category: 'running-training',
    imageUrl: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80'
    ],
    featured: false,
    active: true,
    tags: ['training', 'gimnasio', 'deportivo', 'verde'],
    isMadeToOrder: false,
    specifications: [
      { key: 'Suela', value: 'Ranuras de flexión omnidireccionales' },
      { key: 'Drop', value: '4 mm para estabilidad' }
    ]
  }
];

// ============================================================================
// PRESET OFICIAL: CLAUDIA SOFT (claudia-soft.titufaris.online) - Lencería & Moda Femenina
// ============================================================================

export const claudiaSoftCompany: CompanyProfile = {
  name: 'Claudia Soft',
  tagline: 'LENCERÍA, PIJAMAS & MODA CONFORT',
  legalName: 'Claudia Soft Confecciones S.R.L.',
  taxId: '30-71894523-2',
  address: 'Av. Santa Fe 3200, Palermo, CABA, Argentina',
  city: 'Buenos Aires / Envíos a todo el país',
  phone: '+54 9 11 2251-2906',
  email: 'claudia@cinco-cero.com',
  website: 'https://claudia-soft.titufaris.online',
  currency: 'ARS',
  currencySymbol: '$',
  bankAccount: {
    bank: 'Banco Santander',
    alias: 'CLAUDIA.SOFT.VENTAS',
    cbu: '0720123456789012345678',
    holder: 'Claudia Soft Confecciones S.R.L.',
    mercadoPagoAlias: 'CLAUDIASOFT.MP',
    mercadoPagoLink: 'https://link.mercadopago.com.ar/claudiasoft'
  },
  catalogNotes: 'Prendas confeccionadas con materias primas de primera calidad: satén elastizado, algodón pima y encajes suaves hipoalergénicos. Atención personalizada y curva completa de talles.',
  termsAndConditions: 'Envíos discretos en packaging cerrado a todo el país. Garantía por defectos de confección. Medios de pago: Transferencia bancaria (10% descuento), tarjetas en 3 cuotas sin interés y Mercado Pago.',
  whatsappCatalogUrl: 'https://wa.me/c/5491122512906',
  showWhatsAppCatalogButton: true,
  catalogTitle: 'Catálogo Oficial de Pijamas, Lencería & Homewear',
  catalogDescription: 'Confort, suavidad y diseño en pijamas de satén, lencería soft y camisones con curva completa de talles y envíos a todo el país.',
  heroTitle: 'Pijamas de Satén, Lencería Soft & Homewear de Alta Calidad',
  heroSubtitle: 'Diseño pensado para tu descanso y elegancia diaria. Conjuntos soft sin aro, camisones de seda, batas premium y pijamas de algodón ultra suave. Venta directa y catálogo mayorista.',
  heroImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
  heroCtaText: 'Asesoramiento por WhatsApp',
  metaDescription: 'Tienda oficial de Claudia Soft. Pijamas, camisones, lencería soft, batas y homewear femenino. Confort y diseño exclusivo.',
  brandColors: {
    primary: '#D946EF',
    secondary: '#4A044E',
    accent: '#C026D3',
    topBarBg: '#4A044E',
    headerBg: '#FFFFFF',
    heroBg: '#2E0854',
  },
  fontFamily: "'Playfair Display', Georgia, serif",
  wholesaleEnabled: true,
  wholesaleMinUnits: 6,
  valueBadges: [
    {
      id: 'badge-1',
      title: 'Telas Hipoalergénicas',
      subtitle: 'Algodón pima y satén de tacto ultra suave',
      iconName: 'ShieldCheck'
    },
    {
      id: 'badge-2',
      title: 'Envíos Discretos',
      subtitle: 'Paquetería sellada a todo el país',
      iconName: 'Truck'
    },
    {
      id: 'badge-3',
      title: 'Venta Mayorista',
      subtitle: 'Precios por docena y curva de talles',
      iconName: 'Sparkles'
    },
    {
      id: 'badge-4',
      title: 'Talles Reales',
      subtitle: 'Curva inclusiva del talle 1 al 5',
      iconName: 'Award'
    }
  ],
  socialLinks: {
    instagram: 'https://instagram.com/claudiasoft.oficial',
    facebook: 'https://facebook.com/claudiasoft.oficial',
    tiktok: 'https://tiktok.com/@claudiasoft'
  }
};

export const claudiaSoftCategories: Category[] = [
  {
    id: 'pijamas-camisones',
    name: 'Pijamas & Camisones',
    iconName: 'ShoppingBag',
    color: '#D946EF',
    description: 'Pijamas de dos piezas, conjuntos de short y remera, y camisones elegantes en satén y algodón.'
  },
  {
    id: 'lenceria-bralettes',
    name: 'Lencería & Bralettes',
    iconName: 'Heart',
    color: '#E11D48',
    description: 'Bralettes soft sin aro, conjuntos de puntilla delicada y corpiños confort para uso diario.'
  },
  {
    id: 'batas-mañanitas',
    name: 'Batas & Mañanitas',
    iconName: 'Layers',
    color: '#8B5CF6',
    description: 'Batas de satén con guarda de encaje, kimonos de entretiempo y batas abrigadas soft touch.'
  },
  {
    id: 'bombachas-packs',
    name: 'Packs Bombachas & Culottes',
    iconName: 'Sparkles',
    color: '#EC4899',
    description: 'Vedetinas, colaless regulables y culottes seamless corte láser sin costuras.'
  }
];

export const claudiaSoftProducts: Product[] = [
  {
    id: 'claudia-01',
    sku: 'CS-PIJ-001',
    name: 'Pijama Satén Seda Royal Champagne (2 Piezas)',
    description: 'Conjunto de camisa abotonada de manga corta con vivos contrastantes y short con elástico suave forrado. Confeccionado en satén elastizado con caída sedosa que no se arruga.',
    retailPrice: 42900,
    wholesalePrice: 29900,
    stock: 35,
    minOrderQty: 1,
    unit: 'conjunto',
    category: 'pijamas-camisones',
    imageUrl: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=800&q=80'
    ],
    featured: true,
    active: true,
    tags: ['pijama', 'saten', 'champagne', 'elegante', 'mas-vendido'],
    isMadeToOrder: false,
    specifications: [
      { key: 'Composición', value: '95% Satén seda / 5% Spandex' },
      { key: 'Talles', value: 'S, M, L, XL, XXL' },
      { key: 'Cuidado', value: 'Lavado suave con agua fría' }
    ]
  },
  {
    id: 'claudia-02',
    sku: 'CS-LEN-002',
    name: 'Conjunto Bralette Soft Encaje Floral Noir',
    description: 'Bralette de microtul bordado con taza soft desmontable y breteles regulables con herrajes dorados. Incluye colaless regulable haciendo juego. Máxima sensualidad sin renunciar al confort.',
    retailPrice: 28500,
    wholesalePrice: 19800,
    stock: 50,
    minOrderQty: 1,
    unit: 'conjunto',
    category: 'lenceria-bralettes',
    imageUrl: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80'
    ],
    featured: true,
    active: true,
    tags: ['bralette', 'encaje', 'negro', 'lenceria'],
    isMadeToOrder: false,
    specifications: [
      { key: 'Aro', value: 'Sin aro (Confort Soft)' },
      { key: 'Taza', value: 'Soft removible' },
      { key: 'Talles', value: '85 al 105' }
    ]
  },
  {
    id: 'claudia-03',
    sku: 'CS-BAT-003',
    name: 'Bata Kimono Satén Rose Gold con Encaje',
    description: 'Bata cruzada con lazo de ajuste desmontable y mangas tres cuartos terminadas en puntilla de encaje chantilly. El complemento perfecto para las mañanas y noches de relax.',
    retailPrice: 48900,
    wholesalePrice: 34500,
    stock: 25,
    minOrderQty: 1,
    unit: 'unidad',
    category: 'batas-mañanitas',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'
    ],
    featured: true,
    active: true,
    tags: ['bata', 'kimono', 'rose-gold', 'novias'],
    isMadeToOrder: false,
    specifications: [
      { key: 'Largo', value: 'Medio (sobre la rodilla)' },
      { key: 'Material', value: 'Satén premium elastizado' }
    ]
  },
  {
    id: 'claudia-04',
    sku: 'CS-BOM-004',
    name: 'Pack x3 Bombachas Seamless Corte Láser Confort',
    description: 'Pack de 3 unidades en tonos nude, blanco y negro. Confeccionadas con tecnología de corte láser invisible que no marca bajo la ropa ajustada. Refuerzo íntimo 100% de algodón puro.',
    retailPrice: 21900,
    wholesalePrice: 14900,
    stock: 60,
    minOrderQty: 1,
    unit: 'pack',
    category: 'bombachas-packs',
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80'
    ],
    featured: false,
    active: true,
    tags: ['seamless', 'corte-laser', 'bombachas', 'pack'],
    isMadeToOrder: false,
    specifications: [
      { key: 'Presentación', value: 'Caja con 3 unidades surtidas' },
      { key: 'Refuerzo', value: '100% Algodón antibacteriano' }
    ]
  },
  {
    id: 'claudia-05',
    sku: 'CS-PIJ-005',
    name: 'Camisón Modal Soft & Encaje Lavanda',
    description: 'Camisón corto de modal peinado ultra liviano con escote en V decorado con puntilla francesa suave. Espalda con breteles cruzados finos regulables.',
    retailPrice: 36900,
    wholesalePrice: 25500,
    stock: 30,
    minOrderQty: 1,
    unit: 'unidad',
    category: 'pijamas-camisones',
    imageUrl: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80'
    ],
    featured: false,
    active: true,
    tags: ['camison', 'modal', 'lavanda', 'verano'],
    isMadeToOrder: false,
    specifications: [
      { key: 'Tela', value: 'Modal soft 100% transpirable' },
      { key: 'Talles', value: '1 al 4' }
    ]
  }
];

// ============================================================================
// PRESET OFICIAL: MONCHE ESTANTERÍAS (moncheestanterias.titufaris.online)
// Copia exacta e independiente por única vez de la tienda matriz (titufaris.online)
// ============================================================================

export const moncheCompany: CompanyProfile = {
  ...moncheClonedCompany,
  website: 'https://moncheestanterias.titufaris.online',
  isPublished: true,
};

export const moncheCategories: Category[] = moncheClonedCategories.map(c => ({ ...c }));

export const moncheProducts: Product[] = moncheClonedProducts.map(p => ({
  ...p,
  images: Array.isArray(p.images) ? [...p.images] : (p.imageUrl ? [p.imageUrl] : []),
  specifications: Array.isArray(p.specifications) ? p.specifications.map(s => ({ ...s })) : [],
  tags: Array.isArray(p.tags) ? [...p.tags] : []
}));


// ============================================================================
// PRESETS POR RUBRO PARA NUEVAS TIENDAS
// ============================================================================

export type TenantCategoryPresetType = 'gastronomia' | 'indumentaria' | 'tecnologia' | 'ferreteria' | 'general';

export function getPresetDataForCategory(
  preset: TenantCategoryPresetType,
  storeName: string,
  storeSlug: string,
  ownerEmail?: string,
  ownerPhone?: string
): {
  company: CompanyProfile;
  categories: Category[];
  products: Product[];
} {
  const cleanName = storeName.trim() || 'Mi Tienda';
  const cleanPhone = ownerPhone?.trim() || '+54 9 11 0000-0000';
  const cleanEmail = ownerEmail?.trim() || `contacto@${storeSlug}.titufaris.online`;
  const cleanWeb = `https://${storeSlug}.titufaris.online`;

  if (preset === 'gastronomia') {
    const categories: Category[] = [
      { id: 'coccion-hornos', name: 'Hornos & Cocción', iconName: 'Flame', color: '#EA580C', description: 'Hornos industriales, freidoras, anafes y planchas profesionales.' },
      { id: 'frio-refrigeracion', name: 'Refrigeración Comercial', iconName: 'Snowflake', color: '#0284C7', description: 'Heladeras exhibidoras, bateas carniceras y freezers de alta eficiencia.' },
      { id: 'acero-mobiliario', name: 'Mobiliario en Acero Inoxidable', iconName: 'Layers', color: '#64748B', description: 'Mesadas de trabajo, estanterías sanitarias y piletas gastronómicas.' },
      { id: 'bazar-utensilios', name: 'Bazar & Accesorios', iconName: 'Utensils', color: '#8B5CF6', description: 'Vajilla profesional, bandejas gastronorm y utensilios para chefs.' }
    ];

    const products: Product[] = [
      {
        id: `${storeSlug}-horno-pizzero-6m`,
        sku: 'GAST-H6M',
        name: 'Horno Pastelero / Pizzero 6 Moldes con Base Reforzada',
        category: 'coccion-hornos',
        description: 'Horno a gas industrial con piso de ladrillos refractarios, pirómetro frontal de precisión y válvula de seguridad.',
        retailPrice: 285000,
        wholesalePrice: 245000,
        wholesaleMinQty: 2,
        stock: 8,
        minStock: 2,
        unit: 'unidad',
        imageUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80'],
        featured: true,
        active: true,
        specifications: [
          { key: 'Capacidad', value: '6 moldes pizzeros simultáneos' },
          { key: 'Quemadores', value: 'Tubulares de alta potencia' },
          { key: 'Garantía', value: '12 meses oficial' }
        ]
      },
      {
        id: `${storeSlug}-heladera-exhibidora-450`,
        sku: 'GAST-HE450',
        name: 'Heladera Exhibidora Vertical 450 Litros con Puerta Doble Vidrio',
        category: 'frio-refrigeracion',
        description: 'Ideal para bebidas y lácteos. Iluminación LED perimetral, 4 estantes regulables y forzador de frío continuo.',
        retailPrice: 590000,
        wholesalePrice: 530000,
        wholesaleMinQty: 2,
        stock: 5,
        minStock: 1,
        unit: 'unidad',
        imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80'],
        featured: true,
        active: true,
        specifications: [
          { key: 'Volumen', value: '450 Litros' },
          { key: 'Gas Refrigerante', value: 'Ecológico R290' },
          { key: 'Rango Temp', value: '0°C a +6°C' }
        ]
      },
      {
        id: `${storeSlug}-mesada-acero-150`,
        sku: 'GAST-MES150',
        name: 'Mesada de Trabajo Acero Inox AISI 430 150x60x85cm',
        category: 'acero-mobiliario',
        description: 'Mesada profesional con estante inferior bajo mesada y regatones regulables en altura para nivelación perfecta.',
        retailPrice: 195000,
        wholesalePrice: 169000,
        wholesaleMinQty: 3,
        stock: 12,
        minStock: 3,
        unit: 'unidad',
        imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'],
        featured: false,
        active: true,
        specifications: [
          { key: 'Material', value: 'Acero Inoxidable sanitario' },
          { key: 'Medidas', value: '1.50m largo x 0.60m ancho x 0.85m alto' }
        ]
      }
    ];

    const company: CompanyProfile = {
      name: cleanName,
      tagline: 'EQUIPAMIENTO & PRODUCTOS GASTRONÓMICOS',
      legalName: `${cleanName} S.R.L.`,
      taxId: '30-71999999-1',
      address: 'Polo Comercial e Industrial',
      city: 'Buenos Aires / Envíos a todo el país',
      phone: cleanPhone,
      email: cleanEmail,
      website: cleanWeb,
      currency: 'ARS',
      currencySymbol: '$',
      bankAccount: {
        bank: 'Banco Galicia',
        alias: `${storeSlug.toUpperCase().slice(0, 10)}.VENTAS`,
        cbu: '0070000000000000000001',
        holder: cleanName,
        mercadoPagoAlias: `${storeSlug.toUpperCase().slice(0, 10)}.MP`,
      },
      catalogTitle: `Catálogo Gastronómico de ${cleanName}`,
      catalogDescription: 'Equipamiento profesional, hornos, refrigeración y accesorios para cocinas, restaurantes y emprendimientos comerciales.',
      heroTitle: `${cleanName} · Equipamiento Gastronómico y Comercial`,
      heroSubtitle: 'Soluciones completas para tu cocina comercial, bar o panadería con stock inmediato y envíos a todo el país.',
      heroImageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
      heroCtaText: 'Consultar por WhatsApp',
      metaDescription: `Catálogo oficial de ${cleanName}. Equipamiento comercial y gastronómico para restaurantes y panaderías.`,
      catalogNotes: 'Factura A o B. Envíos con embalaje reforzado a todo el país. Asesoramiento técnico y cotizaciones a medida.',
      termsAndConditions: 'Garantía oficial de 12 meses. Formas de pago: Transferencia bancaria directa con descuento, tarjetas y Mercado Pago.',
      whatsappCatalogUrl: `https://wa.me/${cleanPhone.replace(/[^\d]/g, '')}`,
      showWhatsAppCatalogButton: true,
      brandColors: {
        primary: '#EA580C',
        secondary: '#0F172A',
        accent: '#F97316',
        topBarBg: '#0F172A',
        headerBg: '#FFFFFF',
        heroBg: '#1E293B',
      },
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      wholesaleEnabled: true,
      wholesaleMinUnits: 3,
      valueBadges: [
        { id: 'b1', title: 'Directo de Fábrica', subtitle: 'Equipamiento profesional garantizado', iconName: 'ShieldCheck' },
        { id: 'b2', title: 'Envíos Nacionales', subtitle: 'Embalaje técnico reforzado', iconName: 'Truck' },
        { id: 'b3', title: 'Atención WhatsApp', subtitle: 'Presupuestos y asesoramiento', iconName: 'MessageCircle' },
        { id: 'b4', title: 'Medios de Pago', subtitle: 'Transferencia, cuotas y MP', iconName: 'CreditCard' }
      ]
    };

    return { company, categories, products };
  }

  if (preset === 'tecnologia') {
    const categories: Category[] = [
      { id: 'smartphones-accesorios', name: 'Telefonía & Accesorios', iconName: 'Smartphone', color: '#0284C7', description: 'Smartphones, fundas de alto impacto, vidrios templados y cargadores rápidos.' },
      { id: 'audio-auriculares', name: 'Audio & Sonido', iconName: 'Headphones', color: '#8B5CF6', description: 'Auriculares bluetooth con cancelación de ruido, parlantes portátiles y micrófonos.' },
      { id: 'computacion-gadgets', name: 'Computación & Gaming', iconName: 'Laptop', color: '#10B981', description: 'Periféricos gamers, teclados mecánicos, mouses ópticos y soportes ergonómicos.' },
      { id: 'smart-watch', name: 'Smartwatches & Wearables', iconName: 'Watch', color: '#F59E0B', description: 'Relojes inteligentes, bandas deportivas y sensores de entrenamiento.' }
    ];

    const products: Product[] = [
      {
        id: `${storeSlug}-auriculares-bt-pro`,
        sku: 'TEC-AIRPRO',
        name: 'Auriculares Inalámbricos Pro ANC con Cancelación Activa de Ruido',
        category: 'audio-auriculares',
        description: 'Sonido de alta definición, estuche de carga inalámbrica con 32 horas de batería total y resistencia al sudor IPX5.',
        retailPrice: 42000,
        wholesalePrice: 34000,
        wholesaleMinQty: 5,
        stock: 35,
        minStock: 8,
        unit: 'unidad',
        imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80'],
        featured: true,
        active: true,
        specifications: [
          { key: 'Conexión', value: 'Bluetooth 5.3 Ultra Rápido' },
          { key: 'Batería', value: 'Hasta 8hs continuas + 24hs estuche' },
          { key: 'Micrófono', value: 'Dual con reducción de ruido ambiental' }
        ]
      },
      {
        id: `${storeSlug}-smartwatch-fit`,
        sku: 'TEC-SWFIT',
        name: 'Smartwatch Deportivo AMOLED Monitor Cardíaco & O2',
        category: 'smart-watch',
        description: 'Pantalla AMOLED 1.43 pulgadas siempre activa, más de 100 modos deportivos, llamadas bluetooth y GPS asistido.',
        retailPrice: 58000,
        wholesalePrice: 48000,
        wholesaleMinQty: 4,
        stock: 20,
        minStock: 5,
        unit: 'unidad',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
        featured: true,
        active: true,
        specifications: [
          { key: 'Pantalla', value: 'AMOLED 466x466 px' },
          { key: 'Autonomía', value: '7 a 10 días de uso regular' }
        ]
      }
    ];

    const company: CompanyProfile = {
      name: cleanName,
      tagline: 'TECNOLOGÍA, GADGETS & ACCESORIOS PREMIUM',
      legalName: `${cleanName} Tech`,
      taxId: '30-71888888-2',
      address: 'Centro Tecnológico',
      city: 'Envíos a todo el país',
      phone: cleanPhone,
      email: cleanEmail,
      website: cleanWeb,
      currency: 'ARS',
      currencySymbol: '$',
      bankAccount: {
        bank: 'Banco Santander',
        alias: `${storeSlug.toUpperCase().slice(0, 10)}.TECH`,
        cbu: '0720000000000000000002',
        holder: cleanName,
        mercadoPagoAlias: `${storeSlug.toUpperCase().slice(0, 10)}.MP`,
      },
      catalogTitle: `Catálogo Tecnológico Oficial de ${cleanName}`,
      catalogDescription: 'Descubrí los mejores dispositivos electrónicos, accesorios para celulares, sonido de alta fidelidad y gadgets con garantía oficial.',
      heroTitle: `${cleanName} · Tecnología & Accesorios de Última Generación`,
      heroSubtitle: 'Productos seleccionados con garantía, despacho rápido a todo el país y precios directos al público y por mayor.',
      heroImageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
      heroCtaText: 'Comprar por WhatsApp',
      metaDescription: `Tienda online de ${cleanName}. Auriculares, smartwatches, accesorios móviles y computación.`,
      catalogNotes: 'Garantía escrita de 6 meses. Despachos dentro de las 24hs hábiles. Envíos gratis superando monto mínimo.',
      termsAndConditions: 'Factura A y B. Métodos de pago seguros con Mercado Pago, tarjetas y transferencia.',
      whatsappCatalogUrl: `https://wa.me/${cleanPhone.replace(/[^\d]/g, '')}`,
      showWhatsAppCatalogButton: true,
      brandColors: {
        primary: '#2563EB',
        secondary: '#0F172A',
        accent: '#3B82F6',
        topBarBg: '#090D16',
        headerBg: '#FFFFFF',
        heroBg: '#0F172A',
      },
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      wholesaleEnabled: true,
      wholesaleMinUnits: 4,
      valueBadges: [
        { id: 'b1', title: 'Garantía Oficial', subtitle: 'Garantía 6 meses en todos los productos', iconName: 'ShieldCheck' },
        { id: 'b2', title: 'Envío Asegurado', subtitle: 'Despacho express a toda Argentina', iconName: 'Truck' },
        { id: 'b3', title: 'Asesoramiento Live', subtitle: 'Canal directo de WhatsApp', iconName: 'MessageCircle' },
        { id: 'b4', title: 'Pagos en Cuotas', subtitle: 'Tarjetas, Transferencia y MP', iconName: 'CreditCard' }
      ]
    };

    return { company, categories, products };
  }

  if (preset === 'ferreteria') {
    const categories: Category[] = [
      { id: 'herramientas-electricas', name: 'Herramientas Eléctricas', iconName: 'Zap', color: '#EA580C', description: 'Taladros, amoladoras angulares, sierras circulares y rotomartillos.' },
      { id: 'herramientas-manuales', name: 'Herramientas Manuales', iconName: 'Wrench', color: '#0284C7', description: 'Llaves combinadas, destornilladores, pinzas de fuerza y juegos de tubos.' },
      { id: 'pintureria-quimicos', name: 'Pinturería & Químicos', iconName: 'Paintbrush', color: '#10B981', description: 'Látex lavables, esmaltes sintéticos, selladores y aerosoles técnicos.' },
      { id: 'seguridad-fijaciones', name: 'Fijaciones & Seguridad', iconName: 'Shield', color: '#F59E0B', description: 'Tornillos, tarugos, bulones, guantes de trabajo y protección auditiva.' }
    ];

    const products: Product[] = [
      {
        id: `${storeSlug}-taladro-percutor-750w`,
        sku: 'FERR-TAL750',
        name: 'Taladro Percutor 750W con Mandril de 13mm y Velocidad Variable',
        category: 'herramientas-electricas',
        description: 'Potente motor de 750W con función percutora para mampostería, gatillo con bloqueo para uso continuo y empuñadura ergonómica.',
        retailPrice: 48500,
        wholesalePrice: 41000,
        wholesaleMinQty: 3,
        stock: 18,
        minStock: 4,
        unit: 'unidad',
        imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'],
        featured: true,
        active: true,
        specifications: [
          { key: 'Potencia', value: '750 Watts Reales' },
          { key: 'Mandril', value: '13mm metálico con llave' },
          { key: 'Reversa', value: 'Giro horario y antihorario' }
        ]
      },
      {
        id: `${storeSlug}-caja-herramientas-prof`,
        sku: 'FERR-CAJA19',
        name: 'Caja de Herramientas Plástica Reforzada 19 Pulgadas con Gavetero',
        category: 'herramientas-manuales',
        description: 'Estructura antichoque con cierres metálicos de seguridad, bandeja interna desmontable y organizadores en la tapa.',
        retailPrice: 22000,
        wholesalePrice: 18500,
        wholesaleMinQty: 4,
        stock: 25,
        minStock: 5,
        unit: 'unidad',
        imageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80'],
        featured: false,
        active: true,
        specifications: [
          { key: 'Medidas', value: '48 x 25 x 23 cm' },
          { key: 'Material', value: 'Polipropileno de alto impacto' }
        ]
      }
    ];

    const company: CompanyProfile = {
      name: cleanName,
      tagline: 'FERRETERÍA INDUSTRIAL, HERRAMIENTAS & MATERIALES',
      legalName: `${cleanName} Ferretería`,
      taxId: '30-71777777-3',
      address: 'Av. Comercial Ferretera',
      city: 'Envíos a todo el país',
      phone: cleanPhone,
      email: cleanEmail,
      website: cleanWeb,
      currency: 'ARS',
      currencySymbol: '$',
      bankAccount: {
        bank: 'Banco BBVA',
        alias: `${storeSlug.toUpperCase().slice(0, 10)}.FERR`,
        cbu: '0170000000000000000003',
        holder: cleanName,
        mercadoPagoAlias: `${storeSlug.toUpperCase().slice(0, 10)}.MP`,
      },
      catalogTitle: `Catálogo de Herramientas & Materiales de ${cleanName}`,
      catalogDescription: 'Herramientas eléctricas y manuales para talleres, instaladores, obras y el hogar con stock permanente y precios de fábrica.',
      heroTitle: `${cleanName} · Herramientas Profesionales & Materiales`,
      heroSubtitle: 'Todo lo que necesitás para tus proyectos de construcción y mantenimiento con la mejor atención y garantía.',
      heroImageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1200&q=80',
      heroCtaText: 'Consultar Stock',
      metaDescription: `Catálogo oficial de ${cleanName}. Herramientas eléctricas, manuales y ferretería general.`,
      catalogNotes: 'Facturación A y B. Envíos a todo el país con transporte de carga o correo postal. Descuentos por volumen a gremios.',
      termsAndConditions: 'Garantía oficial de fábrica en herramientas eléctricas. Medios de pago: Efectivo, transferencias y tarjetas.',
      whatsappCatalogUrl: `https://wa.me/${cleanPhone.replace(/[^\d]/g, '')}`,
      showWhatsAppCatalogButton: true,
      brandColors: {
        primary: '#D97706',
        secondary: '#0F172A',
        accent: '#F59E0B',
        topBarBg: '#1C1917',
        headerBg: '#FFFFFF',
        heroBg: '#292524',
      },
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      wholesaleEnabled: true,
      wholesaleMinUnits: 3,
      valueBadges: [
        { id: 'b1', title: 'Marcas Líderes', subtitle: 'Herramientas profesionales probadas', iconName: 'ShieldCheck' },
        { id: 'b2', title: 'Despacho Rápido', subtitle: 'Envíos a obras y talleres en todo el país', iconName: 'Truck' },
        { id: 'b3', title: 'Asesoramiento Técnico', subtitle: 'Especialistas para guiarte en tu compra', iconName: 'MessageCircle' },
        { id: 'b4', title: 'Factura A y B', subtitle: 'Venta a empresas, instaladores y público', iconName: 'CreditCard' }
      ]
    };

    return { company, categories, products };
  }

  // DEFAULT / INDUMENTARIA / TIENDA GENERAL
  const categories: Category[] = [
    { id: 'destacados-temporada', name: 'Destacados de Temporada', iconName: 'Sparkles', color: '#E11D48', description: 'Artículos más elegidos por nuestros clientes con entrega inmediata.' },
    { id: 'ropa-moda', name: 'Indumentaria & Prendas', iconName: 'Shirt', color: '#0284C7', description: 'Prendas de alta calidad, confección cuidada y variedad de talles.' },
    { id: 'calzado-sneakers', name: 'Calzado & Zapatillas', iconName: 'Footprints', color: '#10B981', description: 'Modelos urbanos y deportivos diseñados para tu comodidad diaria.' },
    { id: 'accesorios-varios', name: 'Accesorios & Complementos', iconName: 'Glasses', color: '#8B5CF6', description: 'Complementos perfectos para combinar con tu estilo diario.' }
  ];

  const products: Product[] = [
    {
      id: `${storeSlug}-articulo-estrella-01`,
      sku: 'ART-001',
      name: `${cleanName} - Artículo Destacado Edición Oficial`,
      category: 'destacados-temporada',
      description: 'Producto premium confeccionado con materiales de primera selección, diseño ergonómico y terminaciones reforzadas.',
      retailPrice: 32000,
      wholesalePrice: 26000,
      wholesaleMinQty: 4,
      stock: 24,
      minStock: 5,
      unit: 'unidad',
      imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80'],
      featured: true,
      active: true,
      specifications: [
        { key: 'Edición', value: 'Oficial de Temporada' },
        { key: 'Disponibilidad', value: 'Stock para entrega inmediata' }
      ]
    },
    {
      id: `${storeSlug}-articulo-estrella-02`,
      sku: 'ART-002',
      name: `${cleanName} - Prenda Confort Clásica`,
      category: 'ropa-moda',
      description: 'Ideal para uso diario y ocasiones especiales. Tela transpirable de máxima durabilidad y corte moderno.',
      retailPrice: 24500,
      wholesalePrice: 19500,
      wholesaleMinQty: 6,
      stock: 30,
      minStock: 6,
      unit: 'unidad',
      imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80'],
      featured: true,
      active: true,
      specifications: [
        { key: 'Talles', value: 'S, M, L, XL' },
        { key: 'Material', value: 'Algodón Premium' }
      ]
    }
  ];

  const company: CompanyProfile = {
    name: cleanName,
    tagline: 'CATÁLOGO OFICIAL & VENTAS DIRECTAS',
    legalName: `${cleanName} Oficial`,
    taxId: '30-71666666-4',
    address: 'Ventas Oficiales Online',
    city: 'Buenos Aires / Envíos a todo el país',
    phone: cleanPhone,
    email: cleanEmail,
    website: cleanWeb,
    currency: 'ARS',
    currencySymbol: '$',
    bankAccount: {
      bank: 'Banco Galicia',
      alias: `${storeSlug.toUpperCase().slice(0, 10)}.VENTAS`,
      cbu: '0070000000000000000004',
      holder: cleanName,
      mercadoPagoAlias: `${storeSlug.toUpperCase().slice(0, 10)}.MP`,
    },
    catalogTitle: `Catálogo Oficial de ${cleanName}`,
    catalogDescription: 'Explorá toda nuestra colección con stock en tiempo real, precios oficiales y pedidos directos por WhatsApp con envíos a todo el país.',
    heroTitle: `${cleanName} · Catálogo Oficial & Tienda Online`,
    heroSubtitle: 'Encontrá los mejores productos con atención personalizada, envíos express y garantía asegurada.',
    heroImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    heroCtaText: 'Comprar por WhatsApp',
    metaDescription: `Catálogo online oficial de ${cleanName}. Consultá stock y pedí directamente por WhatsApp.`,
    catalogNotes: 'Atención personalizada directa por WhatsApp. Envíos y entregas coordinadas a todo el país.',
    termsAndConditions: 'Cambios garantizados dentro de los 30 días de realizada la compra. Medios de pago: Transferencias bancarias, tarjetas y Mercado Pago.',
    whatsappCatalogUrl: `https://wa.me/${cleanPhone.replace(/[^\d]/g, '')}`,
    showWhatsAppCatalogButton: true,
    brandColors: {
      primary: '#2563EB',
      secondary: '#0F172A',
      accent: '#3B82F6',
      topBarBg: '#0F172A',
      headerBg: '#FFFFFF',
      heroBg: '#1E293B',
    },
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    wholesaleEnabled: true,
    wholesaleMinUnits: 4,
    valueBadges: [
      { id: 'b1', title: '100% Original', subtitle: 'Garantía oficial y autenticidad asegurada', iconName: 'ShieldCheck' },
      { id: 'b2', title: 'Envíos Nacionales', subtitle: 'Despacho seguro a toda la Argentina', iconName: 'Truck' },
      { id: 'b3', title: 'Atención por WhatsApp', subtitle: 'Atención y pedidos inmediatos', iconName: 'MessageCircle' },
      { id: 'b4', title: 'Medios de Pago', subtitle: 'Transferencia, tarjetas y Mercado Pago', iconName: 'CreditCard' }
    ]
  };

  return { company, categories, products };
}

/**
 * Returns default preset catalog data for any tenant.
 * Guarantees that neither Google, Brave, Edge, nor any new store created
 * ever defaults to Titufaris or gets an empty blank state.
 */
export function getTenantDefaultData(tenantId: string): {
  company: CompanyProfile;
  categories: Category[];
  products: Product[];
} | null {
  if (!tenantId || tenantId === 'titufaris') {
    return null; // Titufaris uses initialData
  }

  const clean = tenantId.toLowerCase().trim();

  if (clean === 'zapas' || clean.includes('zapas')) {
    return {
      company: JSON.parse(JSON.stringify(zapasCompany)),
      categories: JSON.parse(JSON.stringify(zapasCategories)),
      products: JSON.parse(JSON.stringify(zapasProducts))
    };
  }

  if (clean === 'claudia-soft' || clean.includes('claudia')) {
    return {
      company: JSON.parse(JSON.stringify(claudiaSoftCompany)),
      categories: JSON.parse(JSON.stringify(claudiaSoftCategories)),
      products: JSON.parse(JSON.stringify(claudiaSoftProducts))
    };
  }

  if (clean === 'moncheestanterias' || clean.includes('monche')) {
    return {
      company: JSON.parse(JSON.stringify(moncheCompany)),
      categories: JSON.parse(JSON.stringify(moncheCategories)),
      products: JSON.parse(JSON.stringify(moncheProducts))
    };
  }

  // Look up store in saved SaaS tenants if available
  let matchedName = clean.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  let matchedPreset: TenantCategoryPresetType = 'general';
  let matchedPhone = '+54 9 11 5829-4310';
  let matchedEmail = `contacto@${clean}.titufaris.online`;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem('titufaris_saas_tenants_v1');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const found = list.find((t: any) => t && (t.id === clean || t.slug === clean));
          if (found) {
            matchedName = found.name || matchedName;
            matchedPhone = found.ownerPhone || matchedPhone;
            matchedEmail = found.ownerEmail || matchedEmail;
            const notes = (found.notes || '').toLowerCase();
            if (notes.includes('gastro')) matchedPreset = 'gastronomia';
            else if (notes.includes('indum') || notes.includes('moda') || notes.includes('ropa')) matchedPreset = 'indumentaria';
            else if (notes.includes('tecno') || notes.includes('electro')) matchedPreset = 'tecnologia';
            else if (notes.includes('ferret') || notes.includes('herram')) matchedPreset = 'ferreteria';
          }
        }
      }
    }
  } catch {
    // Ignore localStorage parse errors in non-browser context
  }

  return getPresetDataForCategory(matchedPreset, matchedName, clean, matchedEmail, matchedPhone);
}

