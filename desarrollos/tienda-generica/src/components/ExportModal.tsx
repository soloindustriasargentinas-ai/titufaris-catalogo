import React, { useState } from 'react';
import { X, FileText, Download, Table, QrCode, Check, FileSpreadsheet, Sliders, Eye, ShieldCheck, MessageCircle, Globe, ShoppingBag } from 'lucide-react';
import { Product, Category, CompanyProfile } from '../types';
import { exportCatalogToPDF, exportToCSV, PDFExportOptions } from '../utils/pdfExport';
import { downloadWhatsAppCatalogCSV, getWhatsAppBusinessCatalogUrl } from '../utils/whatsAppCatalog';
import { downloadGoogleMerchantXML } from '../utils/googleMerchant';

interface ExportModalProps {
  products: Product[];
  categories: Category[];
  company: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onLoggedExport?: (type: string) => void;
  onOpenBackupModal?: () => void;
  onOpenWhatsAppCatalog?: () => void;
  onOpenGoogleMerchant?: () => void;
  isAdmin?: boolean;
  isPublicStore?: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  products,
  categories,
  company,
  isOpen,
  onClose,
  onLoggedExport,
  onOpenBackupModal,
  onOpenWhatsAppCatalog,
  onOpenGoogleMerchant,
  isAdmin = false,
  isPublicStore = false,
}) => {
  const isPublic = isPublicStore || !isAdmin;
  const [exportType, setExportType] = useState<PDFExportOptions['type']>('catalog_visual');
  const [docTitle, setDocTitle] = useState('CATÁLOGO OFICIAL DE EQUIPAMIENTO COMERCIAL');
  const [includeRetail, setIncludeRetail] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(false);
  const [includeCost, setIncludeCost] = useState(false);
  const [includeStock, setIncludeStock] = useState(true);
  const [includeSpecs, setIncludeSpecs] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [includeQRCodes, setIncludeQRCodes] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // En la tienda pública, ocultar categorías vacías del filtro de exportación
  const visibleCategories = isPublic
    ? categories.filter(c => products.some(p => p.category === c.id))
    : categories;

  if (!isOpen) return null;

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleSelectAllCategories = () => {
    if (selectedCategories.length === visibleCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(visibleCategories.map(c => c.id));
    }
  };

  const handleRunExport = async () => {
    setIsExporting(true);
    try {
      await exportCatalogToPDF(products, categories, company, {
        type: isPublic ? 'catalog_visual' : exportType,
        title: isPublic ? 'CATÁLOGO OFICIAL DE EQUIPAMIENTO COMERCIAL' : (docTitle.trim() || undefined),
        includeRetail: true,
        includeWholesale: isPublic ? false : includeWholesale,
        includeCost: isPublic ? false : includeCost, // Costos 100% bloqueados en modo público
        includeStock: isPublic ? true : includeStock,
        includeSpecs: isPublic ? true : includeSpecs,
        includeImages: isPublic ? true : includeImages, // Miniaturas siempre activas en el catálogo
        includeQRCodes: isPublic ? true : includeQRCodes,
        selectedCategories,
      });

      onLoggedExport?.(
        exportType === 'catalog_visual' || isPublic
          ? 'Catálogo Visual PDF'
          : exportType === 'price_list'
          ? 'Lista de Precios PDF'
          : 'Etiquetas QR PDF'
      );
      onClose();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRunCSV = () => {
    exportToCSV(products, categories);
    onLoggedExport?.('Exportación Excel / CSV');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">
                {isPublic ? 'Descargar Catálogo Oficial' : 'Exportar Catálogo & Listas de Precios'}
              </h2>
              <p className="text-xs text-slate-400">
                {isPublic
                  ? 'Documento PDF con fotografías en miniatura, medidas y especificaciones técnicas'
                  : 'Panel de control de exportación de documentos oficiales, etiquetas y planillas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Public presentation banner (Store mode) vs Format selector (Admin mode) */}
          {isPublic ? (
            <div className="p-4 bg-orange-50/80 border border-orange-200 rounded-2xl flex items-start gap-3.5">
              <div className="p-2.5 bg-orange-600 text-white rounded-xl shadow-xs shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">
                    Catálogo Oficial Ilustrado (PDF)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-700 border border-orange-200">
                    Con Miniaturas Fotográficas
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Descargue el catálogo de equipamiento comercial con imágenes en miniatura para fácil identificación de cada producto, medidas de fabricación, fichas técnicas y precios oficiales actualizados de venta al público.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                1. Seleccione el Formato de Salida (Admin)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'catalog_visual',
                    title: 'Catálogo Visual PDF',
                    desc: 'Fichas con fotos en miniatura, especificaciones técnicas y QR.',
                    icon: FileText,
                  },
                  {
                    id: 'price_list',
                    title: 'Lista de Precios B2B',
                    desc: 'Tabla apaisada con miniaturas, SKU, stock y columnas de precios.',
                    icon: Table,
                  },
                  {
                    id: 'qr_labels',
                    title: 'Etiquetas con QR',
                    desc: 'Grilla imprimible de etiquetas para góndolas con precios y QR.',
                    icon: QrCode,
                  },
                ].map(card => {
                  const Icon = card.icon;
                  const isSelected = exportType === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => {
                        setExportType(card.id as PDFExportOptions['type']);
                        if (card.id === 'price_list') {
                          setDocTitle('LISTA OFICIAL DE PRECIOS MAYORISTA Y MINORISTA');
                        } else if (card.id === 'qr_labels') {
                          setDocTitle('ETIQUETAS DE GÓNDOLA Y PRECIOS CON QR');
                        } else {
                          setDocTitle('CATÁLOGO OFICIAL DE EQUIPAMIENTO COMERCIAL');
                        }
                      }}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-orange-600' : 'text-slate-500'}`} />
                          {isSelected && <Check className="w-4 h-4 text-orange-600 font-bold" />}
                        </div>
                        <h3 className="font-bold text-xs text-slate-900 leading-tight mb-1">
                          {card.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          {card.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Document Title Input (Only for Admin) */}
          {!isPublic && (
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Encabezado del Documento
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-semibold text-slate-800"
              />
            </div>
          )}

          {/* Options Toggles: STRICTLY FOR ADMIN ONLY - Hidden in store so clients cannot check options or view costs */}
          {!isPublic && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-orange-600" />
                  <span>Campos a Incluir en el Documento (Exclusivo Administrador)</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Configuración interna
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeRetail}
                    onChange={e => setIncludeRetail(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded-sm border-slate-300 focus:ring-orange-500"
                  />
                  <span className="font-medium text-slate-700">Precio Minorista</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeWholesale}
                    onChange={e => setIncludeWholesale(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded-sm border-slate-300 focus:ring-orange-500"
                  />
                  <span className="font-medium text-slate-700">Precio Mayorista</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none p-1.5 bg-red-50/90 rounded-lg border border-red-200/80">
                  <input
                    type="checkbox"
                    checked={includeCost}
                    onChange={e => setIncludeCost(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded-sm border-red-300 focus:ring-red-500"
                  />
                  <span className="font-bold text-red-700">Costo (Uso Interno)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeStock}
                    onChange={e => setIncludeStock(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded-sm border-slate-300 focus:ring-orange-500"
                  />
                  <span className="font-medium text-slate-700">Estado de Stock</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeSpecs}
                    onChange={e => setIncludeSpecs(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded-sm border-slate-300 focus:ring-orange-500"
                  />
                  <span className="font-medium text-slate-700">Ficha Técnica</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={e => setIncludeImages(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded-sm border-slate-300 focus:ring-orange-500"
                  />
                  <span className="font-medium text-slate-700">Miniaturas / Fotos</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeQRCodes}
                    onChange={e => setIncludeQRCodes(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded-sm border-slate-300 focus:ring-orange-500"
                  />
                  <span className="font-medium text-slate-700">Códigos QR Directos</span>
                </label>
              </div>
            </div>
          )}

          {/* Categories Filter (Available for both admin and store customers) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Filtrar por Categoría ({selectedCategories.length === 0 ? 'Todas las categorías' : `${selectedCategories.length} de ${visibleCategories.length}`})
              </label>
              <button
                type="button"
                onClick={handleSelectAllCategories}
                className="text-xs text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
              >
                {selectedCategories.length === visibleCategories.length ? 'Desmarcar todas' : 'Todas'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {visibleCategories.map(c => {
                const isSelected = selectedCategories.length === 0 || selectedCategories.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Catalog Integration Banner */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0 shadow-2xs">
                <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-emerald-950">
                    Integración con Catálogo de WhatsApp (Meta Commerce)
                  </h4>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-200 text-emerald-900 uppercase">
                    CSV & Feeds
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  {isPublic
                    ? '¿Prefiere ver nuestro catálogo directamente en WhatsApp? Abra el catálogo en la app o consulte.'
                    : 'Exporte el archivo CSV oficial para Meta Commerce Manager o gestione enlaces automáticos.'}
                </p>
              </div>
            </div>
            {isPublic ? (
              <a
                href={getWhatsAppBusinessCatalogUrl(company)}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-600" />
                <span>Ver en WhatsApp</span>
              </a>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    downloadWhatsAppCatalogCSV(products, categories, company, {
                      priceType: includeWholesale ? 'wholesale' : 'retail',
                      selectedCategories,
                    });
                    onLoggedExport?.('Catálogo WhatsApp CSV');
                  }}
                  className="px-2.5 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  title="Descargar archivo CSV compatible con Meta Commerce Manager"
                >
                  Descargar CSV
                </button>
                {onOpenWhatsAppCatalog && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenWhatsAppCatalog();
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    Panel WhatsApp
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Google Shopping & Merchant Center Integration Banner */}
          {!isPublic && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 shadow-2xs">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-blue-950">
                      Integración con Google Shopping & Merchant Center
                    </h4>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-blue-200 text-blue-900 uppercase">
                      Google for Retail
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-800">
                    Publica tus productos gratis en la Búsqueda de Google, Google Shopping y Google Imágenes.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    downloadGoogleMerchantXML(products, categories, company, {
                      priceType: includeWholesale ? 'wholesale' : 'retail',
                      selectedCategories,
                    });
                    onLoggedExport?.('Feed XML Google Shopping');
                  }}
                  className="px-2.5 py-1.5 bg-white border border-blue-300 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  title="Descargar Feed XML para Google Merchant Center"
                >
                  Descargar XML
                </button>
                {onOpenGoogleMerchant && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenGoogleMerchant();
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    Panel Google
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Alternative: CSV / Excel download banner (Admin only) */}
          {!isPublic && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    ¿Necesita planilla editable de Excel?
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    Descargue los artículos, costos, precios de venta y stock en formato CSV / Excel.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRunCSV}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                Exportar CSV
              </button>
            </div>
          )}

          {/* Backup and Restore Banner (Admin only) */}
          {!isPublic && onOpenBackupModal && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-blue-950">
                    Copia de Seguridad Completa (Descargar e Importar)
                  </h4>
                  <p className="text-[11px] text-blue-800">
                    Respalde todo su catálogo en archivo JSON o restáurelo en su servidor con un solo clic.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBackupModal();
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                Copia de Seguridad
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleRunExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generando Catálogo PDF con Miniaturas...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isPublic ? 'Descargar Catálogo en PDF' : 'Descargar PDF Oficial'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
