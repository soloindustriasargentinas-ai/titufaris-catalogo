import { useState, useMemo, useCallback, useEffect } from 'react';
import { CartItem, Product, CompanyProfile } from '../types';
import { CartToastData } from '../components/CartConfirmationToast';
import { playBeep } from '../utils/audio';

const CART_STORAGE_KEY = 'titufaris_customer_cart_v1';

export function useCart(company?: CompanyProfile) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    return [];
  });
  const [posDiscount, setPosDiscount] = useState<number>(0);
  const [cartToast, setCartToast] = useState<CartToastData | null>(null);

  const wholesaleEnabled = company?.wholesaleEnabled !== false;
  const wholesaleMinUnits = typeof company?.wholesaleMinUnits === 'number' && company.wholesaleMinUnits > 0
    ? company.wholesaleMinUnits
    : 10;

  // Guardar en almacenamiento local cada vez que cambia el carrito
  useEffect(() => {
    try {
      if (cart.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [cart]);

  const clearCartToast = useCallback(() => {
    setCartToast(null);
  }, []);

  const applyWholesaleRule = useCallback((items: CartItem[]): CartItem[] => {
    if (!wholesaleEnabled) {
      return items.map(it => ({
        ...it,
        unitPrice: it.product.retailPrice,
        priceType: 'retail' as const,
      }));
    }

    const totalQty = items.reduce((acc, it) => acc + it.quantity, 0);
    // Regla configurable: al alcanzar la cantidad mínima requerida por la empresa se activa precio mayorista
    const isWholesaleActive = totalQty >= wholesaleMinUnits;

    return items.map(it => {
      const wholesalePrice = it.product.wholesalePrice;
      const retailPrice = it.product.retailPrice;
      const unitPrice = isWholesaleActive && wholesalePrice !== undefined && wholesalePrice > 0
        ? wholesalePrice
        : retailPrice;
      return {
        ...it,
        unitPrice,
        priceType: isWholesaleActive && wholesalePrice !== undefined && wholesalePrice > 0 ? ('wholesale' as const) : ('retail' as const),
      };
    });
  }, [wholesaleEnabled, wholesaleMinUnits]);

  // Recalcular cuando cambie la configuración de mayorista de la empresa
  useEffect(() => {
    setCart(prev => {
      const recalculated = applyWholesaleRule(prev);
      const isChanged = recalculated.some((item, idx) => item.unitPrice !== prev[idx]?.unitPrice || item.priceType !== prev[idx]?.priceType);
      return isChanged ? recalculated : prev;
    });
  }, [applyWholesaleRule]);

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
