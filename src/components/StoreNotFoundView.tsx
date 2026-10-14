import React from 'react';
import { Store, ShieldCheck, ArrowRight, HelpCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface StoreNotFoundViewProps {
  subdomain: string;
}

export const StoreNotFoundView: React.FC<StoreNotFoundViewProps> = ({ subdomain }) => {
  const fullDomain = `${subdomain}.titufaris.online`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white flex flex-col justify-between font-sans">
      {/* Top Bar with SSL Security indicator */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono text-indigo-300 font-semibold">{fullDomain}</span>
            <span className="text-slate-600">&middot;</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Conexión SSL Segura
            </span>
          </div>

          <a
            href="https://titufaris.online"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            titufaris.online &rarr;
          </a>
        </div>
      </div>

      {/* Main 404 Hero Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="max-w-xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-slate-800 to-slate-700/80 border border-slate-700/60 rounded-3xl mx-auto flex items-center justify-center text-amber-400 shadow-inner mb-6">
            <Store className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
          </div>

          {/* Code & Title */}
          <span className="inline-block text-[11px] font-black tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full mb-3">
            Tienda No Registrada &middot; 404
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
            Esta tienda aún no ha sido creada
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-md mx-auto mb-6">
            El subdominio <strong className="text-white font-mono bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">{subdomain}</strong> no corresponde a ninguna tienda online activa en nuestra plataforma.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center mb-8">
            <a
              href="https://tiendas.titufaris.online"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Store className="w-4 h-4" />
              Crear mi tienda (3 Meses Gratis)
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="https://titufaris.online"
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm px-4 py-3 rounded-xl border border-slate-700 transition-all"
            >
              Ir a Titufaris Matriz
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

          {/* Owner Help Section */}
          <div className="pt-6 border-t border-slate-800/80 text-left bg-slate-950/40 -mx-6 -mb-6 sm:-mx-10 sm:-mb-10 p-5 sm:p-6 rounded-b-3xl">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300 font-semibold block mb-0.5">
                  ¿Sos el propietario de esta marca?
                </strong>
                Si acabás de registrar esta tienda, ingresá al panel maestro en{' '}
                <a
                  href="https://admin.titufaris.online"
                  className="text-indigo-400 hover:underline font-mono"
                >
                  admin.titufaris.online
                </a>{' '}
                o verificá que el slug del subdominio esté escrito exactamente igual al momento del alta.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-4 text-center text-xs text-slate-500">
        Plataforma Multi-Tenant &middot; Titufaris Cloud Commerce
      </footer>
    </div>
  );
};
