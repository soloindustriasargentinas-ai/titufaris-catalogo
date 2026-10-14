import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  ShoppingBag,
  Phone,
  ShieldCheck,
  Truck,
  Building2,
  FileText,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Package,
  Store,
  CreditCard,
  MessageCircle,
  Star,
  ArrowUpDown,
  Clock,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  QrCode,
  Share2,
  Map,
  Edit3,
  Layers,
  Check,
  Instagram,
  Facebook,
  Linkedin,
} from 'lucide-react';
import { Product, Category, CompanyProfile } from '../types';
import { formatCurrency } from '../utils/storage';
import { getWhatsAppBusinessCatalogUrl } from '../utils/whatsAppCatalog';
import { copyOrShareProduct } from '../utils/productShare';
import { buildProductUrl, slugify } from '../utils/seoAndRouting';
import { Breadcrumbs } from './Breadcrumbs';
import { TitufarisLogo } from './TitufarisLogo';

export type PublicStoreSortOption =
  | 'featured_first'
  | 'price_asc'
  | 'price_desc'
  | 'name_asc'
  | 'name_desc'
  | 'newest';

interface PublicStoreViewProps {
  products: Product[];
  categories: Category[];
  company: CompanyProfile;
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  onOpenProductDetail: (p: Product) => void;
  onOpenQR?: (p: Product) => void;
  onShareProduct?: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  onOpenCatalogPDF: () => void;
  onSwitchToStaffMode: () => void;
  onOpenLegalModal?: (tab: 'terms' | 'privacy' | 'warranty') => void;
  onOpenCart?: () => void;
  onOpenSitemap?: () => void;
  onOpenHeroSettings?: () => void;
  cartCount?: number;
  cartTotal?: number;
  isDemoMode?: boolean;
}

export const PublicStoreView: React.FC<PublicStoreViewProps> = ({
  products,
  categories,
  company,
  selectedCategory,
  onSelectCategory,
  onOpenProductDetail,
  onOpenQR,
  onShareProduct,
  onAddToCart,
  onOpenCatalogPDF,
  onSwitchToStaffMode,
  onOpenLegalModal,
  onOpenCart,
  onOpenSitemap,
  onOpenHeroSettings,
  cartCount = 0,
  cartTotal = 0,
  isDemoMode = false,
}) => {
  const [sortBy, setSortBy] = useState<PublicStoreSortOption>('featured_first');
  const [filterFeaturedOnly, setFilterFeaturedOnly] = useState(false);
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'in_stock' | 'made_to_order'>('all');
  const [expandedSpecs, setExpandedSpecs] = useState<Record<string, boolean>>({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobileCatMenuOpen, setIsMobileCatMenuOpen] = useState(false);

  const isTitufaris = !isDemoMode && company.name.toLowerCase().includes('titufaris');
  const isGenericDemo = isDemoMode;
  const isCustomStore = !isTitufaris && !isGenericDemo;
  const brandPrimary = company.brandColors?.primary || '#EA580C';
  const brandFont = company.fontFamily || 'inherit';

  // Dynamic Hero Configuration with customizable title, subtitle, image and CTA
  const displayHeroTitle = company.heroTitle?.trim() || (
    isCustomStore
      ? `${company.name} · Catálogo Oficial & Ventas Directas`
      : isGenericDemo
      ? 'Catálogo Digital & Tienda Online Oficial'
      : 'Instalaciones comerciales e industriales: Góndolas, Estanterías Metálicas, Racks y Lockers'
  );

  const displayHeroSubtitle = company.heroSubtitle?.trim() || (
    isCustomStore
      ? `${company.tagline || 'Explorá todos nuestros artículos con stock en vivo, precios oficiales y pedidos directos por WhatsApp con envíos rápidos a todo el país.'}`
      : isGenericDemo
      ? 'Demostración de catálogo comercial moderno con sincronización instantánea de inventario, pasarela de cobros y pedidos directos a WhatsApp para potenciar las ventas de tu negocio.'
      : 'Fabricación directa de soluciones de exhibición y almacenamiento: Góndolas comerciales reforzadas, Estanterías Metálicas de alta durabilidad, Racks Livianos para carga manual, Racks Selectivos para cargas pesadas paletizadas, Lockers y Guardarropas para personal e instituciones. Asesoramiento técnico en layouts y envíos a todo el país.'
  );

  const heroImageSrc = company.heroImageUrl?.trim() || (
    isCustomStore
      ? 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80'
      : isGenericDemo
      ? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80'
      : 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80'
  );

  const heroCtaLabel = company.heroCtaText?.trim() || (
    isCustomStore ? `Consultar a ${company.name}` : isGenericDemo ? 'Hacer Consulta por WhatsApp' : 'Asesoramiento por WhatsApp'
  );

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filtrar categorías: en la tienda pública SOLO se muestran las que tienen productos cargados
  const activeCategories = useMemo(() => {
    return categories.filter(c => products.some(p => p.category === c.id && p.active !== false));
  }, [categories, products]);

  // Total featured products in the current category/search filter
  const featuredCount = useMemo(() => {
    return products.filter(p => p.featured).length;
  }, [products]);

  const inStockCount = useMemo(() => {
    return products.filter(p => !p.isMadeToOrder).length;
  }, [products]);

  const madeToOrderCount = useMemo(() => {
    return products.filter(p => !!p.isMadeToOrder).length;
  }, [products]);

  // Mandatory: When sorting products in the online store, featured products must always be seen first!
  const sortedProducts = useMemo(() => {
    let list = [...products];

    if (filterFeaturedOnly) {
      list = list.filter(p => p.featured);
    }

    if (deliveryFilter === 'in_stock') {
      list = list.filter(p => !p.isMadeToOrder);
    } else if (deliveryFilter === 'made_to_order') {
      list = list.filter(p => !!p.isMadeToOrder);
    }

    return list.sort((a, b) => {
      // 1. Primary rule: Featured products (featured === true) are ALWAYS displayed first
      const aFeatured = a.featured ? 1 : 0;
      const bFeatured = b.featured ? 1 : 0;

      if (aFeatured !== bFeatured) {
        return bFeatured - aFeatured; // 1 before 0
      }

      // 2. Secondary rule: Apply selected sort criterion within featured and non-featured groups
      switch (sortBy) {
        case 'price_asc':
          return a.retailPrice - b.retailPrice;
        case 'price_desc':
          return b.retailPrice - a.retailPrice;
        case 'name_asc':
          return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
        case 'name_desc':
          return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });
        case 'newest':
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        case 'featured_first':
        default: {
          const aOrder = a.sortOrder ?? 999999;
          const bOrder = b.sortOrder ?? 999999;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return 0;
        }
      }
    });
  }, [products, sortBy, filterFeaturedOnly, deliveryFilter]);
  return (
    <div
      className="flex-1 pb-24 md:pb-16 w-full max-w-full overflow-x-hidden"
      style={{ fontFamily: brandFont }}
    >
      {/* Hero Banner Comercial */}
      <section className="bg-slate-950 text-white pt-10 pb-12 px-4 sm:px-6 relative overflow-hidden border-b border-slate-800">
        {/* Ambient atmospheric gradients & structural grid pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#F97316_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-10">
          {/* Main 2-column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
                  <span>
                    {isCustomStore
                      ? `${company.name} · Tienda Oficial Verificada`
                      : isGenericDemo
                      ? 'Catálogo Digital & Terminal POS'
                      : 'Fabricación Directa de Equipamiento Comercial'}
                  </span>
                </div>

                {onOpenHeroSettings && (
                  <button
                    type="button"
                    onClick={onOpenHeroSettings}
                    title="Modificar el título (H1), texto descriptivo y foto de portada"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Modificar Portada</span>
                  </button>
                )}
              </div>

              {/* Single Semantic H1 for Page Root */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.12] text-balance">
                {company.heroTitle ? (
                  <span>{company.heroTitle}</span>
                ) : isCustomStore ? (
                  <>
                    <span>{company.name}: </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-amber-300">
                      Catálogo Oficial & Ventas Directas
                    </span>
                  </>
                ) : isGenericDemo ? (
                  <>
                    Catálogo comercial interactivo:{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-indigo-300">
                      Ventas Directas por WhatsApp & Terminal POS
                    </span>
                  </>
                ) : (
                  <>
                    Instalaciones comerciales e industriales:{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                      Góndolas, Estanterías Metálicas, Racks y Lockers
                    </span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
                {displayHeroSubtitle}
              </p>

              {/* Dynamic Category Quick-Tags from store */}
              <div className="pt-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>{isCustomStore ? 'Líneas y categorías de la tienda:' : isGenericDemo ? 'Categorías y rubros de muestra:' : 'Líneas de fabricación disponibles:'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeCategories.map(c => {
                    const isSelected = selectedCategory === c.id;
                    const catColor = c.color || '#F97316';
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSelectCategory(c.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-orange-600 text-white border-orange-500 shadow-md scale-105'
                            : 'bg-slate-900/90 text-slate-300 border-slate-700/70 hover:border-slate-500 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: catColor }}
                        />
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Call to Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={`https://wa.me/${company.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    isDemoMode
                      ? 'Hola! Quisiera solicitar información y hacer una consulta sobre la tienda online y sus productos.'
                      : `Hola ${company.name}! Me gustaría solicitar asesoramiento y cotización para equipar un proyecto comercial.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Contactar por WhatsApp a ${company.name}`}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer hover:-translate-y-0.5"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>{heroCtaLabel}</span>
                </a>

                {company.showWhatsAppCatalogButton !== false && (
                  <a
                    href={getWhatsAppBusinessCatalogUrl(company)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Explorar el catálogo interactivo de ${company.name} en WhatsApp Business`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs sm:text-sm transition-all cursor-pointer hover:-translate-y-0.5 shadow-sm"
                    title={`Explorar el catálogo interactivo de ${company.name} directamente en WhatsApp Business`}
                  >
                    <MessageCircle className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                    <span>Ver Catálogo en WhatsApp</span>
                  </a>
                )}

                <button
                  onClick={onOpenCatalogPDF}
                  title="Descargar catálogo imprimible con códigos QR directos para cada artículo"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer hover:-translate-y-0.5 shadow-sm"
                >
                  <QrCode className="w-4 h-4 text-orange-400" />
                  <span>Catálogo PDF con Códigos QR</span>
                </button>
              </div>
            </div>

            {/* Right Visual Image Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Main Hero Image Container */}
                <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900 group">
                  <img
                    src={heroImageSrc}
                    alt={`${company.name} - ${company.tagline} - Foto de Portada e Instalaciones`}
                    referrerPolicy="no-referrer"
                    className="w-full h-[320px] sm:h-[380px] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Floating Badge 1 */}
                <div className="absolute top-3 left-3 sm:-top-4 sm:-left-4 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl p-3 shadow-xl flex items-center gap-3 z-10">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-white leading-tight">
                      {isCustomStore ? 'Catálogo en Vivo' : 'Stock Permanente'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isCustomStore ? 'Precios y stock actualizados' : 'Entrega y despacho inmediato'}
                    </div>
                  </div>
                </div>

                {/* Floating Badge 2 */}
                <div className="absolute bottom-3 right-3 sm:-bottom-4 sm:-right-4 bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-3 shadow-xl flex items-center gap-3 z-10">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-white leading-tight">
                      {isCustomStore ? 'Pedidos por WhatsApp' : isDemoMode ? 'Pedidos por WhatsApp' : 'Envíos a Todo el País'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isCustomStore ? 'Atención comercial directa' : isDemoMode ? 'Recepción de carritos en 1 clic' : 'Embalaje reforzado de fábrica'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Value Badges Bottom Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-8 border-t border-slate-800">
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                {isCustomStore ? <Store className="w-5 h-5 text-indigo-400" /> : isDemoMode ? <ShoppingBag className="w-5 h-5 text-orange-400" /> : <Building2 className="w-5 h-5 text-orange-400" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {isCustomStore ? 'Catálogo Oficial' : isDemoMode ? 'Catálogo Digital' : 'Directo de Fábrica'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {isCustomStore ? `${company.name} online` : isDemoMode ? 'Celulares, tablets y PC' : 'Sin intermediarios'}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                {isCustomStore ? <MessageCircle className="w-5 h-5 text-emerald-400" /> : isDemoMode ? <MessageCircle className="w-5 h-5 text-emerald-400" /> : <ShieldCheck className="w-5 h-5 text-orange-400" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {isCustomStore ? 'Ventas Directas' : isDemoMode ? 'Ventas por WhatsApp' : 'Garantía 12 Meses'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {isCustomStore ? 'Atención personalizada' : isDemoMode ? 'Sin comisiones por venta' : 'Estructuras reforzadas'}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {isCustomStore ? 'Envíos y Retiro' : isDemoMode ? 'Envíos y Retiro' : 'Envíos a Todo el País'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {isCustomStore ? 'Logística y entregas' : isDemoMode ? 'Mostrador y logística' : 'Embalaje de fábrica'}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                {isCustomStore ? <CreditCard className="w-5 h-5 text-sky-400" /> : isDemoMode ? <Lock className="w-5 h-5 text-amber-400" /> : <CheckCircle2 className="w-5 h-5 text-orange-400" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {isCustomStore ? 'Medios de Pago' : isDemoMode ? 'Punto de Venta POS' : 'Calidad Certificada'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {isCustomStore ? 'Efectivo, tarjetas y MP' : isDemoMode ? 'Control de caja integrado' : 'Pintura epoxi horneada'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="bg-white border-b border-slate-200 sticky top-[112px] sm:top-[120px] md:top-[85px] z-30 shadow-2xs w-full max-w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
          {/* Mobile Category Dropdown (expands downwards, NO lateral scroll) */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileCatMenuOpen(prev => !prev)}
              aria-expanded={isMobileCatMenuOpen}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold transition-all shadow-2xs hover:bg-slate-100 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="text-slate-500 font-normal">Categoría:</span>
                <span className="truncate text-slate-900 font-extrabold">
                  {selectedCategory === 'all'
                    ? 'Todas las Líneas'
                    : categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold shrink-0">
                  {selectedCategory === 'all'
                    ? products.length
                    : products.filter(p => p.category === selectedCategory).length}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ml-2 ${
                  isMobileCatMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Panel expanding downwards */}
            {isMobileCatMenuOpen && (
              <div className="mt-2 p-2 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[60vh] overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('all');
                    setIsMobileCatMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span>Todas las Líneas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono opacity-80 font-bold">({products.length})</span>
                    {selectedCategory === 'all' && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>

                {activeCategories.map(c => {
                  const count = products.filter(p => p.category === c.id).length;
                  const isSelected = selectedCategory === c.id;
                  const catColor = c.color || '#F97316';
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectCategory(c.id);
                        setIsMobileCatMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: catColor }}
                        />
                        <span className="truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Categories Bar (horizontal row only on md and up) */}
          <div className="hidden md:flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                onClick={() => onSelectCategory('all')}
                className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Todas las Líneas</span>
                <span className="text-[10px] font-mono opacity-80">({products.length})</span>
              </button>
              {activeCategories.map(c => {
                const count = products.filter(p => p.category === c.id).length;
                const isSelected = selectedCategory === c.id;
                const catColor = c.color || '#F97316';
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectCategory(c.id)}
                    style={
                      isSelected
                        ? { backgroundColor: catColor, color: '#ffffff' }
                        : { borderColor: `${catColor}40` }
                    }
                    className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                      isSelected
                        ? 'shadow-xs border-transparent'
                        : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
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
                );
              })}
            </div>

            <div className="text-xs text-slate-500 font-semibold shrink-0">
              {products.length} productos disponibles
            </div>
          </div>
        </div>
      </section>

      {/* Product Catalog Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Breadcrumbs Navigation (People-First & Schema.org) */}
        <Breadcrumbs
          items={[
            {
              label: 'Inicio',
              href: isDemoMode ? '/?demo=generica' : '/',
              onClick: () => onSelectCategory('all'),
            },
            ...(selectedCategory !== 'all'
              ? [
                  {
                    label: categories.find(c => c.id === selectedCategory)?.name || selectedCategory,
                    isCurrent: true,
                  },
                ]
              : [{ label: isDemoMode ? 'Catálogo General' : 'Catálogo de Equipamiento', isCurrent: true }]),
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {isDemoMode ? 'Catálogo General de Productos' : 'Catálogo de Equipamiento Comercial'}
            </h2>
            <p className="text-xs text-slate-500">
              {isDemoMode
                ? 'Selecciona cualquier producto para ver fotos, especificaciones detalladas o agregar al carrito de compra.'
                : 'Selecciona cualquier producto para ver especificaciones técnicas o solicitar presupuesto.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {company.showWhatsAppCatalogButton !== false && (
              <a
                href={getWhatsAppBusinessCatalogUrl(company)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="Abrir Catálogo oficial en WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                <span>Ver en WhatsApp</span>
              </a>
            )}

            <button
              onClick={onOpenCatalogPDF}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200/90 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Descargar Catálogo PDF</span>
            </button>
          </div>
        </div>

        {/* Catalog Sorting and Filter Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-slate-800 mr-1">
              {sortedProducts.length} {sortedProducts.length === 1 ? 'producto' : 'productos'}
              {selectedCategory !== 'all' && (
                <span className="text-slate-500 font-normal">
                  {' '}en {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                </span>
              )}
            </span>

            {/* Delivery mode filter pills */}
            <div className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setDeliveryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  deliveryFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setDeliveryFilter('in_stock')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  deliveryFilter === 'in_stock'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Entrega Inmediata ({inStockCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryFilter('made_to_order')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  deliveryFilter === 'made_to_order'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-indigo-700'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>A Pedido ({madeToOrderCount})</span>
              </button>
            </div>

            {featuredCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterFeaturedOnly(prev => !prev)}
                title={filterFeaturedOnly ? 'Mostrar todos los productos' : 'Ver únicamente productos destacados'}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterFeaturedOnly
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${filterFeaturedOnly ? 'fill-white' : 'fill-amber-500 text-amber-500'}`} />
                <span>Destacados ({featuredCount})</span>
              </button>
            )}

            {!filterFeaturedOnly && featuredCount > 0 && (
              <span className="text-[11px] text-amber-700 bg-amber-50/70 border border-amber-200/60 px-2.5 py-0.5 rounded-lg hidden xl:inline-flex items-center gap-1 font-medium">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                Destacados primero
              </span>
            )}
          </div>

          {/* Sort selector dropdown */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <label htmlFor="store-sort-select" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-orange-600" />
              <span>Ordenar por:</span>
            </label>
            <select
              id="store-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as PublicStoreSortOption)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-300 focus:border-orange-500 rounded-xl outline-none transition-colors cursor-pointer text-slate-800"
            >
              <option value="featured_first">⭐ Destacados y Relevancia</option>
              <option value="price_asc">Menor Precio (Destacados primero)</option>
              <option value="price_desc">Mayor Precio (Destacados primero)</option>
              <option value="name_asc">Nombre: A a Z (Destacados primero)</option>
              <option value="name_desc">Nombre: Z a A (Destacados primero)</option>
              <option value="newest">Más Nuevos (Destacados primero)</option>
            </select>
          </div>
        </div>

        {sortedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">No se encontraron productos</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Prueba seleccionando otra categoría o borrando los términos de búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {sortedProducts.map(product => {
              const cat = categories.find(c => c.id === product.category);
              return (
                <article
                  key={product.id}
                  onClick={() => onOpenProductDetail(product)}
                  aria-label={`Artículo: ${product.name}, precio ${formatCurrency(product.retailPrice)}`}
                  className={`bg-white rounded-2xl border transition-all flex flex-col overflow-hidden group cursor-pointer ${
                    product.featured
                      ? 'border-amber-300 ring-1 ring-amber-400/40 hover:border-orange-500 hover:shadow-xl shadow-xs'
                      : 'border-slate-200/90 hover:border-orange-300 hover:shadow-lg'
                  }`}
                >
                  {/* Image container - adjusted for full product fit */}
                  <div className="relative aspect-4/3 bg-slate-50 p-2.5 overflow-hidden flex items-center justify-center border-b border-slate-100">
                    <a
                      href={buildProductUrl(product, isDemoMode)}
                      onClick={(e) => {
                        e.preventDefault();
                        onOpenProductDetail(product);
                      }}
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      title={`Ver ficha técnica y detalles de ${product.name}`}
                    >
                      <img
                        src={
                          (product.images && product.images.length > 0 && product.images[0] && product.images[0].trim() !== '')
                            ? product.images[0]
                            : (product.imageUrl && product.imageUrl.trim() !== '')
                            ? product.imageUrl
                            : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80'
                        }
                        alt={`${product.name} - ${cat?.name || product.category} - ${company.name}`}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('unsplash.com')) {
                            target.src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80';
                          }
                        }}
                      />
                    </a>

                    {/* Category pill */}
                    <div className="absolute top-2.5 left-2.5 pointer-events-none">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-xs text-white text-[10px] font-bold shadow-xs"
                        style={{
                          backgroundColor: `${cat?.color || '#F97316'}E6`,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-2xs" />
                        <span>{cat?.name || product.category}</span>
                      </span>
                    </div>

                    {/* Top right badges & Share / QR action */}
                    <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
                      {product.featured && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                          <Star className="w-3 h-3 fill-white" />
                          <span>Destacado</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onShareProduct) {
                            onShareProduct(product);
                          } else {
                            copyOrShareProduct(product, company.name);
                          }
                        }}
                        title="Compartir enlace propio de este producto"
                        className="p-1.5 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-orange-600 shadow-md transition-all cursor-pointer hover:scale-110 border border-slate-200"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      {onOpenQR && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenQR(product);
                          }}
                          title="Ver Código QR para escanear con el celular o imprimir para catálogo"
                          className="p-1.5 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-orange-600 shadow-md transition-all cursor-pointer hover:scale-110 border border-slate-200"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <span className="font-mono text-[10px] text-slate-400 font-bold uppercase block">
                        SKU: {product.sku}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-orange-600 transition-colors line-clamp-2">
                        <a
                          href={buildProductUrl(product, isDemoMode)}
                          onClick={(e) => {
                            e.preventDefault();
                            onOpenProductDetail(product);
                          }}
                          className="hover:underline text-inherit"
                          title={`Ver especificaciones técnicas y detalles de ${product.name}`}
                        >
                          {product.name}
                        </a>
                      </h3>
                      {product.dimensions && (
                        <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                          📐 {product.dimensions}
                        </p>
                      )}
                      {product.description && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}

                      {/* Technical specifications box / pills */}
                      {(() => {
                        const cardSpecs = Array.isArray(product.specifications)
                          ? product.specifications.filter(s => s && s.key && s.value)
                          : (product.specifications && typeof product.specifications === 'object'
                            ? Object.entries(product.specifications).map(([k, v]) => ({
                                key: String(k),
                                value: String(typeof v === 'object' && v !== null ? (v as any).value || '' : v)
                              })).filter(s => s.key && s.value)
                            : []);

                        if (cardSpecs.length === 0) return null;

                        const isSpecsExpanded = !!expandedSpecs[product.id];
                        const visibleSpecs = isSpecsExpanded ? cardSpecs : cardSpecs.slice(0, 3);

                        return (
                          <div 
                            className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/90 space-y-1.5"
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                <SlidersHorizontal className="w-3 h-3 text-orange-600" />
                                <span>Ficha Técnica ({cardSpecs.length})</span>
                              </span>
                              {cardSpecs.length > 3 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedSpecs(prev => ({ ...prev, [product.id]: !prev[product.id] }));
                                  }}
                                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>{isSpecsExpanded ? 'Ver menos' : `+${cardSpecs.length - 3} más`}</span>
                                  {isSpecsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              )}
                            </div>

                            <div className="space-y-1">
                              {visibleSpecs.map((spec, sIdx) => (
                                <div 
                                  key={sIdx} 
                                  className="text-[11px] flex items-baseline justify-between gap-2 text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-200/60 shadow-2xs"
                                >
                                  <span className="font-semibold text-slate-600 shrink-0 text-[10.5px]">{spec.key}:</span>
                                  <span className="font-medium text-slate-900 text-right truncate text-[11px]" title={spec.value}>
                                    {spec.value}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <a
                              href={buildProductUrl(product, isDemoMode)}
                              onClick={(e) => {
                                e.preventDefault();
                                onOpenProductDetail(product);
                              }}
                              className="w-full text-center text-[10.5px] text-slate-600 hover:text-orange-600 font-semibold pt-0.5 cursor-pointer block transition-colors underline-offset-2 hover:underline"
                              title={`Ver especificaciones completas de ${product.name}`}
                            >
                              Ver ficha técnica completa de {product.name} →
                            </a>
                          </div>
                        );
                      })()}

                      {/* Delivery mode highlight */}
                      <div className="pt-0.5">
                        {product.isMadeToOrder ? (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-indigo-600" />
                            <span>Demora aprox. {product.leadTimeDays || 15} días hábiles</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Stock disponible para retiro o despacho</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price and Cart Buttons */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">
                            Precio de Venta
                          </span>
                          <span className="text-lg font-black text-slate-900">
                            {formatCurrency(product.retailPrice)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9.5px] font-bold text-orange-700 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-full inline-block">
                            Mayorista (+10 u.): {formatCurrency(product.wholesalePrice)}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1" onClick={e => e.stopPropagation()}>
                        {(() => {
                          const specsSummary = Array.isArray(product.specifications) && product.specifications.length > 0
                            ? ` [Medidas: ${product.specifications.slice(0, 3).map(s => `${s.key}: ${s.value}`).join(', ')}]`
                            : '';
                          const waText = `Hola ${company.name}! Me interesa el producto "${product.name}" (${product.sku})${specsSummary} por ${formatCurrency(product.retailPrice)}. ¿Podrían confirmarme disponibilidad y plazo de entrega?`;

                          return (
                            <a
                              href={`https://wa.me/${company.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waText)}`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Consultar por WhatsApp a ${company.name} sobre ${product.name}`}
                              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>
                          );
                        })()}

                        <button
                          onClick={() => onAddToCart(product)}
                          aria-label={`Agregar ${product.name} al carrito de compras`}
                          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs shadow-orange-600/20 transition-all cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Comprar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Public Footer */}
      <footer id="public-store-footer" className="mt-20 border-t border-slate-200 bg-white pt-12 pb-8 px-4 sm:px-6 text-slate-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            {company.logoUrl || company.logo ? (
              <img
                src={company.logoUrl || company.logo}
                alt={`Logo de ${company.name}`}
                className="h-9 sm:h-11 w-auto max-w-[200px] object-contain"
              />
            ) : isTitufaris ? (
              <TitufarisLogo className="h-9 sm:h-11 w-auto" />
            ) : (
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-base shadow-xs"
                  style={{ backgroundColor: brandPrimary }}
                >
                  {company.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-base font-black text-slate-900">{company.name}</span>
              </div>
            )}
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              {isCustomStore
                ? (company.tagline || `${company.name} - Catálogo oficial con stock en tiempo real y atención directa por WhatsApp. Despachos y retiros coordinados directamente.`)
                : isDemoMode
                ? 'Plataforma integral de catálogo digital interactivo, pedidos automáticos por WhatsApp y Punto de Venta (POS) para mostrador.'
                : 'Tienda online de equipamiento comercial, estanterías pesadas y checkouts. Desarrollamos soluciones a medida para optimizar el layout y las ventas de tu salón comercial.'}
            </p>
            <div className="text-xs text-slate-600 space-y-1">
              <div>📍 <strong>{isDemoMode ? 'Casa Central / Salón:' : 'Fábrica y Ventas:'}</strong> {company.address}</div>
              <div>📞 <strong>Teléfono / WhatsApp:</strong> {company.phone}</div>
              <div>✉️ <strong>Email:</strong> {company.email}</div>
              <div>🏛️ <strong>CUIT:</strong> {company.taxId}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">
              {isDemoMode ? 'Departamentos & Categorías' : 'Líneas de Producción'}
            </h4>
            <ul className="text-xs space-y-2 text-slate-600">
              {activeCategories.map(cat => (
                <li key={cat.id}>
                  <a
                    href={isDemoMode ? `/?demo=generica&categoria=${slugify(cat.name)}&cat=${cat.id}` : `/?categoria=${slugify(cat.name)}&cat=${cat.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectCategory(cat.id);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 hover:text-orange-600 transition-colors py-0.5 group cursor-pointer"
                    title={`Explorar artículos de la línea ${cat.name}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                      style={{ backgroundColor: cat.color || '#F97316' }}
                    />
                    <span className="font-medium group-hover:underline">{cat.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna: Redes Sociales Oficiales */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">
              Redes Sociales
            </h4>
            <p className="text-[11px] text-slate-500">
              Seguinos en nuestras plataformas oficiales:
            </p>
            <ul className="text-xs space-y-2.5 text-slate-600 pt-0.5">
              <li>
                <a
                  href={company.socialLinks?.instagram || 'https://instagram.com/titufaris'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-slate-600 hover:text-pink-600 transition-colors py-0.5 group cursor-pointer"
                  title="Seguinos en Instagram"
                >
                  <Instagram className="w-4 h-4 text-pink-500 group-hover:scale-115 transition-transform shrink-0" />
                  <span className="font-medium group-hover:underline">Instagram</span>
                </a>
              </li>
              <li>
                <a
                  href={company.socialLinks?.facebook || 'https://facebook.com/titufaris'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors py-0.5 group cursor-pointer"
                  title="Seguinos en Facebook"
                >
                  <Facebook className="w-4 h-4 text-blue-600 group-hover:scale-115 transition-transform shrink-0" />
                  <span className="font-medium group-hover:underline">Facebook</span>
                </a>
              </li>
              <li>
                <a
                  href={company.socialLinks?.linkedin || 'https://linkedin.com/company/titufaris'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-slate-600 hover:text-sky-700 transition-colors py-0.5 group cursor-pointer"
                  title="Conectá con nosotros en LinkedIn"
                >
                  <Linkedin className="w-4 h-4 text-sky-700 group-hover:scale-115 transition-transform shrink-0" />
                  <span className="font-medium group-hover:underline">LinkedIn</span>
                </a>
              </li>
              <li>
                <a
                  href={company.socialLinks?.tiktok || 'https://tiktok.com/@titufaris'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-950 transition-colors py-0.5 group cursor-pointer"
                  title="Mirá nuestros videos y novedades en TikTok"
                >
                  <span className="w-4 h-4 flex items-center justify-center font-bold text-xs text-slate-900 group-hover:scale-115 transition-transform shrink-0">
                    🎵
                  </span>
                  <span className="font-medium group-hover:underline">TikTok</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">Marco Legal & Sitemap</h4>
            <ul className="text-xs space-y-2 text-slate-600">
              {onOpenSitemap && (
                <li>
                  <a
                    href={isDemoMode ? '/?demo=generica&vista=mapa-del-sitio' : '/?vista=mapa-del-sitio'}
                    id="footer-link-sitemap"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenSitemap();
                    }}
                    className="text-left text-orange-600 hover:text-orange-700 font-bold transition-colors underline-offset-2 hover:underline cursor-pointer flex items-center gap-1.5"
                    title="Ver mapa jerárquico del sitio web y archivo sitemap.xml para buscadores"
                  >
                    <Map className="w-3.5 h-3.5 shrink-0" />
                    <span>Mapa del Sitio Web (Sitemap)</span>
                  </a>
                </li>
              )}
              <li>
                <a
                  href={isDemoMode ? '/?demo=generica&vista=terminos' : '/?vista=terminos'}
                  id="footer-link-terms"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegalModal && onOpenLegalModal('terms');
                  }}
                  className="text-left text-slate-600 hover:text-orange-600 transition-colors underline-offset-2 hover:underline cursor-pointer block"
                  title="Ver los términos y condiciones de venta oficiales"
                >
                  Términos y Condiciones de Venta
                </a>
              </li>
              <li>
                <a
                  href={isDemoMode ? '/?demo=generica&vista=privacidad' : '/?vista=privacidad'}
                  id="footer-link-privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegalModal && onOpenLegalModal('privacy');
                  }}
                  className="text-left text-slate-600 hover:text-orange-600 transition-colors underline-offset-2 hover:underline cursor-pointer block"
                  title="Conocer nuestra política de privacidad y protección de datos conforme a la Ley 25.326"
                >
                  Protección de Datos (Ley 25.326)
                </a>
              </li>
              <li>
                <a
                  href={isDemoMode ? '/?demo=generica&vista=garantia' : '/?vista=garantia'}
                  id="footer-link-warranty"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegalModal && onOpenLegalModal('warranty');
                  }}
                  className="text-left text-slate-600 hover:text-orange-600 transition-colors underline-offset-2 hover:underline cursor-pointer block"
                  title="Consultar la cobertura y plazos de garantía oficial de fábrica"
                >
                  {isDemoMode ? 'Políticas de Garantía & Cambios' : 'Garantía de Fábrica & Logística'}
                </a>
              </li>
              <li className="text-[11px] text-slate-500 pt-1">
                Defensa de las y los Consumidores: Ley 24.240.
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            © {new Date().getFullYear()} {company.name}. CUIT {company.taxId}. {isDemoMode ? 'Software de Marca Blanca para Empresas.' : 'Todos los derechos reservados.'}
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            {onOpenSitemap && (
              <>
                <button
                  type="button"
                  onClick={onOpenSitemap}
                  className="hover:text-orange-600 text-slate-700 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <Map className="w-3.5 h-3.5 text-orange-600" />
                  <span>Mapa del Sitio</span>
                </button>
                <span>•</span>
              </>
            )}
            <button
              type="button"
              onClick={() => onOpenLegalModal && onOpenLegalModal('privacy')}
              className="hover:text-slate-800 cursor-pointer"
            >
              Privacidad
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onOpenLegalModal && onOpenLegalModal('terms')}
              className="hover:text-slate-800 cursor-pointer"
            >
              Términos
            </button>
            <span>•</span>
            <span>{isDemoMode ? 'Catálogo Digital & POS' : 'Equipamiento Comercial & Layout'}</span>
          </div>
        </div>
      </footer>

      {/* Mobile Quick Action Floating Bar (Phones only, safe-area-inset compliant) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-2">
        <a
          href={`https://wa.me/${company.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
            isDemoMode
              ? 'Hola! Quisiera hacer una consulta sobre los productos de la tienda online.'
              : `Hola ${company.name}! Quisiera hacer una consulta sobre los productos y opciones de entrega.`
          )}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Enviar mensaje por WhatsApp a ${company.name}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 bg-emerald-600 active:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-transform active:scale-95"
        >
          <MessageCircle className="w-4 h-4 fill-white shrink-0" />
          <span className="truncate">{isDemoMode ? 'WhatsApp Tienda' : 'WhatsApp Fábrica'}</span>
        </a>

        {onOpenCatalogPDF && (
          <button
            type="button"
            onClick={onOpenCatalogPDF}
            className="p-2.5 rounded-xl border border-slate-300 active:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0"
            title="Catálogo PDF con QR"
          >
            <FileText className="w-4 h-4 text-orange-600" />
          </button>
        )}

        {onOpenCart && (
          <button
            type="button"
            onClick={onOpenCart}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-2 bg-orange-600 active:bg-orange-700 text-white rounded-xl font-extrabold text-xs shadow-md shadow-orange-600/25 transition-transform active:scale-95"
          >
            <div className="relative shrink-0">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-white text-orange-600 font-black text-[9px] px-1 py-0.2 rounded-full shadow-2xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="truncate">{cartTotal > 0 ? formatCurrency(cartTotal) : 'Mi Pedido'}</span>
          </button>
        )}

        {showScrollTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-2.5 rounded-xl bg-slate-900 active:bg-slate-800 text-white flex items-center justify-center shadow-md shrink-0 transition-transform active:scale-95"
            title="Volver arriba"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
