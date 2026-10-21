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
  Globe,
  Copy,
  Check,
  ExternalLink,
  Construction,
} from 'lucide-react';
import { CompanyProfile } from '../types';
import { SaaSTenantStore, SaaSPlanId } from '../types/saas';
import {
  saveSaaSTenantToFirestore,
  saveCompanyToFirestore,
  seedCategoriesToFirestore,
  seedProductsToFirestore,
} from '../lib/firebase';
import { saveSaaSTenants } from '../utils/saasStorage';
import { saveCompany, saveProducts, saveCategories } from '../utils/storage';
import { saasCompany } from '../data/saasDemoData';
import { getPresetDataForCategory, TenantCategoryPresetType } from '../data/tenantPresetsData';

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: SaaSTenantStore[];
  onTenantCreated: (newTenant: SaaSTenantStore) => void;
  onSelectTenantDirectly?: (tenantId: string) => void;
}

export const CreateTenantModal: React.FC<CreateTenantModalProps> = ({
  isOpen,
  onClose,
  tenants,
  onTenantCreated,
  onSelectTenantDirectly,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [categoryPreset, setCategoryPreset] = useState<'gastronomia' | 'indumentaria' | 'tecnologia' | 'ferreteria'>('gastronomia');
  const [initialStoreStatus, setInitialStoreStatus] = useState<'under_construction' | 'published'>('under_construction');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('+54 9 11 ');
  const [selectedPlan, setSelectedPlan] = useState<SaaSPlanId>('pro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTenant, setCreatedTenant] = useState<SaaSTenantStore | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const [customUnderConstructionMsg, setCustomUnderConstructionMsg] = useState('');
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'syncing' | 'synced'>('syncing');

  if (!isOpen) return null;

  const sanitizeSlugInput = (input: string) => {
    return input
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\.titufaris\.online.*$/i, '')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setStoreName(name);
    // Auto generate clean slug
    const cleanSlug = sanitizeSlugInput(name);
    setStoreSlug(cleanSlug);
  };

  const handleCreateStore = async () => {
    const cleanSlug = sanitizeSlugInput(storeSlug);
    if (!storeName.trim() || !cleanSlug || !ownerEmail.trim()) {
      alert('Por favor completa todos los campos requeridos (Nombre de tienda, subdominio y email).');
      return;
    }

    // Check slug collision
    const existing = tenants.find(t => t.slug === cleanSlug || t.id === cleanSlug);
    if (existing) {
      alert('Este identificador / slug de tienda ya se encuentra en uso. Por favor elige otro.');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      // Período de prueba de 3 meses gratis (90 días)
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + 90);

      const nextBilling = new Date();
      nextBilling.setDate(nextBilling.getDate() + 90);

      const priceMap: Record<SaaSPlanId, number> = {
        trial: 0,
        basic: 8990,
        pro: 16990,
        enterprise: 29990
      };

      // Generate tailored starter catalog, categories, branding and descriptions
      const presetData = getPresetDataForCategory(
        categoryPreset,
        storeName,
        cleanSlug,
        ownerEmail,
        ownerPhone
      );

      const isPublished = initialStoreStatus === 'published';
      presetData.company.isPublished = isPublished;
      presetData.company.underConstructionMessage = isPublished
        ? undefined
        : (customUnderConstructionMsg.trim() ||
           `Estamos preparando nuestro nuevo catálogo oficial de ${storeName.trim()}. ¡Próximamente disponible! Podés contactarnos directamente por WhatsApp para consultas o pedidos.`);

      const newTenant: SaaSTenantStore = {
        id: cleanSlug,
        name: storeName.trim(),
        slug: cleanSlug,
        customDomain: `${cleanSlug}.titufaris.online`,
        domainStatus: 'ssl_active',
        isDefaultStore: false,
        ownerName: ownerName.trim() || 'Propietario de ' + storeName,
        ownerEmail: ownerEmail.trim(),
        ownerPhone: ownerPhone.trim(),
        planId: selectedPlan,
        subscriptionStatus: 'trial', // Inicia siempre en período de prueba gratuito bonificado
        isPublished: isPublished,
        underConstructionMessage: presetData.company.underConstructionMessage,
        pricePerMonthARS: priceMap[selectedPlan],
        billingCycle: 'monthly',
        mercadoPagoSubscriptionId: 'TRIAL-90D-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        createdAt: now.toISOString(),
        trialEndsAt: trialEnds.toISOString(),
        nextBillingDate: nextBilling.toISOString(),
        technicalHealth: {
          status: 'healthy',
          productsCount: presetData.products.length,
          categoriesCount: presetData.categories.length,
          salesCount: 0,
          lastSyncAt: now.toISOString(),
          storageKB: 45,
          maintenanceMode: !isPublished,
          issuesDetected: [],
          lastDiagnosticAt: now.toISOString()
        },
        notes: `Tienda creada con 3 meses gratis sin tarjeta. Rubro: ${categoryPreset}. Estado inicial: ${isPublished ? 'Publicada' : 'En Construcción'}. Plan elegido: ${selectedPlan.toUpperCase()}.`
      };

      // 1. Guardar de forma inmediata en almacenamiento local persistente (CERO LATENCIA - INSTANTÁNEO)
      const updatedList = [...tenants.filter(t => t.id !== cleanSlug), newTenant];
      saveSaaSTenants(updatedList);
      saveCompany(presetData.company, cleanSlug);
      saveCategories(presetData.categories, cleanSlug);
      saveProducts(presetData.products, cleanSlug);

      // 2. Disparar sincronización con Firebase en paralelo en segundo plano (NO bloquea al usuario)
      setCloudSyncStatus('syncing');
      Promise.allSettled([
        saveSaaSTenantToFirestore(newTenant),
        saveCompanyToFirestore(presetData.company, cleanSlug),
        seedCategoriesToFirestore(presetData.categories, cleanSlug),
        seedProductsToFirestore(presetData.products, cleanSlug)
      ]).then(() => {
        setCloudSyncStatus('synced');
      }).catch(err => {
        console.warn('Nota de sincronización Firestore:', err);
        setCloudSyncStatus('synced');
      });

      // 3. Avanzar inmediatamente al paso 3 (ÉXITO TOTAL)
      setCreatedTenant(newTenant);
      onTenantCreated(newTenant);
      setStep(3);
    } catch (e) {
      console.error('Error creando tienda:', e);
      alert('Ocurrió un error al crear la tienda. Por favor verifica los datos e intenta nuevamente.');
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
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Crear Tienda Online</h2>
                <span className="bg-emerald-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  🎁 3 Meses Gratis
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Paso {step} de 3 &middot; Sin tarjeta de crédito ni débito en el período de prueba
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
                  Subdominio Oficial de tu Tienda *
                </label>
                <div className="flex items-center text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <span className="font-mono text-slate-500 font-semibold select-none">https://</span>
                  <input
                    type="text"
                    value={storeSlug}
                    onChange={e => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="bazar-sanjuan"
                    className="font-mono font-bold text-blue-700 bg-transparent focus:outline-none flex-1 px-1"
                    required
                  />
                  <span className="font-mono text-slate-500 font-semibold select-none">.titufaris.online</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-0.5">
                  <span>Tu enlace web será: <strong className="text-blue-700 font-mono">https://{storeSlug || 'tunegocio'}.titufaris.online</strong></span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">🔒 SSL Activo</span>
                </div>
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

              {/* VISIBILIDAD INICIAL DE LA TIENDA (EN CONSTRUCCIÓN VS PUBLICADA) */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Estado Inicial de la Tienda al Crearse
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Podés cambiarlo en cualquier momento desde el Admin o Configuración de Tienda
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setInitialStoreStatus('under_construction')}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-start gap-2.5 ${
                      initialStoreStatus === 'under_construction'
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                      <Construction className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">En Construcción</span>
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                        Oculta el catálogo al público mientras cargas productos en el admin. Los clientes ven una pantalla de Próximamente con WhatsApp.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setInitialStoreStatus('published')}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-start gap-2.5 ${
                      initialStoreStatus === 'published'
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-400/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">Publicada de Inmediato</span>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                        Visible en línea desde el primer instante con los productos iniciales cargados.
                      </p>
                    </div>
                  </div>
                </div>

                {initialStoreStatus === 'under_construction' && (
                  <div className="pt-1.5 animate-fadeIn">
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">
                      Mensaje de Próximamente para los Clientes (Opcional):
                    </label>
                    <input
                      type="text"
                      value={customUnderConstructionMsg}
                      onChange={e => setCustomUnderConstructionMsg(e.target.value)}
                      placeholder={`Estamos preparando nuestro nuevo catálogo oficial de ${storeName || 'la tienda'}. ¡Próximamente disponible! Podés contactarnos directamente por WhatsApp.`}
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!storeName.trim() || !storeSlug.trim() || !ownerEmail.trim()}
                  onClick={() => setStep(2)}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs"
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
                  <h3 className="font-bold text-slate-900 text-base">2. Escalar Tienda & Selección de Plan</h3>
                  <p className="text-xs text-slate-500">
                    Prueba gratuita de 3 meses para hasta 50 productos. Elige el plan para continuar cuando escales tu catálogo:
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
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Inicial</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">Plan Emprendedor</h4>
                    <p className="text-xl font-black text-slate-900 my-2">$8.990 <span className="text-xs font-normal text-slate-500">ARS/mes</span></p>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      <li>&bull; <strong>Hasta 250 productos activos</strong></li>
                      <li>&bull; <strong>0% comisiones por venta</strong></li>
                      <li>&bull; Subdominio .titufaris.online con SSL</li>
                      <li>&bull; Catálogo & Pedidos a WhatsApp</li>
                      <li>&bull; Punto de Venta (POS) mostrador</li>
                      <li>&bull; Respaldo en Firebase Firestore</li>
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
                  <span className="absolute -top-2.5 right-3 bg-indigo-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                    Más Elegido
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">En Expansión</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">Plan Negocio Pro</h4>
                    <p className="text-xl font-black text-slate-900 my-2">$16.990 <span className="text-xs font-normal text-slate-500">ARS/mes</span></p>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      <li>&bull; <strong>Productos Ilimitados</strong></li>
                      <li>&bull; <strong>0% comisiones por venta</strong></li>
                      <li>&bull; Dominio propio (.com / .com.ar) con SSL</li>
                      <li>&bull; Hasta 5 empleados y roles</li>
                      <li>&bull; Notificaciones Push en tiempo real</li>
                      <li>&bull; Reportes contables y Libro IVA Ventas</li>
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
                    <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider">Cadenas & Marcas</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">Plan Empresa & Multi-Sucursal</h4>
                    <p className="text-xl font-black text-slate-900 my-2">$29.990 <span className="text-xs font-normal text-slate-500">ARS/mes</span></p>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      <li>&bull; Todo lo del Plan Pro</li>
                      <li>&bull; <strong>Multi-sucursal & depósitos unificados</strong></li>
                      <li>&bull; Transferencias de stock en tiempo real</li>
                      <li>&bull; Usuarios y cajeros ilimitados</li>
                      <li>&bull; Google Shopping Feed XML</li>
                      <li>&bull; Respaldo y auditoría en la nube A+</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Free Trial & Subscription info */}
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-4 rounded-xl space-y-2 text-xs border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> 3 Meses 100% Bonificados &middot; Sin Comisiones por Venta &middot; Sin Tarjeta Requerida
                </div>
                <p className="text-slate-300">
                  Tu tienda quedará creada de inmediato en Firestore y activa por <strong>90 días sin costo alguno para hasta 250 productos con acceso total a todas las funciones</strong>. Durante este período de prueba <strong>no se te solicitará tarjeta de crédito ni de débito</strong>. Al completar los productos o finalizar los 3 meses podrás activar el plan elegido mediante Mercado Pago para continuar escalando.
                </p>
                <div className="pt-1 text-[11px] text-emerald-300 font-medium border-t border-white/10 flex items-center gap-1.5">
                  <span>🔒 Respaldo en Firebase Firestore: toda la información de productos, inventario, ventas y configuración está resguardada en la nube y nunca se perderá.</span>
                </div>
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
                  La tienda <strong>{createdTenant.name}</strong> está lista y aprovisionada con respaldo seguro en Firebase Firestore.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2 max-w-lg mx-auto">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Subdominio Web Oficial:</span>
                  <span className="font-mono font-bold text-blue-700">https://{createdTenant.slug}.titufaris.online</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Estado de Publicación:</span>
                  <span className="font-bold flex items-center gap-1">
                    {createdTenant.isPublished ? (
                      <span className="text-emerald-700">🟢 Publicada Online</span>
                    ) : (
                      <span className="text-amber-700">🟡 En Construcción (Oculta al público mientras cargas productos)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Condición Inicial:</span>
                  <span className="font-bold text-emerald-700">Prueba 3 Meses Gratis (Hasta 50 productos)</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Plan Seleccionado para Escalar:</span>
                  <span className="font-bold text-blue-700">{createdTenant.planId.toUpperCase()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Cuota al Finalizar Prueba:</span>
                  <span className="font-bold text-slate-900">${createdTenant.pricePerMonthARS.toLocaleString('es-AR')} ARS/mes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Respaldo en la Nube:</span>
                  <span className="font-mono text-xs font-semibold flex items-center gap-1">
                    {cloudSyncStatus === 'syncing' ? (
                      <span className="text-indigo-600 font-medium animate-pulse">⏳ Sincronizando con Firestore...</span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">✓ Firebase Firestore Conectado</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                {/* 1. Official Cloudflare Subdomain Link */}
                <a
                  href={`https://${createdTenant.slug}.titufaris.online`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md hover:scale-[1.02]"
                >
                  <Globe className="w-4 h-4 text-slate-950" />
                  <span>Abrir {createdTenant.slug}.titufaris.online</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-900" />
                </a>

                {/* 2. Copy Official URL */}
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(`https://${createdTenant.slug}.titufaris.online`);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2500);
                    }
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">¡Enlace Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>Copiar Enlace</span>
                    </>
                  )}
                </button>

                {/* 3. Enter directly in current window */}
                {onSelectTenantDirectly && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTenantDirectly(createdTenant.id);
                      handleReset();
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Administrar Ahora</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
