import React from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';
import { SyncStatus } from '../types';

interface OfflineBannerProps {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  onManualSync: () => void;
  onToggleSimulatedOffline?: () => void;
  isSimulatedOffline?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  syncStatus,
  pendingCount,
  onManualSync,
  onToggleSimulatedOffline,
  isSimulatedOffline,
}) => {
  const isOffline = !isOnline || isSimulatedOffline;

  if (!isOffline && pendingCount === 0 && syncStatus === 'synced') {
    return null;
  }

  return (
    <div
      className={`w-full px-4 py-2 text-xs font-medium transition-colors flex items-center justify-between flex-wrap gap-2 ${
        isOffline
          ? 'bg-amber-500/10 text-amber-900 border-b border-amber-300'
          : 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
      }`}
    >
      <div className="flex items-center gap-2">
        {isOffline ? (
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
        ) : (
          <Wifi className="w-4 h-4 text-emerald-600 shrink-0" />
        )}
        <span>
          {isOffline ? (
            <>
              <strong>Modo Sin Conexión (Offline):</strong> Operando con almacenamiento local.
              {pendingCount > 0 && ` (${pendingCount} operaciones pendientes de sincronizar)`}
            </>
          ) : (
            <>
              <strong>Conexión Restablecida:</strong> Sincronizando con el servidor central Titufaris...
            </>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {pendingCount > 0 && (
          <button
            onClick={onManualSync}
            disabled={syncStatus === 'syncing'}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>{syncStatus === 'syncing' ? 'Sincronizando...' : `Sincronizar (${pendingCount})`}</span>
          </button>
        )}

        {onToggleSimulatedOffline && (
          <button
            onClick={onToggleSimulatedOffline}
            title="Simular pérdida de internet para pruebas operativas"
            className="text-[11px] underline text-slate-600 hover:text-slate-900 ml-2 cursor-pointer"
          >
            {isSimulatedOffline ? 'Reanudar conexión' : 'Probar modo offline'}
          </button>
        )}
      </div>
    </div>
  );
};
