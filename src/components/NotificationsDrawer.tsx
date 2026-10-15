import React from 'react';
import { X, Bell, AlertTriangle, ShoppingCart, RefreshCw, Info, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import { PushNotification } from '../types';
import { isSoundEnabled, toggleSound } from '../utils/audio';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PushNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotification?: (notif: PushNotification) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification,
}) => {
  const [soundOn, setSoundOn] = React.useState(isSoundEnabled());

  const handleToggleAudio = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: PushNotification['type']) => {
    switch (type) {
      case 'inventory_alert':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'sale':
        return <ShoppingCart className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'sync':
        return <RefreshCw className="w-5 h-5 text-blue-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Bell className="w-5 h-5 text-orange-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full ring-2 ring-slate-900" />
                )}
              </div>
              <div>
                <h2 className="font-bold text-base leading-none">Notificaciones Push</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Alertas de stock y ventas en tiempo real
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleAudio}
                title={soundOn ? 'Silenciar alertas de audio' : 'Activar alertas de audio'}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {soundOn ? <Volume2 className="w-4 h-4 text-orange-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              {unreadCount} sin leer • {notifications.length} total
            </span>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
                >
                  Marcar leídas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-slate-500 hover:text-red-600 cursor-pointer"
                >
                  Vaciar
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600 text-sm">Bandeja al día</p>
                <p className="text-xs text-slate-400 mt-1">
                  No hay notificaciones de inventario pendientes.
                </p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => onSelectNotification?.(notif)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    notif.read
                      ? 'bg-white border-slate-200 opacity-80'
                      : 'bg-orange-50/40 border-orange-200 shadow-xs'
                  } hover:border-orange-300`}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notif.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h3
                          className={`text-xs font-bold truncate ${
                            notif.read ? 'text-slate-700' : 'text-slate-900'
                          }`}
                        >
                          {notif.title}
                        </h3>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tablet push alert simulation hint */}
          <div className="p-3 bg-slate-100 border-t border-slate-200 text-center">
            <p className="text-[11px] text-slate-500">
              Las notificaciones push automáticas se disparan al detectar stock por debajo del límite o ante ventas en terminales sincronizadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
