import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Send,
  CreditCard,
  Building2,
  Truck,
  PackageCheck,
  ShieldCheck,
  ChevronRight,
  Phone,
  User,
  MapPin,
  MessageCircle,
  Clock,
  CheckCircle2,
  QrCode,
} from 'lucide-react';
import { CartItem, CompanyProfile } from '../types';
import { formatCurrency } from '../utils/storage';

interface CustomerCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  company: CompanyProfile;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToOnlinePayment: () => void;
  onOpenLegalNotice?: (tab: 'terms' | 'privacy' | 'warranty') => void;
}

export const CustomerCartDrawer: React.FC<CustomerCartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  company,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onProceedToOnlinePayment,
  onOpenLegalNotice,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping');

  if (!isOpen) return null;

  const total = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Generate customized WhatsApp Order Message
  const handleSendWhatsAppOrder = () => {
    if (cart.length === 0) return;

    let text = `*SOLICITUD DE PEDIDO / PRESUPUESTO — TITUFARIS*\n`;
    text += `-------------------------------------------\n`;
    if (customerName.trim()) text += `👤 *Cliente:* ${customerName.trim()}\n`;
    if (customerPhone.trim()) text += `📱 *Teléfono:* ${customerPhone.trim()}\n`;
    if (customerLocation.trim()) text += `📍 *Destino:* ${customerLocation.trim()}\n`;
    text += `🚚 *Modalidad:* ${deliveryMethod === 'shipping' ? 'Envío a coordinar' : 'Retiro en fábrica'}\n`;
    text += `-------------------------------------------\n`;
    text += `📦 *DETALLE DE PRODUCTOS:*\n`;

    cart.forEach((item, index) => {
      const prod = item.product || (item as any);
      const name = prod.name || (item as any).name;
      const sku = prod.sku || (item as any).sku;
      const isWholesale = item.quantity >= 10 || item.priceType === 'wholesale';
      const isMadeToOrder = prod.isMadeToOrder;
      const leadTime = prod.leadTimeDays || 15;
      const deliveryStatus = isMadeToOrder
        ? ` [Fabricación a pedido: demora aprox ${leadTime} días]`
        : ' [Entrega inmediata]';
      text += `${index + 1}. *${name}* (SKU: ${sku})\n`;
      text += `   Cant: ${item.quantity} x ${formatCurrency(item.unitPrice)}${
        isWholesale ? ' [Tarifa Mayorista 10+ u.]' : ''
      } = *${formatCurrency(item.unitPrice * item.quantity)}*${deliveryStatus}\n`;
    });

    text += `-------------------------------------------\n`;
    text += `💰 *TOTAL ESTIMADO: ${formatCurrency(total)}*\n\n`;
    text += `Por favor, confírmenme disponibilidad para entrega y opciones de financiación. ¡Muchas gracias!`;

    const cleanNumber = company.phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Dark Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>Mi Carrito de Compras</span>
              {totalItems > 0 && (
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalItems} items
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">Equipamiento comercial directo de fábrica</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
                <PackageCheck className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">El carrito está vacío</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Explora el catálogo de góndolas, heladeras y mostradores para armar tu cotización.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 cursor-pointer"
              >
                Ver Catálogo
              </button>
            </div>
          ) : (
            <>
              {/* Product List */}
              <div className="space-y-3">
                {cart.map(item => {
                  const prod = item.product || (item as any);
                  const prodId = prod.id || (item as any).productId;
                  const name = prod.name || (item as any).name;
                  const sku = prod.sku || (item as any).sku;
                  const rawImg = prod.imageUrl || (item as any).imageUrl || (prod.images && prod.images[0]);
                  const imageUrl = (rawImg && typeof rawImg === 'string' && rawImg.trim() !== '')
                    ? rawImg
                    : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=80';
                  const stock = prod.stock ?? (item as any).stock ?? 99;
                  const isWholesale = item.quantity >= 10 || item.priceType === 'wholesale';
                  const wholesalePrice = prod.wholesalePrice;
                  const retailPrice = prod.retailPrice;

                  return (
                    <div
                      key={prodId}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex gap-3 items-center"
                    >
                      <img
                        src={imageUrl}
                        alt={name}
                        className="w-14 h-14 rounded-lg object-contain p-1 bg-white border border-slate-200 shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono text-slate-400 font-bold block truncate">
                            {sku}
                          </span>
                          {isWholesale ? (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                              Mayorista (10+ u.)
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded-full">
                              Minorista
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 truncate">{name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {prod.isMadeToOrder ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded-md">
                              <Clock className="w-2.5 h-2.5 text-indigo-600" />
                              <span>A pedido (~{prod.leadTimeDays || 15}d)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded-md">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Entrega inmediata</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xs font-black text-orange-600">
                            {formatCurrency(item.unitPrice)}
                          </span>
                          {!isWholesale && wholesalePrice && wholesalePrice < retailPrice && (
                            <span className="text-[9.5px] text-slate-400">
                              (Mayorista: {formatCurrency(wholesalePrice)} a partir de 10 u.)
                            </span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(prodId, item.quantity - 1)}
                              className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center hover:bg-slate-100 text-slate-600 active:bg-slate-200 cursor-pointer transition-colors"
                              title="Disminuir cantidad"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-bold text-slate-800 min-w-[24px] text-center select-none">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(prodId, item.quantity + 1)}
                              disabled={item.quantity >= stock}
                              className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center hover:bg-slate-100 text-slate-600 active:bg-slate-200 disabled:opacity-40 cursor-pointer transition-colors"
                              title="Aumentar cantidad"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="text-[11px] text-slate-500 font-medium">
                            Total: <strong className="text-slate-800">{formatCurrency(item.unitPrice * item.quantity)}</strong>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(prodId)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 active:bg-red-50 transition-colors cursor-pointer"
                        title="Quitar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Method Toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Forma de Entrega:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('shipping')}
                    className={`p-2.5 sm:p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      deliveryMethod === 'shipping'
                        ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-2xs'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Envío a obra</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`p-2.5 sm:p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      deliveryMethod === 'pickup'
                        ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-2xs'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Retiro en Fábrica</span>
                  </button>
                </div>
              </div>

              {/* Optional Contact Inputs for WhatsApp / Quote */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-700 block">
                  Tus Datos de Contacto (Opcional):
                </span>
                <div className="space-y-2">
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Nombre o Razón Social"
                      className="w-full pl-8 pr-3 py-2 text-base sm:text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-orange-500 shadow-2xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="WhatsApp / Tel."
                        className="w-full pl-8 pr-2 py-2 text-base sm:text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={customerLocation}
                        onChange={e => setCustomerLocation(e.target.value)}
                        placeholder="Ciudad / Provincia"
                        className="w-full pl-8 pr-2 py-2 text-base sm:text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer / Checkout Actions */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3 shrink-0 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
            {/* Totals Breakdown */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({totalItems} productos):</span>
                <span className="font-semibold text-slate-800">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Asesoramiento y Planos:</span>
                <span className="font-bold text-emerald-600">Bonificado</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Estimado:</span>
                <span className="text-base text-orange-600 font-extrabold">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Legal Consent Notice */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-600 leading-snug">
              Al confirmar tu pedido o pago, aceptas nuestros{' '}
              <button
                type="button"
                onClick={() => onOpenLegalNotice && onOpenLegalNotice('terms')}
                className="font-bold text-orange-600 hover:underline cursor-pointer"
              >
                Términos Comerciales
              </button>{' '}
              y el tratamiento de datos para facturación y logística según la{' '}
              <button
                type="button"
                onClick={() => onOpenLegalNotice && onOpenLegalNotice('privacy')}
                className="font-bold text-orange-600 hover:underline cursor-pointer"
              >
                Ley 25.326 de Privacidad
              </button>.
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {/* WhatsApp Checkout Button */}
              <button
                id="btn-cart-whatsapp-checkout"
                onClick={handleSendWhatsAppOrder}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Pedir Presupuesto por WhatsApp</span>
              </button>

              {/* Direct Online Payment Button */}
              <button
                id="btn-cart-online-payment"
                onClick={onProceedToOnlinePayment}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-600/25 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Pagar por Transferencia / QR / Mercado Pago</span>
              </button>

              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex items-center gap-2 text-[10.5px] text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="leading-tight">
                  <strong>Pago 100% Protegido:</strong> No ingresás ni guardamos datos de tus tarjetas en la web.
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Garantía oficial directa de fábrica Titufaris</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
