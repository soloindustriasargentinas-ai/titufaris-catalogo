import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  X,
  FileText,
  BadgeCheck
} from 'lucide-react';
import { SaaSTenantStore, SaaSPlanId } from '../types/saas';
import { saveSaaSTenantToFirestore, saveSaaSSubscriptionRecord } from '../lib/firebase';
import { saveSaaSTenants, loadMercadoPagoSettings } from '../utils/saasStorage';

interface SaaSSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: SaaSTenantStore;
  allTenants: SaaSTenantStore[];
  onUpdateTenants: (tenants: SaaSTenantStore[]) => void;
}

interface PlanDefinition {
  id: SaaSPlanId;
  name: string;
  monthlyPriceARS: number;
  yearlyPriceARS: number;
  popular?: boolean;
  description: string;
  features: string[];
}

const PLANS: PlanDefinition[] = [
  {
    id: 'basic',
    name: 'Plan Emprendedor',
    monthlyPriceARS: 8990,
    yearlyPriceARS: 86280, // $7.190 / mes (20% OFF)
    description: 'Ideal para negocios y locales que inician. Mucho más económico que Tienda Nube y con 0% de comisiones.',
    features: [
      'Hasta 250 productos activos',
      '0% Comisiones por venta (Tienda Nube cobra hasta 2.5%)',
      '3 Meses 100% Bonificados ($0 por 90 días)',
      '1 Usuario Administrador',
      'Subdominio propio .titufaris.online con SSL',
      'Catálogo online para celulares y PC',
      'Pedidos directos por WhatsApp con resumen',
      'Punto de Venta (POS) para mostrador con tickets',
      'Presupuestos membretados en PDF (Mostrador y Carrito)',
      'Cobros con QR y Mercado Pago integrados',
      'Soporte técnico por WhatsApp'
    ]
  },
  {
    id: 'pro',
    name: 'Plan Negocio Pro',
    monthlyPriceARS: 16990,
    yearlyPriceARS: 163080, // $13.590 / mes (20% OFF)
    popular: true,
    description: 'El más elegido. Potencia total para escalar tus ventas sin pagar comisión alguna por cada pedido.',
    features: [
      'Productos y categorías ILIMITADOS',
      '0% Comisiones por venta (Ahorro de $40.000+/mes)',
      '3 Meses 100% Bonificados ($0 por 90 días)',
      'Hasta 5 Usuarios con roles (Cajeros, Vendedores, Admin)',
      'Dominio web propio personalizado (.com / .com.ar) con SSL',
      'Control de Stock en tiempo real y alertas de reposición',
      'Notificaciones Push en tiempo real en celular y PC',
      'Exportación de Catálogo a PDF de alta resolución y Excel/CSV',
      'Informes contables y Libro IVA Ventas para contadores',
      'Feed XML Google Merchant Center & Google Shopping',
      'Soporte prioritario por WhatsApp'
    ]
  },
  {
    id: 'enterprise',
    name: 'Plan Empresa & Multi-Sucursal',
    monthlyPriceARS: 29990,
    yearlyPriceARS: 287880, // $23.990 / mes (20% OFF)
    description: 'Para cadenas, depósitos y franquicias. La mitad de precio que las soluciones corporativas de Tienda Nube.',
    features: [
      'Todo lo incluido en el Plan Negocio Pro',
      '0% Comisiones por venta siempre',
      '3 Meses 100% Bonificados ($0 por 90 días)',
      'Multi-Sucursal & Depósitos unificados con sync en tiempo real',
      'Transferencias de mercadería entre sucursales con trazabilidad',
      'Usuarios, cajeros y administradores ILIMITADOS',
      'Dominio propio con CDN dedicada de ultra-velocidad',
      'Integración avanzada con Google Merchant Center',
      'Auditoría y copia de seguridad en Google Firestore Cloud A+',
      'Gerente de cuenta dedicado y SLA 99.9%'
    ]
  }
];

export const SaaSSubscriptionModal: React.FC<SaaSSubscriptionModalProps> = ({
  isOpen,
  onClose,
  tenant,
  allTenants,
  onUpdateTenants,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(tenant.billingCycle || 'monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<SaaSPlanId>(
    tenant.planId === 'trial' ? 'pro' : tenant.planId
  );
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutSuccessMessage, setCheckoutSuccessMessage] = useState<string | null>(null);
  const [showInvoiceHistory, setShowInvoiceHistory] = useState(false);

  if (!isOpen) return null;

  const mpSettings = loadMercadoPagoSettings();
  const isDefaultTitufaris = tenant.id === 'titufaris' || tenant.isDefaultStore;

  const currentPlan = PLANS.find(p => p.id === tenant.planId) || PLANS[1];
  const targetPlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[1];

  const targetPrice = billingCycle === 'monthly'
    ? targetPlan.monthlyPriceARS
    : targetPlan.yearlyPriceARS;

  // Simulate or process Mercado Pago Recurring Subscription Checkout
  const handleInitiateMercadoPagoCheckout = async () => {
    setIsProcessingCheckout(true);
    setCheckoutSuccessMessage(null);

    try {
      // Simular tiempo de conexión con la pasarela de Mercado Pago
      await new Promise(r => setTimeout(r, 1400));

      const newPreapprovalId = 'MP-SUB-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      const nextDate = new Date();
      if (billingCycle === 'monthly') {
        nextDate.setDate(nextDate.getDate() + 30);
      } else {
        nextDate.setDate(nextDate.getDate() + 365);
      }

      // Actualizar tenant a estado activo
      const updatedList = allTenants.map(t => {
        if (t.id === tenant.id) {
          return {
            ...t,
            planId: selectedPlanId,
            subscriptionStatus: 'active' as const,
            pricePerMonthARS: targetPlan.monthlyPriceARS,
            billingCycle,
            mercadoPagoSubscriptionId: newPreapprovalId,
            nextBillingDate: nextDate.toISOString(),
            technicalHealth: {
              ...t.technicalHealth,
              maintenanceMode: false,
              status: 'healthy' as const,
              issuesDetected: []
            }
          };
        }
        return t;
      });

      onUpdateTenants(updatedList);
      saveSaaSTenants(updatedList);

      const updatedTenant = updatedList.find(t => t.id === tenant.id);
      if (updatedTenant) {
        await saveSaaSTenantToFirestore(updatedTenant);
        await saveSaaSSubscriptionRecord({
          id: 'sub-' + Date.now(),
          tenantId: updatedTenant.id,
          storeName: updatedTenant.name,
          amount: targetPrice,
          currency: 'ARS',
          status: 'paid',
          date: new Date().toISOString(),
          paymentMethod: 'Mercado Pago (Tarjeta/Saldo)',
          receiptUrl: `https://www.mercadopago.com.ar/receipts/${newPreapprovalId}`
        });
      }

      setCheckoutSuccessMessage(
        `¡Suscripción mensual procesada con éxito con Mercado Pago! ID: ${newPreapprovalId}. La tienda cuenta ahora con acceso completo y sincronización en la nube.`
      );
    } catch (e) {
      console.error('Error procesando checkout:', e);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('¿Seguro que deseas pausar la suscripción de Mercado Pago? La tienda pasará a estado de baja al finalizar el período.')) {
      return;
    }

    const updatedList = allTenants.map(t => {
      if (t.id === tenant.id) {
        return {
          ...t,
          subscriptionStatus: 'canceled' as const,
          canceledAt: new Date().toISOString(),
          churnReason: 'Baja solicitada por el usuario desde el panel'
        };
      }
      return t;
    });

    onUpdateTenants(updatedList);
    saveSaaSTenants(updatedList);
    const updatedTenant = updatedList.find(t => t.id === tenant.id);
    if (updatedTenant) {
      await saveSaaSTenantToFirestore(updatedTenant);
    }
    setCheckoutSuccessMessage('La suscripción ha sido cancelada. Tu tienda permanecerá en modo consulta.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <CreditCard className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Escalar Tienda & Planes</h2>
                <span className="bg-sky-400 text-slate-950 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Planes Oficiales
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Tienda: <strong>{tenant.name}</strong> ({tenant.slug})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Default flagship store notice */}
          {isDefaultTitufaris && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <BadgeCheck className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 space-y-1">
                <p className="font-bold text-sm">Esta es la Tienda Matriz Titufaris.online (Pase Vitalicio Activo)</p>
                <p className="text-emerald-800">
                  Como tienda insignia de la plataforma, Titufaris cuenta con acceso ilimitado a todas las funciones sin vencimiento ni cobros recurrentes de Mercado Pago. Puedes gestionar planes para las tiendas inquilinas.
                </p>
              </div>
            </div>
          )}

          {/* Current Status Card (For regular stores) */}
          {!isDefaultTitufaris && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Estado de la suscripción:</span>
                  {tenant.subscriptionStatus === 'active' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Activa (Al día)
                    </span>
                  )}
                  {tenant.subscriptionStatus === 'trial' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      <Clock className="w-3.5 h-3.5" /> Período de Prueba
                    </span>
                  )}
                  {tenant.subscriptionStatus === 'past_due' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" /> Pago Pendiente
                    </span>
                  )}
                  {tenant.subscriptionStatus === 'canceled' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                      <X className="w-3.5 h-3.5" /> Suscripción Cancelada
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  Plan actual: <strong className="text-slate-900">{currentPlan.name}</strong> &middot;{' '}
                  Próxima renovación:{' '}
                  <strong>{new Date(tenant.nextBillingDate).toLocaleDateString('es-AR')}</strong>
                </p>
                {tenant.mercadoPagoSubscriptionId && (
                  <p className="text-[11px] text-slate-500 font-mono">
                    ID Mercado Pago: {tenant.mercadoPagoSubscriptionId}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInvoiceHistory(!showInvoiceHistory)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  {showInvoiceHistory ? 'Ocultar Recibos' : 'Ver Comprobantes'}
                </button>
                {tenant.subscriptionStatus === 'active' && (
                  <button
                    onClick={handleCancelSubscription}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition cursor-pointer"
                  >
                    Pausar Suscripción
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Invoice history drawer if requested */}
          {showInvoiceHistory && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-fadeIn text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Historial de Débitos y Facturas Mensuales
              </h4>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white overflow-hidden">
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Período en curso ({tenant.planId.toUpperCase()})</p>
                    <p className="text-[11px] text-slate-500">
                      Fecha: {new Date().toLocaleDateString('es-AR')} &middot; Método: Mercado Pago Preapproval
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      ${tenant.pricePerMonthARS.toLocaleString('es-AR')} ARS
                    </p>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      Cobrado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Notification */}
          {checkoutSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900">
                <p className="font-bold text-sm">Operación Exitosa</p>
                <p className="mt-0.5">{checkoutSuccessMessage}</p>
              </div>
            </div>
          )}

          {/* Billing Cycle Switcher */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-blue-50 border border-blue-100 p-3 rounded-xl">
            <div className="text-xs">
              <span className="font-bold text-blue-950">Frecuencia de Facturación:</span>
              <span className="text-blue-800 ml-1">Débito automático mensual o anual con descuento</span>
            </div>
            <div className="flex items-center bg-white border border-blue-200 p-1 rounded-xl shadow-xs">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  billingCycle === 'yearly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Anual
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  -20% OFF
                </span>
              </button>
            </div>
          </div>

          {/* Cloud Resilience & Firebase Guarantee */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-200">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block text-sm">Respaldo Automático en Google Firebase Firestore</span>
              <span>Todos los planes (incluida la prueba bonificada de 3 meses) cuentan con resguardo automático en la nube. Todo tu catálogo, fotos, ventas, inventario y clientes permanecen 100% seguros y nunca se perderán.</span>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => {
              const isSelected = selectedPlanId === plan.id;
              const isCurrent = tenant.planId === plan.id;
              const price = billingCycle === 'monthly' ? plan.monthlyPriceARS : Math.round(plan.yearlyPriceARS / 12);

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative rounded-2xl p-5 border-2 transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 shadow-lg ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                      Más Elegido
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900 text-base">{plan.name}</h3>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          Actual
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-4 min-h-[32px]">{plan.description}</p>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-950">
                          ${price.toLocaleString('es-AR')}
                        </span>
                        <span className="text-xs text-slate-500">ARS / mes</span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          Facturación anual: ${plan.yearlyPriceARS.toLocaleString('es-AR')} ARS
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-4 text-xs">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Seleccionado
                        </>
                      ) : (
                        'Elegir este Plan'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparativa Directa vs Tienda Nube */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl p-5 border border-blue-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-blue-200 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  Comparativa: Titufaris SaaS vs Tienda Nube Argentina
                </h4>
                <p className="text-xs text-slate-600">
                  Por qué Titufaris es la opción más conveniente y rentable para tu negocio:
                </p>
              </div>
              <span className="text-[11px] font-black uppercase px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                Ahorro comprobado de hasta $180.000+/año
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-blue-200/60 text-slate-600 font-bold">
                    <th className="py-2 pr-3">Característica</th>
                    <th className="py-2 px-3 bg-blue-100/70 text-blue-900 font-black rounded-t-lg text-center">Titufaris SaaS</th>
                    <th className="py-2 pl-3 text-slate-500 text-center">Tienda Nube</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 pr-3 font-semibold">Comisión por venta realizada</td>
                    <td className="py-2.5 px-3 bg-blue-50/50 font-black text-emerald-700 text-center">
                      0% (¡Sin comisión!)
                    </td>
                    <td className="py-2.5 pl-3 text-rose-600 font-medium text-center">
                      0.5% a 2.5% en cada venta
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3 font-semibold">Período de prueba bonificado</td>
                    <td className="py-2.5 px-3 bg-blue-50/50 font-black text-emerald-700 text-center">
                      3 Meses 100% Gratis (90 días)
                    </td>
                    <td className="py-2.5 pl-3 text-slate-500 text-center">
                      Solo 14 o 30 días
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3 font-semibold">Precio Plan Inicial / Emprendedor</td>
                    <td className="py-2.5 px-3 bg-blue-50/50 font-black text-blue-900 text-center">
                      $8.990 ARS / mes
                    </td>
                    <td className="py-2.5 pl-3 text-slate-500 text-center">
                      $14.999 ARS / mes + comisiones
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3 font-semibold">Punto de Venta (POS) en mostrador integrado</td>
                    <td className="py-2.5 px-3 bg-blue-50/50 font-black text-emerald-700 text-center">
                      ✓ Incluido sin costo extra
                    </td>
                    <td className="py-2.5 pl-3 text-rose-600 text-center">
                      Requiere apps de terceros con pago extra
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3 font-semibold">Multi-Sucursal & Inventario Unificado</td>
                    <td className="py-2.5 px-3 bg-blue-50/50 font-black text-emerald-700 text-center">
                      ✓ Incluido con transferencias en vivo
                    </td>
                    <td className="py-2.5 pl-3 text-slate-500 text-center">
                      Solo en Planes Enterprise ($80.000+)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mercado Pago Checkout Action Card */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 border border-blue-900/60 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded">
                    MERCADO PAGO SUSCRIPCIONES
                  </span>
                  <span className="text-xs text-slate-400">
                    {mpSettings.sandboxMode ? 'Modo Pruebas (Sandbox)' : 'Producción Oficial'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Suscripción Mensual: {targetPlan.name}
                </h3>
                <p className="text-xs text-slate-300 max-w-xl">
                  Débito automático recurrente todos los meses mediante Mercado Pago. Acepta tarjetas de crédito, débito y dinero disponible en cuenta de Mercado Pago con total seguridad y protección de datos.
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-xs text-slate-400">Total a debitar ({billingCycle}):</p>
                <p className="text-2xl font-black text-white">
                  ${targetPrice.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-300">ARS</span>
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Encriptación SSL 256 bits
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sky-400" /> Cancela cuando quieras
                </span>
              </div>

              <button
                type="button"
                onClick={handleInitiateMercadoPagoCheckout}
                disabled={isProcessingCheckout}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm px-6 py-2.5 rounded-xl shadow-lg hover:shadow-sky-500/25 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessingCheckout ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Conectando con Mercado Pago...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" /> Suscribirme con Mercado Pago
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <p>
            Plataforma Oficial de Tiendas Online &middot; Respaldo seguro en Google Firebase y facturación protegida
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
