import React from 'react';
import {
  AlertTriangle,
  Clock,
  CreditCard,
  Zap,
  Wrench,
  CheckCircle2,
  Lock,
  ArrowRight,
  Globe
} from 'lucide-react';
import { SaaSTenantStore } from '../types/saas';

interface TenantStatusBannerProps {
  tenant: SaaSTenantStore;
  onOpenSubscriptionModal: () => void;
  onOpenMasterPanel: () => void;
  onOpenCustomDomain?: () => void;
}

export const TenantStatusBanner: React.FC<TenantStatusBannerProps> = ({
  tenant,
  onOpenSubscriptionModal,
  onOpenMasterPanel,
  onOpenCustomDomain,
}) => {
  // If it's the primary flagship store titufaris, do not show any warning or past-due alert
  if (tenant.id === 'titufaris' || tenant.isDefaultStore) {
    return null;
  }

  // Calculate days remaining if trial
  let trialDaysRemaining = 0;
  if (tenant.subscriptionStatus === 'trial' && tenant.trialEndsAt) {
    const diffTime = new Date(tenant.trialEndsAt).getTime() - Date.now();
    trialDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Pending custom domain configuration banner
  if (
    (tenant.domainStatus === 'pending_dns' || tenant.domainStatus === 'propagating') &&
    tenant.customDomain &&
    onOpenCustomDomain
  ) {
    return (
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs border-b border-indigo-700">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>
            Dominio Propio en Configuración: <strong className="font-bold text-indigo-200">{tenant.customDomain}</strong> requiere registrar los registros DNS (A & CNAME) en su registrador.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCustomDomain}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Clock className="w-3.5 h-3.5" /> Ver Registros DNS & Verificar
          </button>
        </div>
      </div>
    );
  }

  if (tenant.subscriptionStatus === 'trial') {
    return (
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs border-b border-blue-600">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-300 animate-pulse" />
          <span>
            Prueba de 3 Meses Activa para <strong className="font-bold">{tenant.name}</strong>:{' '}
            <span className="bg-sky-400 text-slate-950 font-bold px-1.5 py-0.2 rounded text-[10px]">
              {trialDaysRemaining} días restantes &middot; Hasta 50 productos
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSubscriptionModal}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5" /> Escalar Tienda
          </button>
        </div>
      </div>
    );
  }

  if (tenant.subscriptionStatus === 'past_due') {
    return (
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs border-b border-amber-500">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-200" />
          <span>
            Aviso de Facturación: La última cuota mensual no pudo debitarse.{' '}
            <span className="underline font-medium">Regulariza el pago para evitar la interrupción del servicio.</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSubscriptionModal}
            className="bg-white text-amber-900 hover:bg-amber-50 text-xs font-bold px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" /> Pagar Cuota en Mercado Pago
          </button>
        </div>
      </div>
    );
  }

  if (tenant.technicalHealth.maintenanceMode) {
    return (
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-amber-300 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>
            Esta tienda se encuentra temporalmente en <strong>Modo Mantenimiento</strong> preventivo.
          </span>
        </div>
      </div>
    );
  }

  return null;
};
