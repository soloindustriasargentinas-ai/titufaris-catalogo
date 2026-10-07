import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShoppingBag, ArrowRight, X, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/storage';

export interface CartToastData {
  id: string;
  product: Product;
  quantityAdded: number;
  totalInCart: number;
  unitPrice: number;
  priceType: 'retail' | 'wholesale';
  isMaxStockReached?: boolean;
}

interface CartConfirmationToastProps {
  toast: CartToastData | null;
  onClose: () => void;
  onOpenCart: () => void;
}

export const CartConfirmationToast: React.FC<CartConfirmationToastProps> = ({
  toast,
  onClose,
  onOpenCart,
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    if (toast) {
      setIsRendered(true);
      // Small frame delay to trigger CSS transition
      const enterTimer = requestAnimationFrame(() => {
        setIsAnimatingIn(true);
      });

      // Auto-dismiss after 4.5 seconds
      const dismissTimer = setTimeout(() => {
        handleDismiss();
      }, 4500);

      return () => {
        cancelAnimationFrame(enterTimer);
        clearTimeout(dismissTimer);
      };
    } else {
      setIsAnimatingIn(false);
      const exitTimer = setTimeout(() => {
        setIsRendered(false);
      }, 250);
      return () => clearTimeout(exitTimer);
    }
  }, [toast]);

  const handleDismiss = () => {
    setIsAnimatingIn(false);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  if (!isRendered || !toast) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-4 right-4 sm:top-auto sm:bottom-6 sm:right-6 sm:left-auto sm:w-[420px] z-50 pointer-events-auto transition-all duration-300 ease-out transform ${
        isAnimatingIn
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 -translate-y-4 sm:translate-y-4 scale-95 pointer-events-none'
      }`}
    >
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 backdrop-blur-md flex flex-col gap-3">
        <div className="flex items-start gap-3">
          {/* Product Thumbnail or Status Icon */}
          <div className="relative shrink-0 w-12 h-12 rounded-xl bg-white p-1 overflow-hidden border border-slate-700 flex items-center justify-center">
            <img
              src={
                toast.product.imageUrl ||
                (toast.product.images && toast.product.images.length > 0
                  ? toast.product.images[0]
                  : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=150&q=80')
              }
              alt={toast.product.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=150&q=80';
              }}
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Toast Details */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>
                {toast.isMaxStockReached
                  ? 'Límite de stock alcanzado'
                  : '¡Producto agregado al carrito!'}
              </span>
            </div>

            <p className="text-sm font-bold text-white mt-0.5 leading-snug truncate">
              {toast.product.name}
            </p>

            <p className="text-xs text-slate-300 mt-0.5">
              {toast.isMaxStockReached ? (
                <span className="text-amber-300 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 inline" />
                  Ya tienes el stock máximo disponible ({toast.totalInCart} u.)
                </span>
              ) : (
                <span>
                  Se {toast.quantityAdded === 1 ? 'agregó' : 'agregaron'}{' '}
                  <strong className="text-orange-400 font-extrabold">
                    {toast.quantityAdded}{' '}
                    {toast.quantityAdded === 1 ? 'unidad' : 'unidades'}
                  </strong>{' '}
                  al carrito.
                </span>
              )}
            </p>

            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
              <span className="bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 font-mono text-slate-300">
                Total en carrito: <strong>{toast.totalInCart} u.</strong>
              </span>
              <span>•</span>
              <span>{formatCurrency(toast.unitPrice * toast.totalInCart)}</span>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Actions inside Toast */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              handleDismiss();
              onOpenCart();
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 transition-all cursor-pointer"
          >
            <span>Ver Mi Pedido ({toast.totalInCart})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="py-2 px-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Seguir viendo
          </button>
        </div>
      </div>
    </div>
  );
};
