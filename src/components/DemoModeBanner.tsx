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

Luego de los 3 meses gratis, podés continuar con planes accesibles desde $8.990 ARS/mes con débito automático en Mercado Pago y 0% de comisiones por venta.`;

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
      <div className="bg-slate-950 text-white text-xs px-4 py-2.5 border-b border-slate-800/80 shadow-sm relative z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 font-medium">
              <Store className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <span className="font-semibold text-white tracking-tight text-xs sm:text-sm">
                Plataforma de Tiendas Online & Terminal POS
              </span>
              <span className="text-slate-500 hidden sm:inline" aria-hidden="true">&middot;</span>
              <span className="text-emerald-400 font-medium text-xs">
                3 Meses Bonificados sin tarjeta
              </span>
              <span className="text-slate-500 hidden md:inline" aria-hidden="true">&middot;</span>
              <span className="text-slate-400 text-xs hidden md:inline">
                Subdominio Cloudflare SSL, catálogo y ventas por WhatsApp
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsOfferModalOpen(true)}
              className="text-xs text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              Ver Planes
            </button>

            {onOpenCreateStore && (
              <button
                onClick={onOpenCreateStore}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs transition cursor-pointer whitespace-nowrap shadow-xs"
              >
                Crear Mi Tienda
              </button>
            )}

            <button
              onClick={handleCopyLink}
              title="Copiar enlace oficial de tiendas.titufaris.online"
              className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer hidden lg:flex items-center gap-1 text-[11px]"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copiado' : 'Compartir'}</span>
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
                {/* Emprendedor */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500">Comercios Iniciales</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">Plan Emprendedor</h4>
                    <p className="text-lg font-black text-slate-900 my-2">$8.990 <span className="text-[11px] font-normal text-slate-500">ARS/mes</span></p>
                    <ul className="space-y-1.5 text-slate-600 text-[11px]">
                      <li>&bull; <strong>Hasta 250 productos</strong></li>
                      <li>&bull; <strong>0% comisiones por venta</strong></li>
                      <li>&bull; Subdominio .titufaris.online</li>
                      <li>&bull; Catálogo digital & Carrito WhatsApp</li>
                      <li>&bull; Punto de Venta (POS) con tickets</li>
                      <li>&bull; Respaldo diario en Google Firestore</li>
                    </ul>
                  </div>
                </div>

                {/* Negocio Pro */}
                <div className="p-4 rounded-2xl border-2 border-indigo-600 bg-indigo-50/50 flex flex-col justify-between relative shadow-sm">
                  <span className="absolute -top-2.5 right-3 bg-indigo-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                    Más Elegido
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-700">En Crecimiento</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">Plan Negocio Pro</h4>
                    <p className="text-lg font-black text-slate-900 my-2">$16.990 <span className="text-[11px] font-normal text-slate-500">ARS/mes</span></p>
                    <ul className="space-y-1.5 text-slate-600 text-[11px]">
                      <li>&bull; <strong>Productos Ilimitados</strong></li>
                      <li>&bull; <strong>0% comisiones por venta</strong></li>
                      <li>&bull; Dominio web propio (.com / .com.ar)</li>
                      <li>&bull; Hasta 5 empleados con roles</li>
                      <li>&bull; Presupuestos PDF con membrete</li>
                      <li>&bull; Feed Google Shopping XML</li>
                    </ul>
                  </div>
                </div>

                {/* Empresa & Multi-Sucursal */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-purple-700">Marcas & Cadenas</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">Plan Empresa</h4>
                    <p className="text-lg font-black text-slate-900 my-2">$29.990 <span className="text-[11px] font-normal text-slate-500">ARS/mes</span></p>
                    <ul className="space-y-1.5 text-slate-600 text-[11px]">
                      <li>&bull; Todo lo del Plan Pro</li>
                      <li>&bull; <strong>0% comisiones siempre</strong></li>
                      <li>&bull; Multi-sucursal y depósitos en vivo</li>
                      <li>&bull; Usuarios y cajeros ILIMITADOS</li>
                      <li>&bull; Auditoría Google Firestore A+</li>
                      <li>&bull; Soporte 24/7 prioritario WhatsApp</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Free Trial Banner in Modal */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-black text-amber-300 text-sm block">¿Todavía no creaste tu tienda?</span>
                  <span className="text-slate-300 text-[11px]">Comenzá gratis por 90 días con hasta 250 productos y probá todo el potencial sin compromiso.</span>
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
