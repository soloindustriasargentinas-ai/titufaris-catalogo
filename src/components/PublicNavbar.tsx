import React, { useState } from 'react';
import { ShoppingBag, Search, FileText, Lock, MessageCircle, Share2, Check, X } from 'lucide-react';
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
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareStore = () => {
    const url = getPublicStoreBaseUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Notification Announcement Bar */}
      <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="bg-orange-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded tracking-wider uppercase">
              Fábrica Directa
            </span>
            <span className="text-slate-300 hidden sm:inline">
              Venta Mayorista (a partir de 10 unidades) y Minorista con asesoramiento de fábrica.
            </span>
            <span className="text-slate-300 sm:hidden">
              Venta Mayorista (10+ u.) y Minorista Titufaris
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-slate-300">
            <div className="flex items-center gap-1.5">
              <a
                href={`https://wa.me/${company.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  'Hola Titufaris! Quisiera hacer una consulta comercial sobre equipamiento comercial.'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                title="Hacer clic para enviar mensaje directo por WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-white">{company.phone}</span>
              </a>
            </div>

            {/* Share Public Store Link */}
            <button
              onClick={handleShareStore}
              title="Copiar enlace público de la tienda para enviar a clientes por WhatsApp o redes"
              className="hover:text-white flex items-center gap-1 text-slate-300 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">¡Enlace copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3 h-3 text-orange-400" />
                  <span className="hidden sm:inline">Compartir Tienda</span>
                  <span className="sm:hidden">Compartir</span>
                </>
              )}
            </button>

            <span className="text-slate-700 hidden md:inline">|</span>

            {/* Staff Access Link in Top Bar */}
            <button
              onClick={onSwitchToStaffMode}
              title="Acceso restringido para personal de ventas, depósito y administración"
              className="hover:text-white flex items-center gap-1 text-slate-400 transition-colors cursor-pointer"
            >
              <Lock className="w-3 h-3 text-orange-400" />
              <span>Acceso Personal / POS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Public Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer shrink-0">
          <TitufarisLogo className="h-9 sm:h-11 w-auto" />
        </div>

        {/* Search Bar (Customer Search) */}
        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Buscar góndolas, heladeras, checkouts, balanzas o accesorios..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-300 focus:border-orange-500 rounded-xl outline-none transition-all placeholder:text-slate-400"
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
              title="Abrir Catálogo de Titufaris directamente en WhatsApp Business"
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
            <FileText className="w-4 h-4 text-orange-600" />
            <span>Catálogo PDF</span>
          </button>

          {/* Customer Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-md shadow-orange-600/25 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Mi Pedido</span>
            {cartCount > 0 ? (
              <span className="bg-white text-orange-600 px-1.5 py-0.5 rounded-full font-black text-[10px]">
                {cartCount}
              </span>
            ) : null}
            {cartTotal > 0 && (
              <span className="font-extrabold hidden md:inline border-l border-orange-500/80 pl-2">
                {formatCurrency(cartTotal)}
              </span>
            )}
          </button>

          {/* Mobile Staff Mode Toggle */}
          <button
            onClick={onSwitchToStaffMode}
            title="Ingreso a Terminal POS y Administración"
            className="sm:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            <Lock className="w-4 h-4 text-orange-600" />
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
