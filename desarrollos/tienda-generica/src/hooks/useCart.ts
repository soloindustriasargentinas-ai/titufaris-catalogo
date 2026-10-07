import { useState, useMemo, useCallback } from 'react';
import { CartItem, Product } from '../types';
import { CartToastData } from '../components/CartConfirmationToast';
import { playBeep } from '../utils/audio';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posDiscount, setPosDiscount] = useState<number>(0);
  const [cartToast, setCartToast] = useState<CartToastData | null>(null);

  const clearCartToast = useCallback(() => {
    setCartToast(null);
  }, []);

  const handleAddToCart = useCallback(
    (product: Product, priceType: 'retail' | 'wholesale' = 'retail', quantityToAdd: number = 1) => {
      if (product.stock <= 0) return;

      const toAdd = Math.max(1, quantityToAdd);
      let addedQty = 0;
      let totalQty = 0;
      let isMaxReached = false;
      let effectiveUnitPrice = priceType === 'wholesale' ? product.wholesalePrice : product.retailPrice;

      setCart(prev => {
        const existing = prev.find(it => it.product.id === product.id);
        if (existing) {
          if (existing.quantity >= product.stock) {
            addedQty = 0;
            totalQty = existing.quantity;
            isMaxReached = true;
            effectiveUnitPrice = existing.unitPrice;
            return prev;
          }
          const actualAdd = Math.min(toAdd, product.stock - existing.quantity);
          addedQty = actualAdd;
          const nextQty = existing.quantity + actualAdd;
          totalQty = nextQty;
          // Regla comercial: Venta mayorista automática a partir de 10 unidades
          const isWholesale = nextQty >= 10 || existing.priceType === 'wholesale' || priceType === 'wholesale';
          effectiveUnitPrice = isWholesale ? product.wholesalePrice : product.retailPrice;

          return prev.map(it =>
            it.product.id === product.id
              ? {
                  ...it,
                  quantity: nextQty,
                  unitPrice: effectiveUnitPrice,
                  priceType: isWholesale ? 'wholesale' : 'retail',
                }
              : it
          );
        } else {
          const actualAdd = Math.min(toAdd, product.stock);
          addedQty = actualAdd;
          totalQty = actualAdd;
          const isWholesale = actualAdd >= 10 || priceType === 'wholesale';
          effectiveUnitPrice = isWholesale ? product.wholesalePrice : product.retailPrice;
          return [
            ...prev,
            { product, quantity: actualAdd, unitPrice: effectiveUnitPrice, priceType: isWholesale ? 'wholesale' : 'retail' },
          ];
        }
      });

      playBeep();

      // Show confirmation toast
      setCartToast({
        id: 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        product,
        quantityAdded: addedQty > 0 ? addedQty : toAdd,
        totalInCart: totalQty > 0 ? totalQty : toAdd,
        unitPrice: effectiveUnitPrice,
        priceType,
        isMaxStockReached: isMaxReached,
      });
    },
    []
  );

  const handleUpdateCartQty = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(it => it.product.id !== productId));
      return;
    }
    setCart(prev =>
      prev.map(it => {
        if (it.product.id !== productId) return it;
        const nextQty = Math.min(quantity, it.product.stock);
        // Regla comercial: Venta mayorista automática a partir de 10 unidades
        const isWholesale = nextQty >= 10 || it.priceType === 'wholesale';
        const unitPrice = isWholesale ? it.product.wholesalePrice : it.product.retailPrice;
        return {
          ...it,
          quantity: nextQty,
          unitPrice,
          priceType: isWholesale ? 'wholesale' : 'retail',
        };
      })
    );
  }, []);

  const handleRemoveCartItem = useCallback((productId: string) => {
    setCart(prev => prev.filter(it => it.product.id !== productId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const removeByProductId = useCallback((productId: string) => {
    setCart(prev => prev.filter(it => it.product.id !== productId));
  }, []);

  const cartItemCount = useMemo(() => cart.reduce((acc, it) => acc + it.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0), [cart]);
  const cartDiscountAmount = useMemo(() => (cartSubtotal * posDiscount) / 100, [cartSubtotal, posDiscount]);
  const cartTotal = useMemo(() => Math.max(0, cartSubtotal - cartDiscountAmount), [cartSubtotal, cartDiscountAmount]);

  return {
    cart,
    setCart,
    posDiscount,
    setPosDiscount,
    cartToast,
    clearCartToast,
    handleAddToCart,
    handleUpdateCartQty,
    handleRemoveCartItem,
    handleClearCart,
    removeByProductId,
    cartItemCount,
    cartSubtotal,
    cartDiscountAmount,
    cartTotal,
  };
}
