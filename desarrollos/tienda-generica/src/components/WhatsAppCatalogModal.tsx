import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  MessageCircle,
  Download,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Rss,
  Layers,
  ShoppingBag,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Share2,
  Sliders,
  Send,
  Eye,
  RefreshCw,
  Zap,
  Key,
  Database,
  CloudLightning,
  AlertTriangle,
  Lock,
  Save,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Product, Category, CompanyProfile } from '../types';
import { formatCurrency } from '../utils/storage';
import {
  downloadWhatsAppCatalogCSV,
  generateWhatsAppCatalogCSV,
  generateWhatsAppCatalogFeedXML,
  getWhatsAppBusinessCatalogUrl,
  getWhatsAppProductShareText,
  openWhatsAppProductInquiry,
  getCleanPhoneNumber,
} from '../utils/whatsAppCatalog';
import {
  validateMetaCatalogConnection,
  syncProductsToMetaCatalog,
  MetaConnectionResult,
  MetaSyncResult,
} from '../utils/metaCatalogApi';
import { getProductPublicUrl } from '../utils/qrCode';

interface WhatsAppCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  company: CompanyProfile;
  onUpdateCompany?: (updated: CompanyProfile) => void;
  onLoggedExport?: (type: string) => void;
}

export const WhatsAppCatalogModal: React.FC<WhatsAppCatalogModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  company,
  onUpdateCompany,
  onLoggedExport,
}) => {
  const [activeTab, setActiveTab] = useState<'api' | 'export' | 'feed' | 'link' | 'cards' | 'tutorial'>('api');
  const [priceType, setPriceType] = useState<'retail' | 'wholesale'>('retail');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Meta Graph API State
  const [metaCatalogId, setMetaCatalogId] = useState(company.metaCatalogConfig?.catalogId || '');
  const [metaAccessToken, setMetaAccessToken] = useState(company.metaCatalogConfig?.accessToken || '');
  const [autoSyncOnChange, setAutoSyncOnChange] = useState(company.metaCatalogConfig?.autoSyncOnChange ?? true);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<MetaConnectionResult | null>(null);
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ processed: number; total: number } | null>(null);
  const [syncResult, setSyncResult] = useState<MetaSyncResult | null>(null);
  const [savedApiCredentials, setSavedApiCredentials] = useState(false);

  // CSV / Feed / Link State
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [catalogUrlInput, setCatalogUrlInput] = useState(company.whatsappCatalogUrl || '');
  const [showCatalogButton, setShowCatalogButton] = useState(company.showWhatsAppCatalogButton ?? true);
  const [savedSettings, setSavedSettings] = useState(false);
  const [catalogQrDataUrl, setCatalogQrDataUrl] = useState<string>('');
  const [selectedCardProductId, setSelectedCardProductId] = useState<string>(products[0]?.id || '');

  // Reset or load initial settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setMetaCatalogId(company.metaCatalogConfig?.catalogId || '');
      setMetaAccessToken(company.metaCatalogConfig?.accessToken || '');
      setAutoSyncOnChange(company.metaCatalogConfig?.autoSyncOnChange ?? true);
      setCatalogUrlInput(company.whatsappCatalogUrl || getWhatsAppBusinessCatalogUrl(company));
      setShowCatalogButton(company.showWhatsAppCatalogButton ?? true);
      if (products.length > 0 && !selectedCardProductId) {
        setSelectedCardProductId(products[0].id);
      }
    }
  }, [isOpen, company, products, selectedCardProductId]);

  // Generate QR code for the WhatsApp Catalog
  useEffect(() => {
    if (isOpen) {
      const targetUrl = catalogUrlInput.trim() || getWhatsAppBusinessCatalogUrl(company);
      QRCode.toDataURL(targetUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#064E3B', // Dark emerald
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      })
        .then(url => setCatalogQrDataUrl(url))
        .catch(err => console.error('Error generating WhatsApp Catalog QR:', err));
    }
  }, [isOpen, catalogUrlInput, company]);

  if (!isOpen) return null;

  // Statistics and Validation for WhatsApp Catalog
  const activeProducts = products.filter(p => p.active !== false);
  const productsWithImage = activeProducts.filter(p => p.imageUrl && p.imageUrl.trim().length > 0);
  const productsWithSku = activeProducts.filter(p => p.sku && p.sku.trim().length > 0);
  const productsWithPrice = activeProducts.filter(p => p.retailPrice > 0);
  const is100PercentReady = activeProducts.length > 0 &&
    productsWithImage.length === activeProducts.length &&
    productsWithSku.length === activeProducts.length &&
    productsWithPrice.length === activeProducts.length;

  const currentCatalogUrl = catalogUrlInput.trim() || getWhatsAppBusinessCatalogUrl(company);

  // Toggle Category selection
  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleSelectAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(c => c.id));
    }
  };

  // Save Meta API Credentials
  const handleSaveApiCredentials = async (andSyncNow = false) => {
    if (onUpdateCompany) {
      const updatedConfig = {
        ...company.metaCatalogConfig,
        catalogId: metaCatalogId.trim(),
        accessToken: metaAccessToken.trim(),
        autoSyncOnChange: autoSyncOnChange,
      };
      onUpdateCompany({
        ...company,
        metaCatalogConfig: updatedConfig,
      });
      setSavedApiCredentials(true);
      setTimeout(() => setSavedApiCredentials(false), 2500);

      if (andSyncNow) {
        await handleRunMetaApiSync();
      }
    }
  };

  // Test Meta API Connection
  const handleTestMetaConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await validateMetaCatalogConnection(metaCatalogId, metaAccessToken);
      setTestResult(res);
      if (res.ok) {
        handleSaveApiCredentials();
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Run Direct Meta Graph API Synchronization
  const handleRunMetaApiSync = async () => {
    if (!metaCatalogId.trim() || !metaAccessToken.trim()) {
      setTestResult({ ok: false, error: 'Por favor complete el Catalog ID y el Access Token de Meta.' });
      return;
    }

    setIsSyncingApi(true);
    setSyncResult(null);
    setSyncProgress({ processed: 0, total: activeProducts.length });

    try {
      const result = await syncProductsToMetaCatalog({
        catalogId: metaCatalogId,
        accessToken: metaAccessToken,
        products,
        categories,
        company,
        priceType,
        onProgress: (processed, total) => {
          setSyncProgress({ processed, total });
        },
      });

      setSyncResult(result);

      if (onUpdateCompany) {
        onUpdateCompany({
          ...company,
          metaCatalogConfig: {
            ...company.metaCatalogConfig,
            catalogId: metaCatalogId.trim(),
            accessToken: metaAccessToken.trim(),
            lastSyncAt: new Date().toISOString(),
            lastSyncStatus: result.ok ? 'success' : 'error',
            lastSyncResult: result.details,
          },
        });
      }

      onLoggedExport?.(`Sincronización API Meta WhatsApp (${result.syncedCount} productos)`);
    } catch (err) {
      setSyncResult({
        ok: false,
        totalProducts: activeProducts.length,
        syncedCount: 0,
        batchesCount: 0,
        errors: [err instanceof Error ? err.message : 'Error inesperado durante la sincronización por API.'],
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSyncingApi(false);
    }
  };

  // Download CSV Action
  const handleDownloadCSV = () => {
    downloadWhatsAppCatalogCSV(products, categories, company, {
      priceType,
      selectedCategories,
      onlyActive: true,
    });
    onLoggedExport?.(`Catálogo WhatsApp CSV (${priceType === 'wholesale' ? 'Mayorista' : 'Minorista'})`);
  };

  // Copy CSV Content
  const handleCopyCSV = () => {
    const csv = generateWhatsAppCatalogCSV(products, categories, company, {
      priceType,
      selectedCategories,
      onlyActive: true,
    });
    navigator.clipboard?.writeText(csv);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2500);
  };

  // Copy XML Feed
  const handleCopyFeed = () => {
    const xml = generateWhatsAppCatalogFeedXML(products, categories, company, {
      priceType,
      selectedCategories,
    });
    navigator.clipboard?.writeText(xml);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2500);
  };

  // Download XML Feed
  const handleDownloadXML = () => {
    const xml = generateWhatsAppCatalogFeedXML(products, categories, company, {
      priceType,
      selectedCategories,
    });
    const blob = new Blob([xml], { type: 'application/rss+xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Feed_Catalogo_WhatsApp_${new Date().toISOString().slice(0, 10)}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onLoggedExport?.('Feed XML Catálogo WhatsApp');
  };

  // Save Link & Button Configuration
  const handleSaveCompanyConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateCompany) {
      onUpdateCompany({
        ...company,
        whatsappCatalogUrl: catalogUrlInput.trim(),
        showWhatsAppCatalogButton: showCatalogButton,
      });
      setSavedSettings(true);
      setTimeout(() => setSavedSettings(false), 2500);
    }
  };

  // Copy Catalog Link
  const handleCopyLink = () => {
    navigator.clipboard?.writeText(currentCatalogUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Card product selected
  const cardProduct = products.find(p => p.id === selectedCardProductId) || products[0];

  const handleCopyCardText = () => {
    if (!cardProduct) return;
    const text = getWhatsAppProductShareText(cardProduct, company, priceType);
    navigator.clipboard?.writeText(text);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2500);
  };

  const handleSendCardWhatsApp = () => {
    if (!cardProduct) return;
    openWhatsAppProductInquiry(cardProduct, company, priceType);
  };

  // Preview rows for the CSV table preview
  const previewProducts = useMemo(() => {
    return products
      .filter(p => p.active !== false && (selectedCategories.length === 0 || selectedCategories.includes(p.category)))
      .slice(0, 5);
  }, [products, selectedCategories]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-emerald-950 text-white p-4 px-6 flex items-center justify-between shrink-0 border-b border-emerald-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 fill-emerald-400 text-emerald-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base sm:text-lg tracking-tight">
                  Integración con Catálogo de WhatsApp
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>Meta Graph API & Feeds</span>
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Sincronización en tiempo real por API oficial, generación de Data Feeds y conexión con WhatsApp Business
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status bar */}
        <div className="bg-emerald-50 border-b border-emerald-200/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-emerald-900 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span><strong>{activeProducts.length}</strong> artículos listos para sincronizar</span>
            </span>
            <span className="text-emerald-300">•</span>
            <span className="text-emerald-700 hidden sm:inline">
              Moneda: <strong>{company.currency || 'ARS'}</strong>
            </span>
            {company.metaCatalogConfig?.lastSyncAt && (
              <>
                <span className="text-emerald-300 hidden md:inline">•</span>
                <span className="text-emerald-700 hidden md:inline">
                  Última sinc. API: {new Date(company.metaCatalogConfig.lastSyncAt).toLocaleDateString()} {new Date(company.metaCatalogConfig.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={currentCatalogUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-2xs"
              title="Abrir el catálogo oficial de WhatsApp en una nueva pestaña"
            >
              <ExternalLink className="w-3 h-3 text-emerald-600" />
              <span>Probar Enlace WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 overflow-x-auto bg-slate-50 shrink-0">
          {[
            { id: 'api', label: '1. Sincronización API (Recomendado)', icon: Zap, badge: 'En Vivo' },
            { id: 'export', label: '2. Exportar CSV', icon: FileSpreadsheet },
            { id: 'feed', label: '3. Feed Automático (XML)', icon: Rss },
            { id: 'link', label: '4. Enlace & QR', icon: QrCode },
            { id: 'cards', label: '5. Fichas de Chat', icon: Share2 },
            { id: 'tutorial', label: '6. Guía Meta Business', icon: HelpCircle },
          ].map(t => {
            const Icon = t.icon;
            const isSel = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  isSel
                    ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-t-lg'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSel ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{t.label}</span>
                {t.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-600 text-white">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: DIRECT META GRAPH API SYNCHRONIZATION (THE HIGHEST GRADE SOLUTION) */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              {/* API vs CSV Explanatory Banner */}
              <div className="p-4 bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-400/30">
                      <Zap className="w-5 h-5 fill-emerald-400 text-emerald-950" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">
                        Sincronización Directa por Meta Graph API
                      </h3>
                      <p className="text-xs text-emerald-200">
                        La forma más rápida, moderna y automatizada de integrar WhatsApp Business
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider hidden sm:inline-block">
                    Conexión Directa en Segundos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-700/50 space-y-1">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>¿Por qué por API es mucho mejor?</span>
                    </span>
                    <p className="text-emerald-100 text-[11px] leading-relaxed">
                      Envía todos los artículos, precios y fotos directamente a los servidores de Meta sin necesidad de descargar ni subir archivos manualmente. Cada modificación se refleja de inmediato en los chats de WhatsApp de tus clientes.
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-700/50 space-y-1">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                      <span>¿Cuándo usar CSV?</span>
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      El CSV (Pestaña 2) es ideal si aún no has generado tu Token de Sistema de Meta o prefieres realizar una carga manual de prueba antes de habilitar la API.
                    </p>
                  </div>
                </div>
              </div>

              {/* API Configuration Credentials Box */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Credenciales de Meta Commerce Manager
                    </h4>
                  </div>
                  {savedApiCredentials && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Credenciales guardadas</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Catalog ID */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Meta Catalog ID (ID del Catálogo de Meta):
                    </label>
                    <input
                      type="text"
                      value={metaCatalogId}
                      onChange={e => setMetaCatalogId(e.target.value)}
                      placeholder="Ej. 129482910485720"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono text-slate-900 outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Encuéntralo en Meta Business Suite &gt; Commerce Manager &gt; Catálogos &gt; Configuración.
                    </span>
                  </div>

                  {/* Access Token */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">
                        Meta System User Access Token:
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAccessToken(!showAccessToken)}
                        className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                      >
                        {showAccessToken ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showAccessToken ? 'text' : 'password'}
                        value={metaAccessToken}
                        onChange={e => setMetaAccessToken(e.target.value)}
                        placeholder="EAA..."
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono text-slate-900 outline-none focus:border-emerald-500 pr-10"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Token con permiso <code className="bg-slate-200 px-1 py-0.2 rounded font-mono">catalog_management</code>.
                    </span>
                  </div>
                </div>

                {/* Auto-Sync on Change Toggle */}
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                      <span>Sincronización Automática en Tiempo Real (Auto-Sync)</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-snug">
                      Sube y actualiza automáticamente los artículos en Facebook y WhatsApp al crear o editar productos en Titufaris.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={autoSyncOnChange}
                      onChange={e => setAutoSyncOnChange(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Connection Test & Save buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestMetaConnection}
                      disabled={isTestingConnection || !metaCatalogId.trim() || !metaAccessToken.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isTestingConnection ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                          <span>Verificando...</span>
                        </>
                      ) : (
                        <>
                          <CloudLightning className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Probar Conexión</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveApiCredentials(false)}
                      disabled={!metaCatalogId.trim() || !metaAccessToken.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {savedApiCredentials ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">¡Guardado!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 text-slate-500" />
                          <span>Guardar Credenciales</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveApiCredentials(true)}
                    disabled={isSyncingApi || !metaCatalogId.trim() || !metaAccessToken.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {isSyncingApi ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sincronizando {activeProducts.length} productos...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Guardar y Sincronizar Todo Ahora</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test Result Feedback */}
                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                      testResult.ok
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-red-50 border-red-300 text-red-900'
                    }`}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      {testResult.ok ? (
                        <>
                          <div className="font-bold">¡Conexión Exitosa con Meta Graph API!</div>
                          <div className="text-[11px] text-emerald-800 mt-0.5">
                            Catálogo identificado: <strong>{testResult.catalogName}</strong> (ID: {testResult.catalogId}). Artículos actualmente en Meta: {testResult.productCount}.
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-bold">No se pudo conectar con Meta:</div>
                          <div className="text-[11px] text-red-800 mt-0.5">{testResult.error}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Tier Selection for API */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Tarifa a sincronizar en WhatsApp:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Se publicarán {activeProducts.length} productos en el catálogo de WhatsApp.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPriceType('retail')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      priceType === 'retail'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Precio Minorista
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriceType('wholesale')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      priceType === 'wholesale'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Precio Mayorista (10+ u.)
                  </button>
                </div>
              </div>

              {/* Live Progress Bar when Syncing */}
              {isSyncingApi && syncProgress && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                      <span>Sincronizando productos con WhatsApp Business vía Meta API...</span>
                    </span>
                    <span>{syncProgress.processed} de {syncProgress.total}</span>
                  </div>
                  <div className="w-full bg-emerald-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round((syncProgress.processed / Math.max(1, syncProgress.total)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Sync Result Feedback */}
              {syncResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
                    syncResult.ok
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {syncResult.ok ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    )}
                    <span>{syncResult.ok ? '¡Sincronización por API completada con éxito!' : 'Sincronización parcial'}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{syncResult.details}</p>
                  {syncResult.errors.length > 0 && (
                    <div className="space-y-3 pt-1">
                      <div className="p-3 bg-white/90 rounded-xl border border-amber-200 space-y-1">
                        <span className="font-bold text-[11px] text-amber-900 block">Detalles de advertencias/errores:</span>
                        <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                          {syncResult.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-emerald-100/80 border border-emerald-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-[11.5px] text-emerald-950">
                          <strong className="block text-emerald-900">¿Deseas sincronizar todos los productos de inmediato sin lidiar con errores de API?</strong>
                          <span>Descarga el archivo CSV oficial de Titufaris listo para Meta e impórtalo en Commerce Manager en 10 segundos.</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleDownloadCSV}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar CSV para Meta</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Main Action Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                <div>
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                    <span>Lanzar Sincronización Automática con WhatsApp</span>
                  </h4>
                  <p className="text-xs text-slate-600">
                    Actualiza todos los {activeProducts.length} productos en Meta Commerce Manager en tiempo real.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunMetaApiSync}
                  disabled={isSyncingApi}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSyncingApi ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sincronizando por API...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Sincronizar Ahora por API</span>
                    </>
                  )}
                </button>
              </div>

              {/* How to get Token Guide */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  <span>¿Cómo obtener tu Token de Sistema de Meta en 3 minutos?</span>
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed text-[11.5px]">
                  <li>Ve a <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold hover:underline">Meta Business Suite &gt; Usuarios del Sistema</a>.</li>
                  <li>Haz clic en <strong>Agregar Usuario del Sistema</strong> (Rol: Administrador).</li>
                  <li>Haz clic en <strong>Generar nuevo token</strong>, selecciona tu aplicación de Meta y marca el permiso <code className="bg-slate-200 px-1 py-0.2 rounded font-mono font-bold text-slate-800">catalog_management</code>.</li>
                  <li>Copia el token generado y pégalo en el campo superior. ¡Quedará guardado en tu sistema!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: EXPORT CSV FOR META COMMERCE / WHATSAPP CATALOG */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3.5">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-emerald-950">
                    Archivo de Catálogo Estándar para Meta Commerce Manager (WhatsApp Business)
                  </h3>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Descargue este archivo CSV estructurado específicamente según los requerimientos oficiales de Meta (Facebook & WhatsApp). Incluye las columnas exactas: <code className="bg-emerald-100/80 px-1 py-0.5 rounded text-[11px] font-mono">id, title, description, availability, price, link, image_link, brand</code> para subir a tu Administrador de Comercio de Meta con 1 solo clic.
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price tier selection */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lista de Precios a Exportar</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Elija qué precio se mostrará en las etiquetas de producto de WhatsApp:
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPriceType('retail')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        priceType === 'retail'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>Precio Minorista</span>
                      {priceType === 'retail' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPriceType('wholesale')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        priceType === 'wholesale'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>Precio Mayorista (10+ u.)</span>
                      {priceType === 'wholesale' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  </div>
                </div>

                {/* Data Quality Check */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Auditoría de Requisitos de Meta</span>
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Fotos de producto cargadas:</span>
                      <span className="font-bold text-slate-800">{productsWithImage.length} / {activeProducts.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Códigos SKU asignados:</span>
                      <span className="font-bold text-slate-800">{productsWithSku.length} / {activeProducts.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Precios válidos:</span>
                      <span className="font-bold text-slate-800">{productsWithPrice.length} / {activeProducts.length}</span>
                    </div>
                  </div>
                  {is100PercentReady ? (
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 mt-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>¡Excelente! Todos los artículos cumplen los estándares de WhatsApp.</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Filtrar Categorías ({selectedCategories.length === 0 ? 'Todas las categorías' : `${selectedCategories.length} de ${categories.length}`})
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllCategories}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    {selectedCategories.length === categories.length ? 'Desmarcar todas' : 'Seleccionar todas'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(c => {
                    const isSelected = selectedCategories.length === 0 || selectedCategories.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCategory(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-900 text-white border-emerald-900 shadow-2xs'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Vista Previa del Mapeo de Columnas para Meta Commerce (Primeros 5 registros)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Formato CSV UTF-8</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">id (SKU)</th>
                        <th className="px-3 py-2">title (Nombre)</th>
                        <th className="px-3 py-2">availability</th>
                        <th className="px-3 py-2">price</th>
                        <th className="px-3 py-2">brand</th>
                        <th className="px-3 py-2">link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {previewProducts.map(p => {
                        const price = priceType === 'wholesale' ? p.wholesalePrice : p.retailPrice;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-bold text-slate-900">{p.sku}</td>
                            <td className="px-3 py-2 font-sans font-medium text-slate-800 truncate max-w-[200px]" title={p.name}>
                              {p.name}
                            </td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                in stock
                              </span>
                            </td>
                            <td className="px-3 py-2 font-bold text-emerald-700">
                              {price.toFixed(2)} {company.currency || 'ARS'}
                            </td>
                            <td className="px-3 py-2 text-slate-600">{company.name}</td>
                            <td className="px-3 py-2 text-blue-600 truncate max-w-[150px]">
                              {getProductPublicUrl(p)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Descargar Catálogo Completo para Meta / WhatsApp
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Archivo listo para importar en Meta Business Suite &gt; Commerce Manager &gt; Catálogos.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyCSV}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    {copiedCsv ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar CSV</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Archivo CSV</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUTOMATIC SCHEDULED DATA FEED (XML / RSS) */}
          {activeTab === 'feed' && (
            <div className="space-y-6">
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-3.5">
                <div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-xs shrink-0">
                  <Rss className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-sky-950">
                    Sincronización Automática con Meta Commerce Manager (Data Feed)
                  </h3>
                  <p className="text-xs text-sky-800 leading-relaxed">
                    Meta Commerce Manager te permite programar una sincronización periódica (por ejemplo, todas las mañanas o cada hora) para que cualquier cambio de precio, stock o descripción que hagas en Titufaris se actualice en WhatsApp sin tener que volver a subir archivos a mano.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Rss className="w-4 h-4 text-sky-600" />
                  <span>Descarga de Data Feed Estándar RSS / XML</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Genera el feed XML estandarizado con el formato Google Merchant / Meta RSS 2.0. Puedes alojarlo en tu servidor o utilizarlo como fuente de datos automatizada.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadXML}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Feed XML (Meta RSS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyFeed}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    {copiedFeed ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">¡Contenido XML copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Código XML</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  ¿Cómo programar la sincronización en Meta Commerce Manager?
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
                  <li>Ingresa a tu cuenta de <strong>Meta Business Suite</strong> y ve a <strong>Commerce Manager</strong>.</li>
                  <li>Selecciona tu catálogo conectado a WhatsApp y haz clic en <strong>Orígenes de datos</strong> &gt; <strong>Data Feed</strong>.</li>
                  <li>Elige la opción <strong>Sincronización Programada (Scheduled Feed)</strong>.</li>
                  <li>Establece la frecuencia (diaria o semanal) para que los precios se mantengan siempre actualizados automáticamente.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: DIRECT LINK & QR CODE */}
          {activeTab === 'link' && (
            <div className="space-y-6">
              <form onSubmit={handleSaveCompanyConfig} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>Configurar Enlace al Catálogo Oficial de WhatsApp</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Formato oficial: <code className="font-mono text-emerald-700">https://wa.me/c/&lt;CODIGO_PAIS&gt;&lt;NUMERO&gt;</code>
                    </p>
                  </div>

                  {savedSettings && (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      <span>¡Guardado!</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    URL Oficial del Catálogo de WhatsApp Business:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      required
                      value={catalogUrlInput}
                      onChange={e => setCatalogUrlInput(e.target.value)}
                      placeholder={`https://wa.me/c/${getCleanPhoneNumber(company.phone) || '5491158249100'}`}
                      className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none font-mono text-slate-800"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                </div>

                {/* Public Store Toggle */}
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCatalogButton}
                    onChange={e => setShowCatalogButton(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Mostrar botón destacado "Ver Catálogo en WhatsApp" en la Tienda Pública
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Permite que los clientes que naveguen por la web puedan abrir tu catálogo directamente en su aplicación de WhatsApp.
                    </span>
                  </div>
                </label>
              </form>

              {/* QR Code and Quick Share */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-emerald-200/80 shadow-xs">
                  {catalogQrDataUrl ? (
                    <img
                      src={catalogQrDataUrl}
                      alt="Código QR del Catálogo de WhatsApp"
                      className="w-48 h-48 rounded-xl object-contain shadow-2xs"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400">
                      Cargando QR...
                    </div>
                  )}
                  <span className="text-[10px] font-mono font-bold text-emerald-900 mt-2 text-center">
                    ESCANEAR PARA CATÁLOGO EN WHATSAPP
                  </span>
                </div>

                <div className="sm:col-span-8 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-900">
                      Código QR Imprimible para Local o Mostrador
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Imprime este código QR para colocarlo en tu salón comercial, volantes o mostrador de atención. Cuando los clientes lo escaneen con la cámara de su celular, se abrirá inmediatamente tu catálogo interactivo con fotos y precios dentro de WhatsApp.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Enlace de acceso rápido:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={currentCatalogUrl}
                        className="flex-1 text-xs font-mono text-emerald-900 bg-transparent outline-none select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[11px] rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        {copiedLink ? '¡Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={catalogQrDataUrl}
                      download={`QR_Catalogo_WhatsApp_${company.name}.png`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Imagen QR</span>
                    </a>

                    <a
                      href={currentCatalogUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Abrir en WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: QUICK CHAT PRODUCT CARDS (FICHAS) */}
          {activeTab === 'cards' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Generador de Fichas de Producto para Enviar por WhatsApp
                </h3>
                <p className="text-xs text-slate-500">
                  Selecciona un artículo para generar instantáneamente un mensaje estructurado con foto, precio mayorista/minorista, especificaciones técnicas y enlace directo a la web:
                </p>
              </div>

              {/* Product selector */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Seleccionar Producto del Catálogo:
                </label>
                <select
                  value={selectedCardProductId}
                  onChange={e => setSelectedCardProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold text-slate-900 cursor-pointer"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.name} — {formatCurrency(p.retailPrice)}
                    </option>
                  ))}
                </select>
              </div>

              {cardProduct && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Left: Product Thumbnail Preview */}
                  <div className="md:col-span-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
                    <img
                      src={cardProduct.imageUrl}
                      alt={cardProduct.name}
                      className="w-full h-40 object-cover rounded-xl border border-slate-200 shadow-2xs"
                    />
                    <div className="space-y-0.5">
                      <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                        {cardProduct.sku}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{cardProduct.name}</h4>
                      <div className="text-xs font-black text-emerald-700">
                        {formatCurrency(priceType === 'wholesale' ? cardProduct.wholesalePrice : cardProduct.retailPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Right: Message preview box */}
                  <div className="md:col-span-8 flex flex-col justify-between space-y-3">
                    <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 font-mono text-[11px] text-emerald-950 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed shadow-inner">
                      {getWhatsAppProductShareText(cardProduct, company, priceType)}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyCardText}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        {copiedCard ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">¡Mensaje Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Texto</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendCardWhatsApp}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Abrir en WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: STEP-BY-STEP TUTORIAL (META COMMERCE MANAGER) */}
          {activeTab === 'tutorial' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Guía Oficial: Cómo integrar tu Catálogo en WhatsApp Business</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sigue estos pasos para que todos los artículos de Titufaris aparezcan en tu WhatsApp Business:
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    step: 1,
                    title: 'Acceder a Meta Business Suite',
                    desc: 'Ingresa en business.facebook.com con la cuenta administradora de tu empresa y dirígete al menú "Todas las herramientas" > "Administrador de Comercio" (Commerce Manager).',
                  },
                  {
                    step: 2,
                    title: 'Crear o Seleccionar tu Catálogo',
                    desc: 'Si aún no tienes uno, haz clic en "+ Agregar catálogo", selecciona "Comercio Electrónico / Artículos" y ponle de nombre "Catálogo Titufaris".',
                  },
                  {
                    step: 3,
                    title: 'Vincular tu Número de WhatsApp Business',
                    desc: 'En la barra lateral izquierda, entra a "Configuración" > "Cuentas de WhatsApp" y añade el número comercial de tu empresa (+54 9 11 5824-9100).',
                  },
                  {
                    step: 4,
                    title: 'Elegir Método: Sincronización por API (Pestaña 1) o Subir Archivo CSV (Pestaña 2)',
                    desc: 'Por API oficial la sincronización es inmediata y en tiempo real con 1 clic. O bien puedes cargar el archivo CSV descargado si aún no creaste un token.',
                  },
                  {
                    step: 5,
                    title: '¡Listo! Catálogo sincronizado en WhatsApp',
                    desc: 'A partir de ese momento, cuando chatees con clientes podrás enviarles productos directamente desde el botón de la tienda en WhatsApp, y ellos verán tu catálogo completo en tu perfil comercial.',
                  },
                ].map(item => (
                  <div key={item.step} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3.5">
                    <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
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
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Soporte dual: Meta Graph API (Tiempo Real) y Meta Data Feed / CSV</span>
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
