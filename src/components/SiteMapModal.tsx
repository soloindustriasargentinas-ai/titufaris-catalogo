import React, { useState, useMemo } from 'react';
import {
  X,
  Map,
  Search,
  FileCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Package,
  Home,
  FileText,
  ShieldCheck,
  ShoppingBag,
  MessageCircle,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Product, Category, CompanyProfile } from '../types';
import { formatCurrency } from '../utils/storage';
import { generateSitemapXml, downloadSitemapFile, slugify } from '../utils/seoAndRouting';
import { Breadcrumbs } from './Breadcrumbs';

interface SiteMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  company: CompanyProfile;
  isDemoMode?: boolean;
  onSelectCategory: (catId: string) => void;
  onOpenProductDetail: (product: Product) => void;
  onOpenLegalModal?: (tab: 'terms' | 'privacy' | 'warranty') => void;
  onOpenCart?: () => void;
  onSwitchToStaffMode?: () => void;
}

export const SiteMapModal: React.FC<SiteMapModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  company,
  isDemoMode = false,
  onSelectCategory,
  onOpenProductDetail,
  onOpenLegalModal,
  onOpenCart,
  onSwitchToStaffMode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'visual' | 'xml'>('visual');
  const [copiedXml, setCopiedXml] = useState(false);

  // XML content generation
  const xmlContent = useMemo(() => {
    return generateSitemapXml(products, categories, company);
  }, [products, categories, company]);

  // Filtered categories and products
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(
      c => c.name.toLowerCase().includes(term) || (c.description && c.description.toLowerCase().includes(term))
    );
  }, [categories, searchTerm]);

  const filteredProducts = useMemo(() => {
    const activeProds = products.filter(p => p.active !== false);
    if (!searchTerm.trim()) return activeProds;
    const term = searchTerm.toLowerCase();
    return activeProds.filter(
      p =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  if (!isOpen) return null;

  const handleCopyXml = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(xmlContent);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = xmlContent;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedXml(true);
      setTimeout(() => setCopiedXml(false), 2500);
    } catch (err) {
      console.error('Error copying sitemap XML:', err);
    }
  };

  const handleDownloadXml = () => {
    downloadSitemapFile(xmlContent, 'sitemap.xml');
  };

  const mainPages = [
    {
      title: 'Inicio / Portada Principal',
      description: 'Página principal con vitrina destacada, propuesta de valor y accesos rápidos.',
      url: '/',
      icon: Home,
      action: () => {
        onClose();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      title: isDemoMode ? 'Catálogo General de Muestra' : 'Catálogo Completo de Equipamiento',
      description: 'Listado completo de productos con filtros por categoría, búsqueda y orden.',
      url: '/?categoria=all',
      icon: Package,
      action: () => {
        onClose();
        onSelectCategory('all');
      },
    },
    {
      title: 'Mi Pedido / Carrito de Compras',
      description: 'Revisión de productos seleccionados, cálculo de totales y envío directo a WhatsApp.',
      url: '/?vista=carrito',
      icon: ShoppingBag,
      action: () => {
        onClose();
        onOpenCart?.();
      },
    },
    {
      title: 'Términos y Condiciones Comerciales',
      description: 'Condiciones de venta, medios de pago bancarios, facturación y plazos de entrega.',
      url: '/?vista=terminos',
      icon: FileText,
      action: () => {
        onClose();
        onOpenLegalModal?.('terms');
      },
    },
    {
      title: 'Políticas de Privacidad y Protección de Datos',
      description: 'Cumplimiento normativo y tratamiento seguro de los datos de contacto.',
      url: '/?vista=privacidad',
      icon: ShieldCheck,
      action: () => {
        onClose();
        onOpenLegalModal?.('privacy');
      },
    },
    {
      title: isDemoMode ? 'Políticas de Garantía & Cambios' : 'Garantía Estructural & Asistencia Técnica',
      description: 'Alcance de garantía oficial, soporte técnico posventa y cobertura.',
      url: '/?vista=garantia',
      icon: Sparkles,
      action: () => {
        onClose();
        onOpenLegalModal?.('warranty');
      },
    },
    {
      title: 'Atención Directa por WhatsApp',
      description: 'Canal directo de asesoramiento comercial, cotizaciones de proyectos y consultas.',
      url: `https://wa.me/${company.phone.replace(/[^0-9]/g, '')}`,
      icon: MessageCircle,
      isExternal: true,
      action: () => {
        window.open(
          `https://wa.me/${company.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
            isDemoMode ? 'Hola! Quisiera hacer una consulta sobre la tienda online.' : `Hola ${company.name}! Me gustaría hacer una consulta.`
          )}`,
          '_blank'
        );
      },
    },
    {
      title: isDemoMode ? 'Terminal POS & Panel de Muestra' : 'Terminal POS & Panel de Gestión',
      description: 'Acceso para personal autorizado: control de stock, cobro en mostrador y administración.',
      url: '/?modo=gestion',
      icon: Lock,
      action: () => {
        onClose();
        onSwitchToStaffMode?.();
      },
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sitemap-modal-title"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-slate-950 text-white p-4 sm:p-5 px-5 sm:px-7 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h1 id="sitemap-modal-title" className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Mapa del Sitio Web</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {company.name}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Estructura jerárquica de navegación, URLs legibles y formato sitemap.xml para motores de búsqueda.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar mapa del sitio"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Header: Breadcrumbs & Mode Tabs */}
        <div className="px-5 sm:px-7 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <Breadcrumbs
            items={[
              { label: 'Inicio', onClick: onClose },
              { label: 'Mapa del Sitio Web', isCurrent: true },
            ]}
          />

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'visual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5 text-orange-600" />
              <span>Mapa Visual (Personas)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('xml')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'xml'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-blue-600" />
              <span>sitemap.xml (Google SEO)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {activeTab === 'visual' ? (
            <div className="space-y-6">
              {/* Filter / Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar páginas, líneas de productos o artículos del catálogo..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 outline-none transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 1. Main Pages Section */}
              <section className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Home className="w-4 h-4 text-orange-600" />
                    <span>1. Páginas Principales & Marco Legal ({mainPages.length})</span>
                  </h2>
                  <span className="text-[11px] text-slate-500 font-medium">Arquitectura base del sitio</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mainPages
                    .filter(
                      p =>
                        !searchTerm.trim() ||
                        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.description.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={idx}
                          onClick={item.action}
                          className="p-3.5 rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer bg-white group flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-orange-600 flex items-center gap-2">
                                <Icon className="w-4 h-4 text-slate-500 group-hover:text-orange-600 shrink-0" />
                                <span>{item.title}</span>
                              </span>
                              {item.isExternal ? (
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 shrink-0" />
                              ) : (
                                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">{item.description}</p>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]">{item.url}</span>
                            <span className="text-[10px] font-bold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              Navegar →
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>

              {/* 2. Product Categories Section */}
              <section className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-600" />
                    <span>2. Líneas y Categorías ({filteredCategories.length})</span>
                  </h2>
                  <span className="text-[11px] text-slate-500 font-medium">Clasificación temática</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredCategories.map(cat => {
                    const catCount = products.filter(p => p.category === cat.id && p.active !== false).length;
                    const catSlug = slugify(cat.name);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          onClose();
                          onSelectCategory(cat.id);
                        }}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer bg-white group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                                style={{ backgroundColor: cat.color || '#F97316' }}
                              />
                              <h3 className="text-xs font-bold text-slate-900 truncate group-hover:text-orange-600">
                                {cat.name}
                              </h3>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                              {catCount} {catCount === 1 ? 'artículo' : 'artículos'}
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {cat.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-400">/?categoria={catSlug}</span>
                          <span className="text-[10px] font-bold text-orange-600 flex items-center gap-0.5">
                            Ver línea →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 3. Catalog Products Section */}
              <section className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-600" />
                    <span>3. Artículos y Productos Individuales ({filteredProducts.length})</span>
                  </h2>
                  <span className="text-[11px] text-slate-500 font-medium">Indexación completa del catálogo</span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden max-h-96 overflow-y-auto">
                  {filteredProducts.map(prod => {
                    const cat = categories.find(c => c.id === prod.category);
                    const prodSlug = slugify(prod.name);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => {
                          onClose();
                          onOpenProductDetail(prod);
                        }}
                        className="p-3 hover:bg-orange-50/50 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {prod.sku}
                            </span>
                            <span className="text-xs font-bold text-slate-900 group-hover:text-orange-600 truncate">
                              {prod.name}
                            </span>
                            {cat && (
                              <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.2 rounded-md">
                                {cat.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                            <span className="font-mono">/?producto={prodSlug}</span>
                            <span>•</span>
                            {prod.isMadeToOrder ? (
                              <span className="text-indigo-600 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" /> A pedido
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Inmediata
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-slate-900 block">
                            {formatCurrency(prod.retailPrice)}
                          </span>
                          <span className="text-[10px] font-bold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver detalles →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : (
            /* XML Tab */
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-blue-700" />
                    <span>Archivo sitemap.xml para Google Search Console & Bing Webmaster</span>
                  </h3>
                  <p className="text-[11px] text-blue-800 mt-1 leading-relaxed">
                    Este archivo XML sigue el estándar oficial sitemaps.org. Contiene {products.length + categories.length + 2} URLs canónicas con metadatos de actualización (lastmod), frecuencia de rastreo y esquema de imágenes para indexar en buscadores.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyXml}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-blue-300 text-blue-900 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    {copiedXml ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar XML</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadXml}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar sitemap.xml</span>
                  </button>
                </div>
              </div>

              {/* Code Viewer */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 overflow-x-auto text-xs font-mono text-emerald-400 max-h-[460px] leading-relaxed select-all">
                <pre>{xmlContent}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{company.name}</span>
            <span>•</span>
            <span>Total de URLs indexables: {products.length + categories.length + 2}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadXml}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Bajar sitemap.xml</span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
