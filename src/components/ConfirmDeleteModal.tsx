import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/storage';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (product: Product) => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  product,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header with Danger Icon */}
        <div className="bg-red-50 p-5 border-b border-red-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                ¿Eliminar artículo del catálogo?
              </h3>
              <p className="text-xs text-red-700 font-medium mt-0.5">
                Esta acción es irreversible
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product preview card */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
              <img
                src={
                  (product.imageUrl && product.imageUrl.trim() !== '')
                    ? product.imageUrl
                    : (product.images && product.images.length > 0 && product.images[0] && product.images[0].trim() !== '')
                    ? product.images[0]
                    : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=80'
                }
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=80';
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-mono text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-sm">
                {product.sku}
              </span>
              <h4 className="font-bold text-slate-900 text-sm truncate mt-0.5">
                {product.name}
              </h4>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span>Stock: <strong>{product.stock} {product.unit}s</strong></span>
                <span>•</span>
                <span>PVP: <strong className="text-slate-800">{formatCurrency(product.retailPrice)}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              El producto se quitará de la tienda pública, de la terminal POS y del catálogo activo.
              Los comprobantes y registros históricos de ventas previas se mantendrán intactos.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 px-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(product);
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Sí, Eliminar Artículo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
