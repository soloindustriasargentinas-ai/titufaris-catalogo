import React, { useState } from 'react';
import { ShoppingBag, Search, FileText, Lock, MessageCircle, Share2, Check, X, Eye } from 'lucide-react';
import { CompanyProfile } from '../types';
import { formatCurrency } from '../utils/storage';
import { getPublicStoreBaseUrl } from '../utils/qrCode';
import { getWhatsAppBusinessCatalogUrl } from '../utils/whatsAppCatalog';
import { TitufarisLogo } from './TitufarisLogo';

interface PublicNavbarProps {
  company: CompanyProfile;
  cartCount: number;
  cartTotal: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCart: () => void;
  onOpenCatalogPDF: () => void;
  onSwitchToStaffMode: () => void;
  isDemoMode?: boolean;
  onToggleDemoMode?: () => void;
  onOpenMasterPanel?: () => void;
  onOpenSubscriptionModal?: () => void;
  onOpenCreateTenant?: () => void;
  activeStoreName?: string;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  company,
  cartCount,
  cartTotal,
  searchQuery,
  onSearchChange,
  onOpenCart,
  onOpenCatalogPDF,
  onSwitchToStaffMode,
  isDemoMode = false,
  onToggleDemoMode,
  onOpenMasterPanel,
  onOpenSubscriptionModal,
  onOpenCreateTenant,
  activeStoreName,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareStore = () => {
    const url = company.website && company.website.startsWith('http') ? company.website : getPublicStoreBaseUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const brandPrimary = company.brandColors?.primary || '#ea580c';
  const brandFont = company.fontFamily || 'inherit';
  const isTitufarisBrand = company.name.toLowerCase().includes('titufaris') && !isDemoMode;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs" style={{ fontFamily: brandFont }}>
      {/* Top Notification Announcement Bar */}
      <div className="bg-slate-950 text-white text-[11px] py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            {isTitufarisBrand ? (
              <>
                <span className="bg-orange-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded tracking-wider uppercase">
                  Fábrica Directa
                </span>
                <span className="text-slate-300 hidden sm:inline">
                  Venta Mayorista (a partir de 10 unidades) y Minorista con asesoramiento de fábrica.
                </span>
                <span className="text-slate-300 sm:hidden">
                  Venta Mayorista (10+ u.) y Minorista Titufaris
                </span>
              </>
            ) : (
              <>
                <span
                  className="text-white font-bold text-[9px] px-2 py-0.5 rounded tracking-wider uppercase shadow-2xs"
                  style={{ backgroundColor: brandPrimary }}
                >
                  Oficial
                </span>
                <span className="text-white font-semibold">{company.name}</span>
                <span className="text-slate-500" aria-hidden="true">&middot;</span>
                <span className="text-slate-300">
                  {company.announcementBarText || company.tagline || 'Catálogo Oficial con pedidos directos por WhatsApp y envíos a todo el país'}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 text-slate-300">
            {company.phone && (
              <div className="flex items-center gap-1.5">
                <a
                  href={`https://wa.me/${company.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hola ${company.name}! Quisiera hacer una consulta sobre los productos de la tienda.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                  title="Enviar mensaje directo por WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-white">{company.phone}</span>
                </a>
              </div>
            )}

            {/* Share Public Store Link */}
            <button
              onClick={handleShareStore}
              title="Copiar enlace oficial de la tienda"
              className="hover:text-white flex items-center gap-1 text-slate-300 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">¡Enlace copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3 h-3 text-slate-400" />
                  <span className="hidden sm:inline">Compartir Tienda</span>
                  <span className="sm:hidden">Compartir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Public Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          {company.logoUrl || company.logo ? (
            <img
              src={company.logoUrl || company.logo}
              alt={company.name}
              className="h-9 sm:h-11 w-auto max-w-[200px] object-contain"
            />
          ) : isTitufarisBrand ? (
            <TitufarisLogo className="h-9 sm:h-11 w-auto" />
          ) : (
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-base shadow-xs"
                style={{ backgroundColor: brandPrimary }}
              >
                {company.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                  {company.name}
                </div>
                <div className="text-[10.5px] font-medium text-slate-500">
                  {company.tagline || 'Tienda Oficial Online'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar (Customer Search) */}
        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={isTitufarisBrand ? "Buscar góndolas, estanterías, racks, lockers..." : `Buscar en catálogo de ${company.name}...`}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-300 focus:border-slate-500 rounded-xl outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Action Buttons: Download PDF Catalog, WhatsApp Catalog & Customer Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* WhatsApp Catalog Link Button */}
          {company.showWhatsAppCatalogButton !== false && (
            <a
              href={getWhatsAppBusinessCatalogUrl(company)}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title={`Abrir Catálogo de ${company.name} directamente en WhatsApp Business`}
            >
              <MessageCircle className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              <span>Catálogo en WhatsApp</span>
            </a>
          )}

          {/* PDF Catalog Button */}
          <button
            onClick={onOpenCatalogPDF}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-white text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Descargar Catálogo Oficial con Fotos y Especificaciones"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Catálogo PDF</span>
          </button>

          {/* Customer Cart Button */}
          <button
            onClick={onOpenCart}
            style={{ backgroundColor: brandPrimary }}
            className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:opacity-90"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Mi Pedido</span>
            {cartCount > 0 ? (
              <span
                className="bg-white px-1.5 py-0.5 rounded-full font-black text-[10px]"
                style={{ color: brandPrimary }}
              >
                {cartCount}
              </span>
            ) : null}
            {cartTotal > 0 && (
              <span className="font-extrabold hidden md:inline border-l border-white/40 pl-2">
                {formatCurrency(cartTotal)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search input */}
      <div className="px-4 py-2.5 border-t border-slate-100 md:hidden bg-slate-50">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Buscar góndolas, racks, estanterías, lockers..."
            className="w-full pl-10 pr-9 py-2 text-base sm:text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-orange-500 shadow-2xs placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              title="Borrar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
