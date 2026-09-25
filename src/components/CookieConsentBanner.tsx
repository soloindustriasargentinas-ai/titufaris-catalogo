import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, ArrowRight, X } from 'lucide-react';

interface CookieConsentBannerProps {
  onOpenPrivacyPolicy: () => void;
}

const STORAGE_CONSENT_KEY = 'titufaris_consent_storage_v1';

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenPrivacyPolicy }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const hasConsented = localStorage.getItem(STORAGE_CONSENT_KEY);
      if (!hasConsented) {
        // Small delay for smooth entry
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors in restricted iframes
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_CONSENT_KEY, 'true');
    } catch {
      // Fallback
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      id="cookie-consent-banner"
      role="region"
      aria-label="Consentimiento de cookies y almacenamiento local"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-4 sm:p-5 transition-all duration-300 animate-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>Privacidad & Almacenamiento Local</span>
            </h4>
            <button
              onClick={handleAccept}
              aria-label="Cerrar aviso de consentimiento"
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Utilizamos almacenamiento local técnico (IndexedDB / LocalStorage) para conservar los productos en tu carrito, tus cotizaciones y la navegación rápida del catálogo offline. No vendemos tus datos a terceros conforme a la <strong>Ley 25.326</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              id="btn-accept-storage-consent"
              onClick={handleAccept}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Aceptar y Continuar
            </button>

            <button
              id="btn-view-privacy-from-consent"
              onClick={onOpenPrivacyPolicy}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Ver Políticas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
