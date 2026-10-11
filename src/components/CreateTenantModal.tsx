import React, { useState } from 'react';
import {
  Store,
  Sparkles,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  CreditCard,
  X,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { SaaSTenantStore, SaaSPlanId } from '../types/saas';
import { saveSaaSTenantToFirestore } from '../lib/firebase';
import { saveSaaSTenants } from '../utils/saasStorage';

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: SaaSTenantStore[];
  onTenantCreated: (newTenant: SaaSTenantStore) => void;
}

export const CreateTenantModal: React.FC<CreateTenantModalProps> = ({
  isOpen,
  onClose,
  tenants,
  onTenantCreated,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [categoryPreset, setCategoryPreset] = useState<'gastronomia' | 'indumentaria' | 'tecnologia' | 'ferreteria'>('gastronomia');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('+54 9 11 ');
  const [selectedPlan, setSelectedPlan] = useState<SaaSPlanId>('pro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTenant, setCreatedTenant] = useState<SaaSTenantStore | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (name: string) => {
    setStoreName(name);
    // Auto generate clean slug
    const cleanSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setStoreSlug(cleanSlug);
  };

  const handleCreateStore = async () => {
    if (!storeName.trim() || !storeSlug.trim() || !ownerEmail.trim()) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    // Check slug collision
    const existing = tenants.find(t => t.slug === storeSlug || t.id === storeSlug);
    if (existing) {
      alert('Este identificador / slug de tienda ya se encuentra en uso. Por favor elige otro.');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + 14);

      const nextBilling = new Date();
      nextBilling.setDate(nextBilling.getDate() + 30);

      const priceMap: Record<SaaSPlanId, number> = {
        trial: 0,
        basic: 25000,
        pro: 45000,
        enterprise: 85000
      };

      const newTenant: SaaSTenantStore = {
        id: storeSlug,
        name: storeName.trim(),
        slug: storeSlug,
        isDefaultStore: false,
        ownerName: ownerName.trim() || 'Propietario de ' + storeName,
        ownerEmail: ownerEmail.trim(),
        ownerPhone: ownerPhone.trim(),
        planId: selectedPlan,
        subscriptionStatus: selectedPlan === 'trial' ? 'trial' : 'active',
        pricePerMonthARS: priceMap[selectedPlan],
        billingCycle: 'monthly',
        mercadoPagoSubscriptionId: 'MP-SUB-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        createdAt: now.toISOString(),
        trialEndsAt: trialEnds.toISOString(),
        nextBillingDate: nextBilling.toISOString(),
        technicalHealth: {
          status: 'healthy',
          productsCount: 12,
          categoriesCount: 4,
          salesCount: 0,
          lastSyncAt: now.toISOString(),
          storageKB: 45,
          maintenanceMode: false,
          issuesDetected: [],
          lastDiagnosticAt: now.toISOString()
        },
        notes: `Tienda creada en onboarding. Rubro seleccionado: ${categoryPreset}.`
      };

      // Guardar en Firestore y local
      await saveSaaSTenantToFirestore(newTenant);
      const updatedList = [...tenants, newTenant];
      saveSaaSTenants(updatedList);

      setCreatedTenant(newTenant);
      onTenantCreated(newTenant);
      setStep(3);
    } catch (e) {
      console.error('Error creando tienda:', e);
      alert('Ocurrió un error al crear la tienda. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setStoreName('');
    setStoreSlug('');
    setOwnerName('');
    setOwnerEmail('');
    setCreatedTenant(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Store className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Crear Nueva Tienda Online SaaS</h2>
              <p className="text-xs text-blue-100">
                Paso {step} de 3 &middot; Onboarding con suscripción Mercado Pago
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

        {/* Body content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">1. Datos del Negocio</h3>
                <p className="text-xs text-slate-500">
                  Ingresa el nombre comercial y el enlace único que tendrá la nueva tienda.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Tienda *
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Ej: Bazar San Juan, Pastelería Dulce Aroma, Deco Hogar"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enlace / Slug personalizado de acceso *
                </label>
                <div className="flex items-center text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-600">
                  <span className="font-mono text-slate-400">mitienda.online/?tienda=</span>
                  <input
                    type="text"
                    value={storeSlug}
                    onChange={e => setStoreSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="bazar-san-juan"
                    className="font-mono font-bold text-blue-700 bg-transparent focus:outline-none flex-1 ml-1"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Solo letras, números y guiones. Será el identificador permanente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rubro / Tipo de Comercio
                  </label>
                  <select
                    value={categoryPreset}
                    onChange={e => setCategoryPreset(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="gastronomia">Gastronomía, Bazar & Cafetería</option>
                    <option value="indumentaria">Indumentaria, Calzado & Moda</option>
                    <option value="tecnologia">Tecnología, Electrónica & Audio</option>
                    <option value="ferreteria">Ferretería, Pinturería & Hogar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre del Propietario / Responsable
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="Ej: Marcos Gómez"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email de Contacto / Facturación *
                  </label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={e => setOwnerEmail(e.target.value)}
                    placeholder="marcos@gmail.com"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp para Pedidos
                  </label>
                  <input
                    type="tel"
                    value={ownerPhone}
                    onChange={e => setOwnerPhone(e.target.value)}
                    placeholder="+54 9 11 5555 4444"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!storeName.trim() || !storeSlug.trim() || !ownerEmail.trim()}
                  onClick={() => setStep(2)}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2"
                >
                  Continuar a Selección de Plan <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">2. Plan & Suscripción Mercado Pago</h3>
                  <p className="text-xs text-slate-500">
                    Selecciona el plan mensual para la tienda. Se vinculará el débito automático.
                  </p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  &larr; Volver
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setSelectedPlan('basic')}
                  className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    selectedPlan === 'basic'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Plan Básico</h4>
                    <p className="text-xl font-black text-slate-900 my-2">$25.000 <span className="text-xs font-normal text-slate-500">ARS/mes</span></p>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      <li>&bull; Hasta 150 productos</li>
                      <li>&bull; Catálogo & POS mostrador</li>
                      <li>&bull; Pedidos por WhatsApp</li>
                    </ul>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedPlan('pro')}
                  className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between relative ${
                    selectedPlan === 'pro'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="absolute -top-2.5 right-3 bg-orange-500 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                    Recomendado
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Plan Profesional Pro</h4>
                    <p className="text-xl font-black text-slate-900 my-2">$45.000 <span className="text-xs font-normal text-slate-500">ARS/mes</span></p>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      <li>&bull; Productos ilimitados</li>
                      <li>&bull; Cloud Sync Firestore</li>
                      <li>&bull; Múltiples cajeros y roles</li>
                      <li>&bull; Exportación Catálogo PDF</li>
                    </ul>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedPlan('enterprise')}
                  className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    selectedPlan === 'enterprise'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Plan Enterprise</h4>
                    <p className="text-xl font-black text-slate-900 my-2">$85.000 <span className="text-xs font-normal text-slate-500">ARS/mes</span></p>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      <li>&bull; Dominio propio personalizado</li>
                      <li>&bull; Multi-sucursal unificada</li>
                      <li>&bull; Google Merchant feed</li>
                      <li>&bull; Soporte 24/7 dedicado</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Mercado Pago pre-authorization info */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-sky-400 font-bold">
                  <CreditCard className="w-4 h-4" /> Integración Recurrente con Mercado Pago
                </div>
                <p className="text-slate-300">
                  Al completar el alta, la tienda quedará aprovisionada en Firestore y configurada para el ciclo de cobro mensual mediante Mercado Pago. El titular podrá gestionar sus métodos de pago en cualquier momento.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  &larr; Paso anterior
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCreateStore}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md"
                >
                  {isSubmitting ? (
                    'Aprovisionando en la nube...'
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" /> Confirmar & Crear Tienda
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && createdTenant && (
            <div className="text-center space-y-4 py-4 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">¡Tienda Creada Exitosamente!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  La tienda <strong>{createdTenant.name}</strong> está lista y aprovisionada en Firestore.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2 max-w-lg mx-auto">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Identificador / Slug:</span>
                  <span className="font-mono font-bold text-slate-900">{createdTenant.slug}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Plan Asignado:</span>
                  <span className="font-bold text-blue-700">{createdTenant.planId.toUpperCase()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Cuota Mensual:</span>
                  <span className="font-bold text-slate-900">${createdTenant.pricePerMonthARS.toLocaleString('es-AR')} ARS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ID de Mercado Pago:</span>
                  <span className="font-mono text-slate-700">{createdTenant.mercadoPagoSubscriptionId}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={`?tienda=${createdTenant.slug}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <Globe className="w-4 h-4" /> Visitar Tienda Creada
                </a>
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Finalizar Onboarding
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
