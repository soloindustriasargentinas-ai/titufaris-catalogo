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

  const applyWholesaleRule = useCallback((items: CartItem[]): CartItem[] => {
    const totalQty = items.reduce((acc, it) => acc + it.quantity, 0);
    // Regla: Si agregan al carro más de 10 productos (cualquiera que sea), el precio cambia a x mayor en el carro para todos los productos seleccionados
    const isWholesaleActive = totalQty > 10;

    return items.map(it => {
      const wholesalePrice = it.product.wholesalePrice;
      const retailPrice = it.product.retailPrice;
      const unitPrice = isWholesaleActive && wholesalePrice !== undefined ? wholesalePrice : retailPrice;
      return {
        ...it,
        unitPrice,
        priceType: isWholesaleActive ? 'wholesale' : 'retail',
      };
    });
  }, []);

  const handleAddToCart = useCallback(
    (product: Product, _unusedPriceType: 'retail' | 'wholesale' = 'retail', quantityToAdd: number = 1) => {
      if (product.stock <= 0) return;

      const toAdd = Math.max(1, quantityToAdd);
      let addedQty = 0;
      let totalQty = 0;
      let isMaxReached = false;

      setCart(prev => {
        let updated: CartItem[];
        const existing = prev.find(it => it.product.id === product.id);

        if (existing) {
          if (existing.quantity >= product.stock) {
            addedQty = 0;
            totalQty = existing.quantity;
            isMaxReached = true;
            return prev;
          }
          const actualAdd = Math.min(toAdd, product.stock - existing.quantity);
          addedQty = actualAdd;
          const nextQty = existing.quantity + actualAdd;
          totalQty = nextQty;

          updated = prev.map(it =>
            it.product.id === product.id
              ? { ...it, quantity: nextQty }
              : it
          );
        } else {
          const actualAdd = Math.min(toAdd, product.stock);
          addedQty = actualAdd;
          totalQty = actualAdd;
          updated = [
            ...prev,
            { product, quantity: actualAdd, unitPrice: product.retailPrice, priceType: 'retail' },
          ];
        }

        return applyWholesaleRule(updated);
      });

      playBeep();

      // Show confirmation toast
      setCartToast({
        id: 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        product,
        quantityAdded: addedQty > 0 ? addedQty : toAdd,
        totalInCart: totalQty > 0 ? totalQty : toAdd,
        unitPrice: product.retailPrice,
        priceType: 'retail',
        isMaxStockReached: isMaxReached,
      });
    },
    [applyWholesaleRule]
  );

  const handleUpdateCartQty = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => applyWholesaleRule(prev.filter(it => it.product.id !== productId)));
      return;
    }
    setCart(prev => {
      const updated = prev.map(it => {
        if (it.product.id !== productId) return it;
        const nextQty = Math.min(quantity, it.product.stock);
        return {
          ...it,
          quantity: nextQty,
        };
      });
      return applyWholesaleRule(updated);
    });
  }, [applyWholesaleRule]);

  const handleRemoveCartItem = useCallback((productId: string) => {
    setCart(prev => applyWholesaleRule(prev.filter(it => it.product.id !== productId)));
  }, [applyWholesaleRule]);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const removeByProductId = useCallback((productId: string) => {
    setCart(prev => applyWholesaleRule(prev.filter(it => it.product.id !== productId)));
  }, [applyWholesaleRule]);

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
