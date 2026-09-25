import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Search, Tag, Barcode, Check, AlertCircle } from 'lucide-react';
import { Product, Category, CartItem, User, CompanyProfile } from '../types';
import { formatCurrency } from '../utils/storage';
import { playBeep } from '../utils/audio';

interface POSViewProps {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  company: CompanyProfile;
  currentUser: User;
  onAddToCart: (product: Product, priceType?: 'retail' | 'wholesale') => void;
  onUpdateCartQty: (productId: string, qty: number) => void;
  onRemoveCartItem: (productId: string) => void;
  onClearCart: () => void;
  onOpenCheckout: (discount: number) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  categories,
  cart,
  company,
  currentUser,
  onAddToCart,
  onUpdateCartQty,
  onRemoveCartItem,
  onClearCart,
  onOpenCheckout,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceType, setPriceType] = useState<'retail' | 'wholesale'>('retail');
  const [discount, setDiscount] = useState<number>(0);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const q = search.toLowerCase().trim();
    const matchQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.includes(q);
    return matchCat && matchQuery;
  });

  const subtotal = cart.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = Math.max(0, subtotal - discountAmount);

  const handleSimulateScan = () => {
    // Pick first available in-stock product to simulate rapid laser scan
    const sample = products.find(p => p.stock > 0);
    if (sample) {
      playBeep();
      onAddToCart(sample, priceType);
      setScanMessage(`¡Escaneado!: ${sample.name} (${sample.sku})`);
      setTimeout(() => setScanMessage(null), 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 sm:p-6 min-h-[calc(100vh-80px)]">
      {/* Products Selection Area */}
      <div className="flex-1 flex flex-col min-w-0 space-y-4">
        {/* Top Controls: Search, Scan, Price Mode */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por artículo, SKU o código de barras..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
              />
            </div>

            {/* Price Type Switcher & Laser Scan */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setPriceType('retail')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    priceType === 'retail'
                      ? 'bg-white text-orange-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Minorista
                </button>
                <button
                  onClick={() => setPriceType('wholesale')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    priceType === 'wholesale'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mayorista
                </button>
              </div>

              <button
                onClick={handleSimulateScan}
                title="Simular escáner láser de código de barras"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                <Barcode className="w-4 h-4 text-orange-400" />
                <span className="hidden sm:inline">Escanear</span>
              </button>
            </div>
          </div>

          {/* Scanner toast alert */}
          {scanMessage && (
            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{scanMessage}</span>
            </div>
          )}

          {/* Categories Horizontal Pills (Touch friendly for tablets) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Todos</span>
              <span className="text-[10px] font-mono opacity-80">({products.length})</span>
            </button>
            {categories.map(c => {
              const count = products.filter(p => p.category === c.id).length;
              const isSel = selectedCategory === c.id;
              const catColor = c.color || '#F97316';
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  style={
                    isSel
                      ? { backgroundColor: catColor, color: '#ffffff' }
                      : { borderColor: `${catColor}40` }
                  }
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSel
                      ? 'shadow-xs border-transparent'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                    style={{
                      backgroundColor: isSel ? '#ffffff' : catColor,
                    }}
                  />
                  <span>{c.name}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSel ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid for Tablet Touch Tapping */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 flex-1 overflow-y-auto">
          {filteredProducts.map(p => {
            const isOutOfStock = p.stock <= 0;
            const price = priceType === 'wholesale' ? p.wholesalePrice : p.retailPrice;
            const cat = categories.find(c => c.id === p.category);
            const catColor = cat?.color || '#F97316';

            return (
              <div
                key={p.id}
                onClick={() => {
                  if (!isOutOfStock) {
                    playBeep();
                    onAddToCart(p, priceType);
                  }
                }}
                className={`bg-white rounded-xl border p-3 flex flex-col justify-between transition-all select-none relative ${
                  isOutOfStock
                    ? 'opacity-60 border-slate-200 cursor-not-allowed'
                    : 'border-slate-200 hover:border-orange-400 hover:shadow-md cursor-pointer active:scale-98'
                }`}
              >
                {/* Photo */}
                <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 p-1.5 flex items-center justify-center mb-2">
                  <img
                    src={
                      (p.images && p.images.length > 0 && p.images[0] && p.images[0].trim() !== '')
                        ? p.images[0]
                        : (p.imageUrl && p.imageUrl.trim() !== '')
                        ? p.imageUrl
                        : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80'
                    }
                    alt={p.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80';
                    }}
                  />
                  <span className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-sm">
                    {p.sku}
                  </span>
                  <span
                    className={`absolute bottom-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                      p.stock <= p.minStock
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-900/70 text-white'
                    }`}
                  >
                    Stk: {p.stock}
                  </span>
                </div>

                {/* Category Badge & Title */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: catColor }}
                    />
                    <span
                      className="text-[10px] font-bold truncate"
                      style={{ color: catColor }}
                    >
                      {cat?.name || p.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 line-clamp-2 leading-tight">
                    {p.name}
                  </h4>
                </div>

                {/* Price & Touch Button */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-sm font-black text-orange-600">
                    {formatCurrency(price)}
                  </div>
                  <span className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs">
                    +
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POS Cart / Order Summary Ticket (Tablet Right Column) */}
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-lg flex flex-col shrink-0 max-h-[85vh] lg:sticky lg:top-24">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-sm">Ticket de Venta en Curso</h3>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
            {cart.reduce((acc, it) => acc + it.quantity, 0)} items
          </span>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-8">
              <ShoppingCart className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
              <p className="font-semibold text-xs text-slate-600">El carrito está vacío</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Toque cualquier producto del catálogo para añadir al ticket
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.product.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-slate-200 px-1 rounded-sm text-slate-700">
                      {item.product.sku}
                    </span>
                    <span className="text-[10px] text-orange-600 font-bold uppercase">
                      {item.priceType === 'wholesale' ? 'May.' : 'Min.'}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 truncate mt-0.5">
                    {item.product.name}
                  </h4>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {formatCurrency(item.unitPrice)} c/u
                  </div>
                </div>

                {/* Stepper with 44px hit-target for tablets */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateCartQty(item.product.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-bold text-xs text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateCartQty(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveCartItem(item.product.id)}
                    className="w-8 h-8 ml-1 rounded-lg text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Calculation & Checkout */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl space-y-3">
          {/* Quick Discount Selector */}
          <div>
            <span className="text-[11px] font-bold text-slate-600 block mb-1">
              Descuento Comercial
            </span>
            <div className="flex gap-1.5">
              {[0, 5, 10, 15, 20].map(d => (
                <button
                  key={d}
                  onClick={() => setDiscount(d)}
                  className={`flex-1 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                    discount === d
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {d === 0 ? 'Sin desc.' : `-${d}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Subtotal & Total */}
          <div className="space-y-1 text-xs pt-1 border-t border-slate-200">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Descuento ({discount}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 pt-1">
              <span>Total a Cobrar</span>
              <span className="text-orange-600">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                title="Vaciar carrito"
                className="px-3 py-3 rounded-xl border border-slate-300 text-slate-500 hover:text-red-600 hover:bg-white text-xs font-semibold cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => onOpenCheckout(discount)}
              disabled={cart.length === 0}
              className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:hover:bg-orange-600"
            >
              <CreditCard className="w-4 h-4" />
              <span>Cobrar Venta ({formatCurrency(total)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
