import React, { useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  Share2,
  X,
  Store,
  Layers,
  ShoppingBag,
  CreditCard,
  QrCode,
  ShieldCheck,
  Gift,
  Download
} from 'lucide-react';

interface DemoModeBannerProps {
  onExitDemo: () => void;
  onOpenCreateStore?: () => void;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ onExitDemo, onOpenCreateStore }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<'immediate' | 'custom'>('immediate');

  const getImmediateUrl = () => {
    try {
      const origin = window.location.origin;
      return `${origin}/?demo=generica`;
    } catch {
      return 'https://tiendas.titufaris.online';
    }
  };

  const getCustomDomainUrl = () => 'https://tiendas.titufaris.online';

  const demoUrl = linkTarget === 'immediate' ? getImmediateUrl() : getCustomDomainUrl();

  const salesPitchText = `👋 ¡Hola! Te invito a conocer nuestra plataforma de TIENDAS ONLINE & PUNTO DE VENTA (POS) en la nube:

🎁 ¡Creá tu propia tienda 100% GRATIS por 3 meses!
• Sin costos de apertura ni comisiones por ventas.
• No se requiere tarjeta de crédito ni débito para comenzar el período de prueba.
• Solo necesitas ingresar tus datos de contacto para tener tu catálogo y POS activo.

🔗 Probá la tienda demostrativa aquí:
${demoUrl}

✨ Funcionalidades incluidas:
• 📱 Catálogo digital para celulares y computadoras con fotos y fichas técnicas.
• 🛒 Carrito de compras con envío automático de cotizaciones por WhatsApp.
• 💳 Terminal POS para cobros en mostrador (efectivo, débito, transferencias y Mercado Pago).
• 🔒 Panel de gestión de inventario, precios y categorías.
• 📄 Generador de presupuestos en PDF con membrete oficial y códigos QR.
• 🌐 Dominio web oficial y sincronización 24/7 en la nube.

Luego de los 3 meses gratis, podés continuar con planes accesibles desde $25.000 ARS/mes con débito automático en Mercado Pago.`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(demoUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyPitch = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(salesPitchText);
      setCopiedPitch(true);
      setTimeout(() => setCopiedPitch(false), 2500);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 text-white text-xs sm:text-sm px-4 py-2.5 border-b border-indigo-500/40 shadow-lg relative z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-center md:text-left">
            <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-400 text-slate-950 shrink-0 font-black shadow-sm animate-pulse">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-amber-300 uppercase tracking-wide text-xs sm:text-sm">
                  TIENDAS.TITUFARIS.ONLINE
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/50 text-[10.5px] font-black text-emerald-200">
                  🎁 3 MESES DE PRUEBA GRATIS
                </span>
                <span className="hidden sm:inline-block text-[11px] text-indigo-300">
                  Sin tarjeta de crédito
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5">
                Tienda genérica modelo. Suscribite y creá tu tienda online con POS y pedidos por WhatsApp bonificada por 90 días.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap justify-center gap-2 shrink-0">
            {/* Create Free Store 3 Months Button */}
            {onOpenCreateStore && (
              <button
                onClick={onOpenCreateStore}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs shadow-md transition-all hover:scale-105 cursor-pointer ring-2 ring-emerald-300/40"
                title="Crear tienda gratis por 3 meses sin tarjeta"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>🚀 Crear Tienda Gratis (3 Meses)</span>
              </button>
            )}

            {/* Open Commercial Pitch & Share Modal */}
            <button
              onClick={() => setIsOfferModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
              title="Abrir enlaces y propuesta comercial de suscripción SaaS"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-950" />
              <span>📢 Planes & Oferta</span>
            </button>

            {/* Quick Copy Demo Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-400/30 text-xs font-semibold transition cursor-pointer"
              title="Copiar enlace de tiendas.titufaris.online"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>

            {/* Exit Demo and return to Titufaris */}
            <button
              onClick={onExitDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
              title="Volver al catálogo oficial de Titufaris"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
              <span>Volver a Titufaris</span>
            </button>
          </div>
        </div>
      </div>

      {/* Commercial Pitch & Share Modal */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-5 sm:p-6 rounded-t-3xl relative">
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    Kit de Venta & Oferta Comercial
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Comparte esta demo en vivo o envía la propuesta lista a comercios, empresas y clientes.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 text-slate-800">
              {/* Domain Selector Tabs */}
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-slate-600">
                  Elige qué enlace deseas compartir:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLinkTarget('immediate')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                      linkTarget === 'immediate'
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5 text-indigo-900">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Enlace Inmediato (Recomendado)
                      </span>
                      {linkTarget === 'immediate' && <Check className="w-3.5 h-3.5 text-indigo-600 font-black" />}
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Funciona ahora mismo sin necesidad de deployar nada a Coolify.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLinkTarget('custom')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                      linkTarget === 'custom'
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5 text-indigo-900">
                        🌐 Enlace en tu Dominio
                      </span>
                      {linkTarget === 'custom' && <Check className="w-3.5 h-3.5 text-indigo-600 font-black" />}
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      titufaris.online/?demo=generica (Para cuando hagas el deploy en Coolify).
                    </span>
                  </button>
                </div>
              </div>

              {/* Share URL Section */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>Enlace seleccionado:</span>
                  <span className="text-[11px] font-normal text-indigo-600">Abre la tienda genérica automáticamente</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={demoUrl}
                    className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-800 select-all outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Link</span>
                      </>
                    )}
                  </button>
                  <a
                    href={demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition cursor-pointer shrink-0"
                    title="Abrir en pestaña nueva"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Ready-to-send WhatsApp Pitch Message */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                    Mensaje comercial redactado para WhatsApp / Redes:
                  </label>
                  <button
                    onClick={handleCopyPitch}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPitch ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">¡Texto copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar texto completo</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-sans whitespace-pre-line text-slate-700 leading-relaxed max-h-48 overflow-y-auto">
                  {salesPitchText}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(salesPitchText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Compartir directamente por WhatsApp</span>
                  </a>
                  <button
                    onClick={handleCopyPitch}
                    className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer shrink-0"
                  >
                    {copiedPitch ? '¡Copiado!' : 'Copiar Propuesta'}
                  </button>
                </div>
              </div>

              {/* Feature Highlights Summary */}
              <div className="pt-2 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-800 mb-3">
                  Puntos fuertes para destacar al cliente:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <ShoppingBag className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span><strong>Sin comisiones por venta:</strong> el cliente es dueño del 100% de su facturación.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Punto de Venta POS:</strong> cobra en salón y sincroniza con la tienda online.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <QrCode className="w-4 h-4 text-orange-600 shrink-0" />
                    <span><strong>Catálogo PDF con QR:</strong> cada artículo tiene enlace directo escaneable.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                    <span><strong>Offline-First:</strong> sigue registrando ventas aun si se corta internet.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 rounded-b-3xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>3 meses gratis de prueba. No se requiere tarjeta para comenzar.</span>
              </div>

              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
