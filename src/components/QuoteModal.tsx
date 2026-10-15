import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  MessageCircle,
  Copy,
  Check,
  Building,
  UserCheck,
  Calendar,
  Truck,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  DollarSign,
  AlertCircle,
  Store,
} from 'lucide-react';
import { CartItem, CompanyProfile, User } from '../types';
import { formatCurrency } from '../utils/storage';
import { generateQuotePdf, CustomerQuoteInfo } from '../utils/quotePdf';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  company: CompanyProfile;
  currentUser?: User;
  activeBranchName?: string;
  initialDiscount?: number;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  onClose,
  cart,
  company,
  currentUser,
  activeBranchName = 'Casa Central',
  initialDiscount = 0,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'shipping'>('pickup');
  const [deliveryTerm, setDeliveryTerm] = useState('A coordinar con logística');
  const [validityDays, setValidityDays] = useState(7);
  const [discount, setDiscount] = useState(initialDiscount);
  const [notes, setNotes] = useState(
    'Presupuesto membretado oficial sujeto a disponibilidad de stock. Reserva confirmada contra acreditación de seña del 50%. Precios con IVA incluido.'
  );
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastQuoteCode, setLastQuoteCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalUnits = cart.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = cart.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const quoteInfo: CustomerQuoteInfo = {
    name: customerName.trim() || 'Cliente / Consumidor Final',
    phone: customerPhone.trim(),
    email: customerEmail.trim(),
    taxId: customerTaxId.trim(),
    location: customerLocation.trim(),
    deliveryMethod,
    deliveryTerm: deliveryMethod === 'shipping' ? deliveryTerm : 'Retiro en sucursal',
    validityDays,
    sellerName: currentUser?.name || 'Asesor Comercial',
    branchName: activeBranchName,
    discountPercentage: discount,
    notes,
  };

  const handleDownloadPdf = () => {
    if (cart.length === 0) return;
    setIsGenerating(true);
    try {
      const code = generateQuotePdf(cart, company, quoteInfo);
      setLastQuoteCode(code);
    } finally {
      setIsGenerating(false);
    }
  };

  const buildWhatsAppText = () => {
    const quoteCode = lastQuoteCode || `COT-${Date.now().toString().slice(-6)}`;
    const lineBreak = '\n';
    let text = `📄 *PRESUPUESTO MEMBRETADO OFICIAL*${lineBreak}`;
    text += `*${company.name.toUpperCase()}* - Equipamiento y Ventas${lineBreak}`;
    text += `───────────────────────${lineBreak}`;
    text += `🔢 *Cotización N°:* ${quoteCode}${lineBreak}`;
    text += `👤 *Cliente:* ${quoteInfo.name}${lineBreak}`;
    if (quoteInfo.taxId) text += `🆔 *CUIT/DNI:* ${quoteInfo.taxId}${lineBreak}`;
    text += `📅 *Validez comercial:* ${validityDays} días corridos${lineBreak}`;
    text += `🏢 *Sucursal:* ${activeBranchName}${lineBreak}`;
    text += `💼 *Atendido por:* ${quoteInfo.sellerName}${lineBreak}`;
    text += `───────────────────────${lineBreak}`;
    text += `🛒 *DETALLE DE ARTÍCULOS:*${lineBreak}`;

    cart.forEach((it, idx) => {
      const name = it.product.name;
      const totalItem = it.unitPrice * it.quantity;
      text += `${idx + 1}. ${name} x${it.quantity} = ${formatCurrency(totalItem)}${lineBreak}`;
    });

    text += `───────────────────────${lineBreak}`;
    text += `📊 *Subtotal:* ${formatCurrency(subtotal)}${lineBreak}`;
    if (discount > 0) {
      text += `🏷️ *Descuento comercial (${discount}%):* -${formatCurrency(discountAmount)}${lineBreak}`;
    }
    text += `💰 *TOTAL FINAL:* ${formatCurrency(finalTotal)}${lineBreak}`;
    text += `───────────────────────${lineBreak}`;
    text += `📦 *Modalidad de entrega:* ${deliveryMethod === 'shipping' ? `Envío (${deliveryTerm})` : 'Retiro en sucursal'}${lineBreak}`;

    if (company.bankAccount?.alias || company.bankAccount?.cbu) {
      text += `🏦 *DATOS DE TRANSFERENCIA:*${lineBreak}`;
      if (company.bankAccount.bank) text += `• Banco: ${company.bankAccount.bank}${lineBreak}`;
      if (company.bankAccount.alias) text += `• Alias CBU: ${company.bankAccount.alias}${lineBreak}`;
      if (company.bankAccount.cbu) text += `• CBU: ${company.bankAccount.cbu}${lineBreak}`;
      if (company.bankAccount.holder) text += `• Titular: ${company.bankAccount.holder}${lineBreak}`;
    }

    text += `───────────────────────${lineBreak}`;
    text += `Para confirmar este presupuesto y reservar stock con seña del 50%, responda a este mensaje con su comprobante. ¡Muchas gracias!`;

    return text;
  };

  const handleSendWhatsApp = () => {
    if (cart.length === 0) return;
    // 1. Generate PDF
    handleDownloadPdf();

    // 2. Open WhatsApp
    const message = buildWhatsAppText();
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopySummary = () => {
    const text = buildWhatsAppText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Membretado */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-orange-500/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Emitir Presupuesto Membretado
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-400/30">
                  OFICIAL PDF
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {company.name} • Membrete institucional con CUIT, datos bancarios y validez comercial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Banner: Emisor & Sucursal */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Store className="w-4 h-4 text-orange-600 shrink-0" />
              <span>
                <strong>Emisión:</strong> {company.legalName || company.name} (CUIT: {company.taxId || 'CUIT a designar'})
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <strong>Sucursal:</strong> {activeBranchName}
              </span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <strong>Vendedor:</strong> {currentUser?.name || 'Venta Central'}
              </span>
            </div>
          </div>

          {/* Form Grid: Cliente / Destinatario */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-orange-600" />
              <span>Datos del Destinatario (Cliente / Razón Social)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Nombre / Empresa */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nombre / Razón Social *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Ej: Distribuidora Norte S.R.L. / Juan Pérez"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none"
                />
              </div>

              {/* CUIT / DNI */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  CUIT / CUIL / DNI
                </label>
                <input
                  type="text"
                  value={customerTaxId}
                  onChange={e => setCustomerTaxId(e.target.value)}
                  placeholder="Ej: 30-71234567-8 o 20-35894123-4"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none"
                />
              </div>

              {/* Teléfono / WhatsApp */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Ej: 11 4455-6677 / +54 9 11..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none"
                />
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email de Contacto
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="compras@cliente.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none"
                />
              </div>

              {/* Dirección / Destino */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Destino / Localidad
                </label>
                <input
                  type="text"
                  value={customerLocation}
                  onChange={e => setCustomerLocation(e.target.value)}
                  placeholder="Ej: Av. Rivadavia 4500, CABA"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none"
                />
              </div>

              {/* Plazo de Validez */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Plazo de Validez Comercial
                </label>
                <select
                  value={validityDays}
                  onChange={e => setValidityDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
                >
                  <option value={3}>3 días corridos</option>
                  <option value={7}>7 días corridos (Recomendado)</option>
                  <option value={15}>15 días corridos</option>
                  <option value={30}>30 días corridos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modalidad de Entrega */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Modalidad de Entrega
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    deliveryMethod === 'pickup'
                      ? 'bg-orange-50 border-orange-500 text-orange-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Retiro en Local</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('shipping')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    deliveryMethod === 'shipping'
                      ? 'bg-orange-50 border-orange-500 text-orange-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Envío / Flete</span>
                </button>
              </div>
            </div>

            {deliveryMethod === 'shipping' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Plazo / Empresa de Flete
                </label>
                <input
                  type="text"
                  value={deliveryTerm}
                  onChange={e => setDeliveryTerm(e.target.value)}
                  placeholder="Ej: Despacho en 48hs vía Expreso / Flete propio"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Cart Items Table Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-orange-600" />
                <span>Artículos en el Presupuesto ({cart.length} ítems • {totalUnits} unidades)</span>
              </h3>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Producto</th>
                    <th className="py-2 px-2 text-center">SKU</th>
                    <th className="py-2 px-2 text-center">Cant.</th>
                    <th className="py-2 px-2 text-right">P. Unitario</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {cart.map((it, idx) => {
                    const lineTot = it.unitPrice * it.quantity;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {it.product.name}
                          {it.priceType === 'wholesale' && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                              Mayorista
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-500 font-mono text-[11px]">
                          {it.product.sku || '-'}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-slate-800">
                          {it.quantity}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-600">
                          {formatCurrency(it.unitPrice)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(lineTot)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Descuento y Totales */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Descuento Comercial Especial
              </label>
              <div className="flex gap-1.5">
                {[0, 5, 10, 15, 20, 25].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiscount(d)}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      discount === d
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {d === 0 ? '0%' : `-${d}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-xs md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-200">
              <div className="flex justify-between md:justify-end gap-4 text-slate-600">
                <span>Subtotal de ítems:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between md:justify-end gap-4 text-emerald-600 font-bold">
                  <span>Descuento aplicado ({discount}%):</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between md:justify-end gap-4 text-base font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Presupuestado:</span>
                <span className="text-orange-600">{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </div>

          {/* Observaciones Comerciales */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Observaciones & Condiciones de Pago
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Membrete oficial con validez jurídica y bancaria</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Copiar texto formateado para pegar en chat o correo"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Descarga el PDF membretado y abre WhatsApp con el cliente"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-md shadow-orange-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PDF Membretado</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
