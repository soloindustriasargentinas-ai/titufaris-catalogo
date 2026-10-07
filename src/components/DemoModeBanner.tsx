import React, { useState } from 'react';
import {
  Download,
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  Share2,
  X,
  MessageCircle,
  ExternalLink,
  Store,
  Layers,
  ShoppingBag,
  CreditCard,
  QrCode
} from 'lucide-react';

interface DemoModeBannerProps {
  onExitDemo: () => void;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ onExitDemo }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<'immediate' | 'custom'>('immediate');

  const getImmediateUrl = () => {
    try {
      const origin = window.location.origin;
      return `${origin}/?demo=generica`;
    } catch {
      return 'https://ais-pre-ubpus5y27jwtduyfizubux-418899072866.us-east1.run.app/?demo=generica';
    }
  };

  const getCustomDomainUrl = () => 'https://titufaris.online/?demo=generica';

  const demoUrl = linkTarget === 'immediate' ? getImmediateUrl() : getCustomDomainUrl();

  const salesPitchText = `👋 ¡Hola! Te comparto una demostración en vivo de nuestro sistema de TIENDA ONLINE, CATÁLOGO DIGITAL & PUNTO DE VENTA (POS) para tu negocio:

🔗 Prueba la demo interactiva aquí:
${demoUrl}

✨ ¿Qué incluye este sistema listo para operar con tu marca?
• 📱 Catálogo digital interactivo con fotos, fichas técnicas y precios mayorista/minorista.
• 🛒 Carrito de compras con envío automático de pedidos directo a tu WhatsApp.
• 💳 Terminal Punto de Venta (POS) para cobrar en mostrador (efectivo, débito, transferencias y Mercado Pago).
• 🔒 Panel de administración protegido con PIN para control de stock y actualización masiva de precios.
• 📄 Exportador de catálogo imprimible en PDF con Códigos QR directos por cada artículo.
• ⚡ 100% instalable en tu propio dominio web, sin mensualidades obligatorias ni comisiones por venta.

¿Te gustaría coordinar una breve llamada para mostrártelo y cotizarlo para tu empresa?`;

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
            <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400 text-slate-950 shrink-0 font-black shadow-sm animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-amber-300 uppercase tracking-wide text-xs sm:text-sm">
                  MODO DEMOSTRACIÓN:
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-[10px] font-bold text-indigo-200">
                  MARCA BLANCA
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5">
                Catálogo genérico multirubro (12 artículos, carrito WhatsApp y POS) sin afectar tu base de datos de Titufaris.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap justify-center gap-2 shrink-0">
            {/* Open Commercial Pitch & Share Modal */}
            <button
              onClick={() => setIsOfferModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
              title="Abrir enlaces y propuesta comercial redactada para ofertar a clientes"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-950" />
              <span>📢 Ofertar a Clientes</span>
            </button>

            {/* Quick Copy Demo Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-400/30 text-xs font-semibold transition cursor-pointer"
              title="Copiar enlace directo de la demo genérica"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">¡Enlace copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>

            {/* Download Clean ZIP Source Code */}
            <a
              href="/tienda-generica.zip"
              download="tienda-generica.zip"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              title="Descargar paquete completo ZIP listo para instalar en cualquier cliente"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar ZIP</span>
            </a>

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
              <a
                href="/tienda-generica.zip"
                download="tienda-generica.zip"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Código Fuente ZIP</span>
              </a>

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
