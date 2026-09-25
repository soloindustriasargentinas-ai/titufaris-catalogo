import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Rss,
  CheckCircle2,
  Sliders,
  Code,
  Globe,
  ShoppingBag,
  Info,
  Search,
} from 'lucide-react';
import { Product, Category, CompanyProfile } from '../types';
import { formatCurrency } from '../utils/storage';
import {
  downloadGoogleMerchantXML,
  downloadGoogleMerchantTSV,
  generateGoogleMerchantXML,
  generateGoogleMerchantTSV,
  generateProductJsonLd,
} from '../utils/googleMerchant';

interface GoogleMerchantModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  company: CompanyProfile;
  onLoggedExport?: (type: string) => void;
}

export const GoogleMerchantModal: React.FC<GoogleMerchantModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  company,
  onLoggedExport,
}) => {
  const [activeTab, setActiveTab] = useState<'feed_xml' | 'tsv' | 'schema' | 'api' | 'guide'>('feed_xml');
  const [priceType, setPriceType] = useState<'retail' | 'wholesale'>('retail');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [copiedXml, setCopiedXml] = useState(false);
  const [copiedTsv, setCopiedTsv] = useState(false);
  const [copiedJsonLd, setCopiedJsonLd] = useState(false);
  const [selectedPreviewProductId, setSelectedPreviewProductId] = useState<string>(products[0]?.id || '');

  if (!isOpen) return null;

  const activeProducts = products.filter(p => p.active !== false);
  const previewProduct = products.find(p => p.id === selectedPreviewProductId) || activeProducts[0];

  const handleDownloadXML = () => {
    downloadGoogleMerchantXML(products, categories, company, {
      priceType,
      selectedCategories,
      onlyActive: true,
    });
    onLoggedExport?.('Feed XML Google Merchant Center');
  };

  const handleCopyXML = () => {
    const xml = generateGoogleMerchantXML(products, categories, company, {
      priceType,
      selectedCategories,
      onlyActive: true,
    });
    navigator.clipboard?.writeText(xml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2500);
  };

  const handleDownloadTSV = () => {
    downloadGoogleMerchantTSV(products, categories, company, {
      priceType,
      selectedCategories,
      onlyActive: true,
    });
    onLoggedExport?.('Planilla TSV Google Shopping');
  };

  const handleCopyTSV = () => {
    const tsv = generateGoogleMerchantTSV(products, categories, company, {
      priceType,
      selectedCategories,
      onlyActive: true,
    });
    navigator.clipboard?.writeText(tsv);
    setCopiedTsv(true);
    setTimeout(() => setCopiedTsv(false), 2500);
  };

  const handleCopyJsonLd = () => {
    if (!previewProduct) return;
    const json = JSON.stringify(generateProductJsonLd(previewProduct, company), null, 2);
    navigator.clipboard?.writeText(json);
    setCopiedJsonLd(true);
    setTimeout(() => setCopiedJsonLd(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header with Google Brand Palette */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base sm:text-lg tracking-tight">
                  Integración con Google Shopping & Merchant Center
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                  Google for Retail
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Publica tus productos en Google Search, Google Shopping, Google Imágenes y Perfil de Google Maps
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-blue-50/80 border-b border-blue-200/70 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-blue-950 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span><strong>{activeProducts.length}</strong> artículos listos para Google Shopping</span>
            </span>
            <span className="text-blue-300">•</span>
            <span className="text-blue-800 hidden sm:inline">
              Listados gratuitos de productos en Google habilitados
            </span>
          </div>

          <a
            href="https://merchants.google.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-300 hover:bg-blue-100 transition-colors shadow-2xs"
          >
            <ExternalLink className="w-3 h-3 text-blue-600" />
            <span>Abrir Google Merchant Center</span>
          </a>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 overflow-x-auto bg-slate-50 shrink-0">
          {[
            { id: 'feed_xml', label: '1. Feed XML (Oficial)', icon: Rss },
            { id: 'tsv', label: '2. Planilla TSV / Sheets', icon: FileSpreadsheet },
            { id: 'schema', label: '3. Fichas SEO Google (JSON-LD)', icon: Code },
            { id: 'api', label: '4. Content API for Shopping', icon: Globe },
            { id: 'guide', label: '5. Guía Paso a Paso', icon: HelpCircle },
          ].map(t => {
            const Icon = t.icon;
            const isSel = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  isSel
                    ? 'border-blue-600 text-blue-800 bg-white rounded-t-xl shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-t-lg'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSel ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: XML FEED (GOOGLE MERCHANT CENTER STANDARD) */}
          {activeTab === 'feed_xml' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3.5">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
                  <Rss className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-blue-950">
                    Feed RSS 2.0 XML de Google Merchant Center
                  </h3>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Este es el estándar oficial que Google Shopping y Google Merchant Center utilizan para rastrear e indexar tu catálogo. Incluye atributos obligatorios como <code className="bg-blue-100/80 px-1 py-0.5 rounded text-[11px] font-mono">g:id, g:title, g:description, g:link, g:image_link, g:price, g:availability, g:brand</code>.
                  </p>
                </div>
              </div>

              {/* Price Tier Selector */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Lista de Precios a Publicar en Google:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Selecciona si Google mostrará precios minoristas o mayoristas.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPriceType('retail')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      priceType === 'retail'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Precio Minorista Oficial
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriceType('wholesale')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      priceType === 'wholesale'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Precio Mayorista (10+ u.)
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Generar y Descargar Feed XML para Google
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Archivo listo para importar en Google Merchant Center &gt; Productos &gt; Feeds.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyXML}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    {copiedXml ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">¡XML Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Código XML</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadXML}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Feed XML (.xml)</span>
                  </button>
                </div>
              </div>

              {/* Free Listings in Google Explanation */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Fichas Gratuitas de Producto en Google (Free Listings)</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Desde 2020, Google permite a cualquier fabricante o comercio publicar sus productos en la pestaña de <strong>Google Shopping</strong> y en la <strong>Búsqueda de Google</strong> de forma 100% gratuita, sin necesidad de pagar por anuncios de Google Ads. Solo requieres subir este feed a Google Merchant Center.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TSV / GOOGLE SHEETS */}
          {activeTab === 'tsv' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3.5">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900">
                    Planilla de Texto Tabulada (TSV / Google Sheets)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Google Merchant Center admite archivos delimitados por tabulaciones (.tsv o .txt), los cuales puedes abrir directamente en Google Sheets o Excel para editar rápidamente y subir como fuente de datos.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Descargar Archivo TSV de Google Shopping
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Contiene todos los {activeProducts.length} productos con encabezados oficiales de Google for Retail.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyTSV}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    {copiedTsv ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar TSV</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTSV}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar TSV (.tsv)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCHEMA.ORG JSON-LD (GOOGLE SEARCH RICH SNIPPETS) */}
          {activeTab === 'schema' && (
            <div className="space-y-6">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3.5">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
                  <Code className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-indigo-950">
                    Datos Estructurados Schema.org / JSON-LD (Fichas Enriquecidas de Google)
                  </h3>
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    Google rastrea tu tienda web pública. Al tener etiquetas estructuradas <code className="bg-indigo-100 px-1 py-0.5 rounded text-[11px] font-mono">schema.org/Product</code>, Google muestra directamente el precio oficial, la imagen y la disponibilidad en los resultados de búsqueda orgánica.
                  </p>
                </div>
              </div>

              {/* Product preview selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ver JSON-LD generado para un artículo:
                </label>
                <select
                  value={selectedPreviewProductId}
                  onChange={e => setSelectedPreviewProductId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-900"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.name} — {formatCurrency(p.retailPrice)}
                    </option>
                  ))}
                </select>
              </div>

              {previewProduct && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      Código JSON-LD incrustado automáticamente para Googlebot:
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyJsonLd}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {copiedJsonLd ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto max-h-60 leading-relaxed">
                    {JSON.stringify(generateProductJsonLd(previewProduct, company), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GOOGLE CONTENT API FOR SHOPPING */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Globe className="w-4 h-4" />
                  <span>Google Content API for Shopping</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  La <strong>Content API for Shopping</strong> de Google permite la sincronización automatizada y en tiempo real de artículos directamente con la nube de Google Merchant Center mediante endpoints RESTful de Google Cloud (<code className="font-mono text-blue-300 text-[11px]">shoppingcontent.googleapis.com</code>).
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  ¿Cómo funciona la API de Google Shopping?
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">1. Merchant ID</span>
                    <p className="text-[11px]">
                      Identificador numérico único provisto por Google Merchant Center (ej. <code className="font-mono text-slate-800">123456789</code>) que asocia tus productos a tu empresa en Google.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">2. Cuenta de Servicio Google Cloud</span>
                    <p className="text-[11px]">
                      Permite que tu aplicación envíe actualizaciones automáticas de catálogo a Google sin interacción manual ni contraseñas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STEP BY STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Guía: Cómo publicar tu catálogo gratis en Google Shopping</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sigue estos 5 pasos para que tus productos aparezcan en la búsqueda de Google y en Google Shopping:
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    step: 1,
                    title: 'Crear cuenta gratuita en Google Merchant Center',
                    desc: 'Ingresa en merchants.google.com con la cuenta de Google de tu empresa y crea tu cuenta de comerciante.',
                  },
                  {
                    step: 2,
                    title: 'Verificar y reclamar tu sitio web',
                    desc: 'En "Información de la empresa", ingresa el dominio de tu tienda online Titufaris y verifica la propiedad con tu cuenta.',
                  },
                  {
                    step: 3,
                    title: 'Vincular con tu Perfil de Empresa en Google (Google Maps)',
                    desc: 'Conecta tu ficha de Google Maps para que los clientes locales vean qué productos tienes en stock físico en tu fábrica o local.',
                  },
                  {
                    step: 4,
                    title: 'Subir el Feed de Productos generado por Titufaris',
                    desc: 'En el menú "Productos" > "Feeds", haz clic en "+ Agregar feed", selecciona tu país (Argentina) e idioma (Español), y carga el archivo XML o TSV descargado desde esta ventana.',
                  },
                  {
                    step: 5,
                    title: '¡Listo! Productos publicados en Google',
                    desc: 'Google revisará tus artículos en 24 a 48 hs. Luego aparecerán de forma destacada con foto, precio y disponibilidad cuando los usuarios busquen góndolas, estanterías, racks o lockers.',
                  },
                ].map(item => (
                  <div key={item.step} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3.5">
                    <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {item.step}
                    </span>
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <span>Compatible con Google Merchant Center, Google Shopping y Schema.org</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
