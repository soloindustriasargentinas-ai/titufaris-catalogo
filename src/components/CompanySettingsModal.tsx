import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Building2,
  Save,
  Check,
  ShieldCheck,
  Download,
  Phone,
  Globe,
  Copy,
  ExternalLink,
  MessageCircle,
  Upload,
  Loader2,
  Instagram,
  Facebook,
  Linkedin,
  Share2,
  Palette,
  Type,
  Sparkles,
  Image as ImageIcon,
  Trash2,
  Eye,
  Rocket,
  CreditCard,
  FileText
} from 'lucide-react';
import { CompanyProfile } from '../types';
import { normalizeMercadoPagoUrl, getPublicStoreBaseUrl } from '../utils/qrCode';
import { compressImageFile } from '../utils/imageCompression';
import {
  BRAND_FONT_OPTIONS,
  BRAND_PALETTE_PRESETS,
  extractPaletteFromImage,
  ExtractedPalette
} from '../utils/brandColorExtractor';

interface CompanySettingsModalProps {
  company: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: CompanyProfile) => void;
  onOpenBackupModal?: () => void;
  onOpenCustomDomain?: () => void;
  onOpenSubscriptionModal?: () => void;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  company,
  isOpen,
  onClose,
  onSave,
  onOpenBackupModal,
  onOpenCustomDomain,
  onOpenSubscriptionModal,
}) => {
  const [activeTab, setActiveTab] = useState<'branding' | 'legal' | 'payment' | 'scaling'>('branding');
  const [formData, setFormData] = useState<CompanyProfile>(company);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const [extractedPalette, setExtractedPalette] = useState<ExtractedPalette | null>(null);

  const fileLogoInputRef = useRef<HTMLInputElement | null>(null);
  const fileHeroInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(company);
      // Auto-extract palette if logo already exists
      if (company.logoUrl && !extractedPalette) {
        extractPaletteFromImage(company.logoUrl).then(palette => {
          if (palette) setExtractedPalette(palette);
        });
      }
    }
  }, [isOpen, company]);

  if (!isOpen) return null;

  const publicStoreUrl = getPublicStoreBaseUrl();
  const currentPrimaryColor = formData.brandColors?.primary || '#EA580C';
  const currentSecondaryColor = formData.brandColors?.secondary || '#0F172A';
  const currentFontFamily = formData.fontFamily || "'Plus Jakarta Sans', system-ui, sans-serif";

  const handleCopyPublicUrl = () => {
    navigator.clipboard.writeText(publicStoreUrl);
    setCopiedPublicUrl(true);
    setTimeout(() => setCopiedPublicUrl(false), 2500);
  };

  // Upload and process official logo
  const handleUploadLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      const compressedDataUrl = await compressImageFile(file, 800, 0.92);
      setFormData(prev => ({
        ...prev,
        logoUrl: compressedDataUrl,
        logo: compressedDataUrl,
      }));

      // Extract colors from uploaded logo
      setIsExtractingColors(true);
      const palette = await extractPaletteFromImage(compressedDataUrl);
      if (palette) {
        setExtractedPalette(palette);
        // Automatically suggest applying extracted colors if no custom colors exist yet
        setFormData(prev => ({
          ...prev,
          brandColors: {
            primary: palette.primary,
            secondary: palette.secondary,
            accent: palette.accent,
          }
        }));
      }
    } catch (err) {
      console.error('Error procesando logo oficial:', err);
    } finally {
      setIsUploadingLogo(false);
      setIsExtractingColors(false);
      if (fileLogoInputRef.current) fileLogoInputRef.current.value = '';
    }
  };

  const handleApplyExtractedPalette = () => {
    if (!extractedPalette) return;
    setFormData(prev => ({
      ...prev,
      brandColors: {
        primary: extractedPalette.primary,
        secondary: extractedPalette.secondary,
        accent: extractedPalette.accent,
      }
    }));
  };

  const handleUploadHeroFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingHero(true);
      const compressedDataUrl = await compressImageFile(file, 1400, 0.82);
      setFormData(prev => ({
        ...prev,
        heroImageUrl: compressedDataUrl,
      }));
    } catch (err) {
      console.error('Error procesando foto de portada:', err);
    } finally {
      setIsUploadingHero(false);
      if (fileHeroInputRef.current) fileHeroInputRef.current.value = '';
    }
  };

  const handleChange = (field: keyof CompanyProfile, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleColorChange = (key: 'primary' | 'secondary' | 'accent', value: string) => {
    setFormData(prev => ({
      ...prev,
      brandColors: {
        primary: key === 'primary' ? value : (prev.brandColors?.primary || '#EA580C'),
        secondary: key === 'secondary' ? value : (prev.brandColors?.secondary || '#0F172A'),
        accent: key === 'accent' ? value : (prev.brandColors?.accent || '#F97316'),
      }
    }));
  };

  const handleApplyPresetPalette = (preset: typeof BRAND_PALETTE_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      brandColors: {
        primary: preset.primary,
        secondary: preset.secondary,
        accent: preset.accent,
      }
    }));
  };

  const handleBankChange = (field: keyof CompanyProfile['bankAccount'], value: string) => {
    setFormData(prev => ({
      ...prev,
      bankAccount: {
        ...prev.bankAccount,
        [field]: value,
      },
    }));
  };

  const handleSocialChange = (network: 'instagram' | 'facebook' | 'linkedin' | 'tiktok', value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks || {}),
        [network]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedFormData: CompanyProfile = {
      ...formData,
      logo: formData.logoUrl || formData.logo,
      bankAccount: {
        ...formData.bankAccount,
        mercadoPagoLink: formData.bankAccount.mercadoPagoLink?.trim()
          ? normalizeMercadoPagoUrl(formData.bankAccount.mercadoPagoLink)
          : '',
      },
    };
    onSave(sanitizedFormData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 text-white p-4 px-6 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: currentPrimaryColor }}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base leading-tight">Configuración & Editor de Marca</h2>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full uppercase">
                  Branding Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Personalizá el logo oficial, paleta cromática, tipografía y datos comerciales de tu tienda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'branding'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>🎨 Marca & Editor Visual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('legal')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'legal'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>🏛️ Datos Legales & Contacto</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'payment'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>💳 Cobros & Medios de Pago</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scaling')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'scaling'
                ? 'border-indigo-600 text-indigo-700 bg-white font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Rocket className="w-4 h-4 text-indigo-600" />
            <span>🚀 Escalar & Dominio Propio</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: MARCA & EDITOR VISUAL (BRANDING, LOGO, PALETA, FUENTE)             */}
          {/* ========================================================================= */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              {/* 1. SECCIÓN: LOGO OFICIAL DE LA MARCA */}
              <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Logo Oficial de la Empresa
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Ocupa el lugar insignia de la cabecera, pie de página y membrete de comprobantes
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                    Cabecera & Footer
                  </span>
                </div>

                {/* Previsualización y carga del Logo */}
                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                  {/* Vista Previa del Logo en modo claro y oscuro */}
                  <div className="flex gap-2">
                    {/* Caja fondo claro */}
                    <div className="w-32 h-20 rounded-xl border border-slate-300 bg-white flex flex-col items-center justify-center p-2 relative overflow-hidden group">
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Logo oficial"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-slate-400">
                          <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-40" />
                          <span className="text-[9px] font-bold block">Sin logo</span>
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 text-[8px] bg-slate-100 text-slate-500 px-1 rounded font-mono">
                        Claro
                      </span>
                    </div>

                    {/* Caja fondo oscuro */}
                    <div className="w-32 h-20 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-2 relative overflow-hidden group">
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Logo oficial en oscuro"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-slate-600">
                          <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-30" />
                          <span className="text-[9px] font-bold block">Sin logo</span>
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 text-[8px] bg-slate-800 text-slate-400 px-1 rounded font-mono">
                        Oscuro
                      </span>
                    </div>
                  </div>

                  {/* Acciones de subida de Logo */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        ref={fileLogoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleUploadLogoFile}
                        className="hidden"
                      />

                      <button
                        type="button"
                        disabled={isUploadingLogo}
                        onClick={() => fileLogoInputRef.current?.click()}
                        className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Procesando...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Subir Logo Oficial (PNG / SVG / JPG)</span>
                          </>
                        )}
                      </button>

                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            handleChange('logoUrl', '');
                            handleChange('logo', '');
                            setExtractedPalette(null);
                          }}
                          className="px-3 py-2 border border-slate-300 hover:bg-red-50 hover:text-red-600 text-slate-600 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Quitar Logo</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        O pega la URL directa de la imagen del logo:
                      </label>
                      <input
                        type="url"
                        value={formData.logoUrl || ''}
                        onChange={e => {
                          const val = e.target.value;
                          handleChange('logoUrl', val);
                          handleChange('logo', val);
                          if (val && val.startsWith('http')) {
                            extractPaletteFromImage(val).then(pal => {
                              if (pal) setExtractedPalette(pal);
                            });
                          }
                        }}
                        placeholder="https://ejemplo.com/mi-logo.png"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-orange-500 outline-none font-mono text-slate-800"
                      />
                    </div>

                    {/* Extracción de paleta desde el logo */}
                    {extractedPalette && (
                      <div className="pt-2 flex flex-wrap items-center gap-2.5 bg-white p-2.5 rounded-xl border border-orange-200">
                        <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-800">
                          Colores detectados en tu logo:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs inline-block"
                            style={{ backgroundColor: extractedPalette.primary }}
                            title={`Primario: ${extractedPalette.primary}`}
                          />
                          <span
                            className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs inline-block"
                            style={{ backgroundColor: extractedPalette.secondary }}
                            title={`Secundario: ${extractedPalette.secondary}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyExtractedPalette}
                          className="px-2.5 py-1 bg-orange-100 hover:bg-orange-200 text-orange-800 font-extrabold text-[11px] rounded-lg transition cursor-pointer ml-auto"
                        >
                          ✨ Aplicar paleta del logo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. SECCIÓN: PALETA DE COLORES DE LA MARCA */}
              <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Paleta de Colores de la Marca
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Aplica a botones de pedido, destacados, insignias y elementos corporativos
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                    Cromática Oficial
                  </span>
                </div>

                {/* Selectores de color Primario y Secundario */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Color Primario */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Color Primario (Botones, Acentos & Carrito)</span>
                      <span className="font-mono text-[11px] text-slate-500 font-normal">
                        {currentPrimaryColor}
                      </span>
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={currentPrimaryColor}
                        onChange={e => handleColorChange('primary', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                      />
                      <input
                        type="text"
                        value={currentPrimaryColor}
                        onChange={e => handleColorChange('primary', e.target.value)}
                        placeholder="#EA580C"
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 uppercase"
                      />
                      <div
                        className="px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-2xs"
                        style={{ backgroundColor: currentPrimaryColor }}
                      >
                        Botón
                      </div>
                    </div>
                  </div>

                  {/* Color Secundario */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Color Secundario / Fondo Oscuro</span>
                      <span className="font-mono text-[11px] text-slate-500 font-normal">
                        {currentSecondaryColor}
                      </span>
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={currentSecondaryColor}
                        onChange={e => handleColorChange('secondary', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                      />
                      <input
                        type="text"
                        value={currentSecondaryColor}
                        onChange={e => handleColorChange('secondary', e.target.value)}
                        placeholder="#0F172A"
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 uppercase"
                      />
                      <div
                        className="px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-2xs"
                        style={{ backgroundColor: currentSecondaryColor }}
                      >
                        Base
                      </div>
                    </div>
                  </div>
                </div>

                {/* Paletas de Colores Predefinidas por Rubro */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    O elegí una paleta recomendada para tu rubro con 1 clic:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BRAND_PALETTE_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPresetPalette(preset)}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 transition text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 inline-block"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block"
                            style={{ backgroundColor: preset.secondary }}
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block"
                            style={{ backgroundColor: preset.accent }}
                          />
                        </div>
                        <div className="text-[11px] font-bold text-slate-800 leading-tight">
                          {preset.name}
                        </div>
                        <div className="text-[9.5px] text-slate-400 truncate">
                          {preset.category}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. SECCIÓN: TIPOGRAFÍA OFICIAL DE LA MARCA */}
              <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <Type className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Tipografía Oficial de la Marca
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Aplica en todos los textos, títulos y catálogos de tu tienda online
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                    Fuente Web
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {BRAND_FONT_OPTIONS.map(font => {
                    const isSelected = (formData.fontFamily || "'Plus Jakarta Sans', system-ui, sans-serif") === font.fontFamily;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => handleChange('fontFamily', font.fontFamily)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer relative ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/50 shadow-xs ring-1 ring-orange-500'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-sm font-bold text-slate-900"
                            style={{ fontFamily: font.fontFamily }}
                          >
                            {font.name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-semibold text-orange-700 mb-1">
                          {font.category}
                        </div>
                        <p
                          className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed"
                          style={{ fontFamily: font.fontFamily }}
                        >
                          Catálogo oficial y precios mayoristas
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. SECCIÓN: BARRA DE ANUNCIOS SUPERIOR */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Barra de Anuncios Superior de la Tienda
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Top Bar</span>
                </div>
                <input
                  type="text"
                  value={formData.announcementBarText || ''}
                  onChange={e => handleChange('announcementBarText', e.target.value)}
                  placeholder="Envíos a todo el país · Asesoramiento personalizado por WhatsApp · Venta oficial"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-orange-500 outline-none font-medium text-slate-800"
                />
                <span className="text-[10px] text-slate-500 block">
                  Se muestra en la franja superior de la cabecera. Si se deja vacía, se usa el eslogan de la empresa.
                </span>
              </div>

              {/* 5. SECCIÓN: PORTADA & VITRINA PRINCIPAL (HERO) */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-orange-50/60 to-white border border-orange-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-orange-600" />
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Portada de Inicio (Hero Title & Foto)
                      </h3>
                      <p className="text-[11px] text-slate-600">
                        El primer impacto visual que ven tus clientes al entrar a tu web
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-orange-200 text-orange-950 font-bold px-2 py-0.5 rounded-full uppercase">
                    Vitrina
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                    Título Principal de Portada (H1)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.heroTitle ?? ''}
                    onChange={e => handleChange('heroTitle', e.target.value)}
                    placeholder="Calzado Oficial, Sneakers Urbanos y Modelos Exclusivos"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-orange-500 outline-none font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                    Párrafo Descriptivo de Portada
                  </label>
                  <textarea
                    rows={2}
                    value={formData.heroSubtitle ?? ''}
                    onChange={e => handleChange('heroSubtitle', e.target.value)}
                    placeholder="Explorá nuestro catálogo completo con stock en tiempo real y pedidos directos por WhatsApp."
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-orange-500 outline-none text-slate-800 text-xs"
                  />
                </div>

                {/* Subir foto de portada */}
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <div className="w-full sm:w-36 h-20 rounded-xl overflow-hidden border border-slate-300 bg-slate-900 shrink-0">
                    <img
                      src={
                        formData.heroImageUrl?.trim() ||
                        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80'
                      }
                      alt="Portada"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={formData.heroImageUrl ?? ''}
                        onChange={e => handleChange('heroImageUrl', e.target.value)}
                        placeholder="URL de foto o sube un archivo"
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-mono text-slate-800"
                      />
                      <input
                        ref={fileHeroInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUploadHeroFile}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploadingHero}
                        onClick={() => fileHeroInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-60"
                      >
                        {isUploadingHero ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Subiendo...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Subir Foto</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DATOS LEGALES & CONTACTO                                          */}
          {/* ========================================================================= */}
          {activeTab === 'legal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Nombre de Fantasía / Marca
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Eslogan / Bajada de Marca
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={e => handleChange('tagline', e.target.value)}
                    placeholder="CALZADO OFICIAL & TIENDA ONLINE"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Razón Social Legal
                  </label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={e => handleChange('legalName', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    CUIT / Identificación Fiscal
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={e => handleChange('taxId', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span>Teléfono / WhatsApp</span>
                    <span className="text-[10px] text-emerald-600 font-bold lowercase">pedidos web</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    placeholder="+54 9 11 5824-9100"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Correo Electrónico Oficial
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Dirección Física / Salón
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => handleChange('address', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Ciudad / Provincia
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => handleChange('city', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
                  />
                </div>
              </div>

              {/* Redes Sociales */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                  Redes Sociales Oficiales (Pie de Página)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-600" />
                      <span>Instagram</span>
                    </label>
                    <input
                      type="text"
                      value={formData.socialLinks?.instagram || ''}
                      onChange={e => handleSocialChange('instagram', e.target.value)}
                      placeholder="https://instagram.com/mimarca"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Facebook className="w-3.5 h-3.5 text-blue-600" />
                      <span>Facebook</span>
                    </label>
                    <input
                      type="text"
                      value={formData.socialLinks?.facebook || ''}
                      onChange={e => handleSocialChange('facebook', e.target.value)}
                      placeholder="https://facebook.com/mimarca"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: COBROS & MEDIOS DE PAGO                                            */}
          {/* ========================================================================= */}
          {activeTab === 'payment' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Datos Bancarios para Transferencias & Remitos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600">Entidad Bancaria</label>
                    <input
                      type="text"
                      value={formData.bankAccount.bank}
                      onChange={e => handleBankChange('bank', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600">Alias CBU / CVU</label>
                    <input
                      type="text"
                      value={formData.bankAccount.alias}
                      onChange={e => handleBankChange('alias', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none font-bold text-orange-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600">Número de CBU</label>
                    <input
                      type="text"
                      value={formData.bankAccount.cbu}
                      onChange={e => handleBankChange('cbu', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Mercado Pago */}
                <div className="pt-2 border-t border-slate-200 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-sky-700">
                        Alias Mercado Pago (CVU)
                      </label>
                      <input
                        type="text"
                        value={formData.bankAccount.mercadoPagoAlias || ''}
                        onChange={e => handleBankChange('mercadoPagoAlias', e.target.value)}
                        placeholder="MIMARCA.MP"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none font-bold text-sky-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-sky-700">
                        Link de Cobro / QR Oficial MP
                      </label>
                      <input
                        type="url"
                        value={formData.bankAccount.mercadoPagoLink || ''}
                        onChange={e => handleBankChange('mercadoPagoLink', e.target.value)}
                        placeholder="https://link.mercadopago.com.ar/mimarca"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none font-mono text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Condiciones comerciales en PDF */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Condiciones Comerciales & Garantía (Pie de Catálogo PDF)
                </label>
                <textarea
                  rows={2}
                  value={formData.catalogNotes}
                  onChange={e => handleChange('catalogNotes', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: ESCALAR & DOMINIO PROPIO (EXCLUSIVO DEL PANEL DE ADMIN)            */}
          {/* ========================================================================= */}
          {activeTab === 'scaling' && (
            <div className="space-y-4">
              {/* Tarjeta de Escalar Plan */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Rocket className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-bold">Escalar Plan & Capacidad de Tienda</h3>
                      <p className="text-xs text-indigo-200">
                        Mejora tu suscripción para habilitar más sucursales, facturación y almacenamiento ilimitado
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-bold px-2 py-0.5 rounded-full uppercase border border-indigo-500/40">
                    Admin
                  </span>
                </div>

                {onOpenSubscriptionModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSubscriptionModal();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Ver Planes & Opciones de Escala</span>
                  </button>
                )}
              </div>

              {/* Configurar Dominio Propio */}
              {onOpenCustomDomain && (
                <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Dominio Propio & Certificado SSL
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Conecta tu dominio web registrado (ej: <strong>mitienda.com</strong> o <strong>mimarca.com.ar</strong>) con Cloudflare DNS y HTTPS activo.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCustomDomain();
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Configurar Dominio</span>
                  </button>
                </div>
              )}

              {/* Enlace Público para Compartir */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-700" />
                    Enlace Público Oficial de la Tienda
                  </span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    Clientes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={formData.website || publicStoreUrl}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl font-mono text-emerald-950 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPublicUrl}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                  >
                    {copiedPublicUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPublicUrl ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Copia de Seguridad */}
              {onOpenBackupModal && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Copia de Seguridad y Migración
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Descarga un archivo JSON de respaldo de artículos y catálogo
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBackupModal();
                    }}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
                  >
                    Abrir Respaldo
                  </button>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: currentPrimaryColor }}
            />
            <span>Marca: <strong className="text-slate-800">{formData.name}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              style={{ backgroundColor: currentPrimaryColor }}
            >
              <Check className="w-4 h-4" />
              <span>Guardar & Aplicar Branding</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
