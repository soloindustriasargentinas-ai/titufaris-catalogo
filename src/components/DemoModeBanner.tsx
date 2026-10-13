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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white text-xs sm:text-sm px-4 py-3 border-b border-indigo-500/30 shadow-xl relative z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-300 text-slate-950 shrink-0 font-black shadow-md">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                <span className="font-black text-white text-sm sm:text-base tracking-tight">
                  Lanzá tu Propia Tienda Online
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10.5px] font-black uppercase tracking-wider shadow-xs">
                  3 Meses 100% Gratis
                </span>
                <span className="text-[11px] text-indigo-200 hidden sm:inline">
                  (Sin tarjeta de crédito &middot; Hasta 50 productos con acceso total)
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5 leading-snug">
                Subdominio propio seguro con SSL, catálogo digital, pedidos por WhatsApp, terminal POS de cobro y resguardo en la nube.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap justify-center gap-2 shrink-0">
            {/* Create Free Store 3 Months Button */}
            {onOpenCreateStore && (
              <button
                onClick={onOpenCreateStore}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg transition-all hover:scale-105 cursor-pointer ring-2 ring-emerald-300/40"
                title="Crear mi tienda online gratis por 3 meses"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>Crear Mi Tienda (3 Meses Gratis)</span>
              </button>
            )}

            {/* Escalar Tienda */}
            <button
              onClick={() => setIsOfferModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-800/80 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer border border-indigo-500/40"
              title="Conocer planes para escalar tu negocio"
            >
              <CreditCard className="w-3.5 h-3.5 text-sky-300" />
              <span>Escalar Tienda</span>
            </button>
          </div>
        </div>
      </div>

      {/* Escalar Tienda Modal */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-5 sm:p-6 rounded-t-3xl relative">
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-md">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    Escalar Tienda & Planes
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Comenzá con 3 meses gratis (hasta 50 productos) y escalá cuando tu negocio crezca.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 text-slate-800">
              {/* Guarantee Pill */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900">
                  <span className="font-bold block text-sm">Respaldo Automático en Google Firestore</span>
                  <span>Todos los planes (incluida la prueba gratuita) guardan tu catálogo, inventario, ventas y clientes en la nube. Nunca perderás tus datos ni configuración.</span>
                </div>
              </div>

              {/* Plans Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Básico */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500">Comercios Iniciales</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">Plan Básico</h4>
                    <p className="text-lg font-black text-slate-900 my-2">$25.000 <span className="text-[11px] font-normal text-slate-500">ARS/mes</span></p>
                    <ul className="space-y-1.5 text-slate-600 text-[11px]">
                      <li>&bull; <strong>Hasta 150 productos</strong></li>
                      <li>&bull; Subdominio .titufaris.online</li>
                      <li>&bull; Catálogo digital & Carrito</li>
                      <li>&bull; Pedidos directos a WhatsApp</li>
                      <li>&bull; Cobros en mostrador (POS)</li>
                      <li>&bull; Respaldo diario en Firestore</li>
                    </ul>
                  </div>
                </div>

                {/* Pro */}
                <div className="p-4 rounded-2xl border-2 border-indigo-600 bg-indigo-50/50 flex flex-col justify-between relative shadow-sm">
                  <span className="absolute -top-2.5 right-3 bg-indigo-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                    Más Elegido
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-700">En Crecimiento</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">Plan Profesional Pro</h4>
                    <p className="text-lg font-black text-slate-900 my-2">$45.000 <span className="text-[11px] font-normal text-slate-500">ARS/mes</span></p>
                    <ul className="space-y-1.5 text-slate-600 text-[11px]">
                      <li>&bull; <strong>Productos Ilimitados</strong></li>
                      <li>&bull; Control de stock multi-caja</li>
                      <li>&bull; Múltiples roles de empleados</li>
                      <li>&bull; Presupuestos PDF con membrete</li>
                      <li>&bull; Pasarela Mercado Pago en vivo</li>
                      <li>&bull; Sincronización instantánea Cloud</li>
                    </ul>
                  </div>
                </div>

                {/* Enterprise */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-purple-700">Marcas & Cadenas</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">Plan Enterprise</h4>
                    <p className="text-lg font-black text-slate-900 my-2">$85.000 <span className="text-[11px] font-normal text-slate-500">ARS/mes</span></p>
                    <ul className="space-y-1.5 text-slate-600 text-[11px]">
                      <li>&bull; Todo lo del Plan Pro</li>
                      <li>&bull; <strong>Dominio Propio (ej: mitienda.com)</strong></li>
                      <li>&bull; Multi-sucursal y depósitos</li>
                      <li>&bull; Google Shopping XML Feed</li>
                      <li>&bull; Soporte 24/7 prioritario</li>
                      <li>&bull; Auditoría de datos A+</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Free Trial Banner in Modal */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-black text-amber-300 text-sm block">¿Todavía no creaste tu tienda?</span>
                  <span className="text-slate-300 text-[11px]">Comenzá gratis por 90 días con hasta 50 productos y probá todo el potencial sin compromiso.</span>
                </div>
                {onOpenCreateStore && (
                  <button
                    onClick={() => {
                      setIsOfferModalOpen(false);
                      onOpenCreateStore();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 transition cursor-pointer shadow-md"
                  >
                    Crear mi Tienda Gratis
                  </button>
                )}
              </div>

              {/* Feature Highlights Summary */}
              <div className="pt-2 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-800 mb-3">
                  Puntos fuertes incluidos en todos los planes:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <ShoppingBag className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span><strong>0% Comisiones por venta:</strong> el comerciante conserva el 100% de su facturación.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Punto de Venta POS:</strong> cobra en mostrador físico y sincroniza con la tienda online.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <QrCode className="w-4 h-4 text-orange-600 shrink-0" />
                    <span><strong>Catálogo PDF con QR:</strong> cada artículo tiene enlace directo escaneable y descriptivo.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                    <span><strong>Offline-First:</strong> sigue registrando ventas y tickets aun si se corta internet.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 rounded-b-3xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>3 meses gratis de prueba para 50 productos. Sin tarjeta de crédito requerida.</span>
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
