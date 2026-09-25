import React from 'react';
import { X, Construction, MessageCircle, Phone, FileText, CheckCircle2 } from 'lucide-react';
import { Product, CompanyProfile } from '../types';
import { formatCurrency } from '../utils/storage';

interface UnderConstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  company: CompanyProfile;
}

export const UnderConstructionModal: React.FC<UnderConstructionModalProps> = ({
  isOpen,
  onClose,
  product,
  company,
}) => {
  if (!isOpen) return null;

  const cleanPhone = company.phone.replace(/[^0-9]/g, '');
  const productText = product
    ? `Hola ${company.name}! Escaneé el código QR del producto "${product.name}" (SKU: ${product.sku}) y quisiera consultar precio y disponibilidad.`
    : `Hola ${company.name}! Quisiera realizar una consulta sobre equipamiento comercial.`;

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(productText)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-amber-300">
        {/* Top Warning Banner */}
        <div className="bg-amber-400 px-6 py-4 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-950 text-amber-400 rounded-xl shadow-xs">
              <Construction className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-white px-2 py-0.5 rounded-full inline-block mb-0.5">
                Aviso Importante
              </span>
              <h2 className="font-black text-base text-slate-950">Página Web en Construcción</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-900 hover:bg-amber-500 transition-colors cursor-pointer"
            title="Cerrar aviso"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-slate-700">
          <div className="space-y-2">
            <h3 className="font-extrabold text-lg text-slate-900">
              ¡Bienvenido a {company.name}!
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Actualmente estamos desarrollando nuestra plataforma interactiva oficial.
              Por motivos de seguridad, el <strong>panel de administración y gestión está estrictamente reservado para usuarios registrados</strong>.
            </p>
          </div>

          {/* Scanned Product Spotlight if opened from QR */}
          {product && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex gap-3.5 items-center">
              <img
                src={
                  (product.imageUrl && product.imageUrl.trim() !== '')
                    ? product.imageUrl
                    : (product.images && product.images.length > 0 && product.images[0] && product.images[0].trim() !== '')
                    ? product.images[0]
                    : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80'
                }
                alt={product.name}
                className="w-16 h-16 rounded-xl object-contain bg-white p-1 border border-amber-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full inline-block">
                  SKU: {product.sku}
                </span>
                <h4 className="text-xs font-black text-slate-900 truncate mt-1">{product.name}</h4>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm font-black text-slate-900">
                    {formatCurrency(product.retailPrice)}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                    Mayorista 10+ u.: {formatCurrency(product.wholesalePrice)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Notice Points */}
          <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Atención directa de fábrica:</strong> Cotizaciones inmediatas y asesoramiento personalizado para locales y supermercados.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Descuentos por volumen:</strong> Tarifa mayorista especial a partir de 10 unidades.
              </span>
            </div>
          </div>

          {/* Contact Actions */}
          <div className="space-y-2 pt-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Consultar Disponibilidad por WhatsApp</span>
            </a>

            <div className="flex gap-2">
              <a
                href={`tel:${cleanPhone}`}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Llamar: {company.phone}</span>
              </a>

              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-orange-400" />
                <span>Ver Ficha Técnica</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center text-[11px] text-slate-400">
          {company.name} • Fábrica de Equipamientos Comerciales
        </div>
      </div>
    </div>
  );
};
