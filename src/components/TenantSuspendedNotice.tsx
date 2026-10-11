import React from 'react';
import {
  AlertOctagon,
  CreditCard,
  Building2,
  Mail,
  Phone,
  RefreshCw,
  Home,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { SaaSTenantStore } from '../types/saas';

interface TenantSuspendedNoticeProps {
  tenant: SaaSTenantStore;
  onOpenSubscriptionModal: () => void;
  onReturnToTitufaris: () => void;
}

export const TenantSuspendedNotice: React.FC<TenantSuspendedNoticeProps> = ({
  tenant,
  onOpenSubscriptionModal,
  onReturnToTitufaris,
}) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center mx-auto">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Tienda Temporalmente Pausada
          </h2>
          <p className="text-xs text-slate-300">
            El catálogo de <strong>{tenant.name}</strong> ({tenant.slug}) no se encuentra disponible momentáneamente.
          </p>
        </div>

        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs text-slate-400 text-left space-y-2">
          <div className="flex justify-between">
            <span>Motivo:</span>
            <span className="font-semibold text-amber-300">
              {tenant.subscriptionStatus === 'canceled'
                ? 'Suscripción mensual pausada'
                : 'Mantenimiento preventivo'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Contacto:</span>
            <span className="font-medium text-slate-300">{tenant.ownerEmail}</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-800">
            Si eres cliente de esta tienda, puedes comunicarte con sus encargados. Si eres el propietario, puedes reactivar el servicio al instante.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={onOpenSubscriptionModal}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            <CreditCard className="w-4 h-4 text-sky-300" />
            Soy el Propietario: Reactivar con Mercado Pago
          </button>

          <button
            onClick={onReturnToTitufaris}
            className="w-full py-2.5 px-4 bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Volver a Titufaris.online
          </button>
        </div>
      </div>
    </div>
  );
};
