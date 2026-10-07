import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  ArrowRightLeft,
  Banknote,
  CheckCircle2,
  Printer,
  Copy,
  Check,
  Upload,
  FileText,
  AlertCircle,
  Truck,
  Building2,
  Clock,
  ShieldCheck,
  Send,
  MessageCircle,
  Phone,
  HelpCircle,
  ExternalLink,
  Smartphone,
  Lock,
  Fingerprint,
  FileCheck2,
  Zap,
  ChevronDown,
  Shield
} from 'lucide-react';
import QRCode from 'qrcode';
import { CartItem, CompanyProfile, PaymentMethod, Sale, User as UserType } from '../types';
import { formatCurrency } from '../utils/storage';
import { playSuccessChime } from '../utils/audio';
import { normalizeMercadoPagoUrl } from '../utils/qrCode';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  subtotal: number;
  discount: number;
  company: CompanyProfile;
  currentUser: UserType;
  isPublicStore?: boolean;
  onCompleteSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => void;
  onClearCart: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  cart,
  total,
  subtotal,
  discount,
  company,
  currentUser,
  isPublicStore = false,
  onCompleteSale,
  onClearCart,
}) => {
  // Method selection: For public store, bank_transfer is default & only direct method
  const [method, setMethod] = useState<PaymentMethod>(isPublicStore ? 'bank_transfer' : 'mercadopago_qr');
  
  // Customer & Invoicing Data
  const [customerDoc, setCustomerDoc] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [taxPayerType, setTaxPayerType] = useState<'consumidor_final' | 'responsable_inscripto' | 'monotributo' | 'exento'>('consumidor_final');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  // Delivery details
  const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliverySchedule, setDeliverySchedule] = useState('');
  const [notes, setNotes] = useState('');

  // Transfer Proof & Reference
  const [transferRef, setTransferRef] = useState('');
  const [transferProofFile, setTransferProofFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedCbu, setCopiedCbu] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [digitalPayTab, setDigitalPayTab] = useState<'alias' | 'mercadopago'>('alias');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showPaymentAdvantages, setShowPaymentAdvantages] = useState(false);

  // Admin POS fields
  const [cashReceived, setCashReceived] = useState<number>(total);
  const [cardInstallments, setCardInstallments] = useState(1);

  // States
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync cashReceived if total changes
  useEffect(() => {
    setCashReceived(total);
  }, [total]);

  // If in public store, force bank_transfer
  useEffect(() => {
    if (isPublicStore) {
      setMethod('bank_transfer');
    }
  }, [isPublicStore]);

  // Generate Payment QR:
  // Points to official Mercado Pago Payment Link or deep URL that Mercado Pago, Naranja X,
  // and all smartphone cameras can read without "código inválido" rejection.
  useEffect(() => {
    if (!isOpen) return;

    const mpLink = normalizeMercadoPagoUrl(company.bankAccount.mercadoPagoLink);

    QRCode.toDataURL(mpLink, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then(setQrCodeDataUrl)
      .catch((err) => {
        console.error('Error generating transfer QR:', err);
      });
  }, [isOpen, company.bankAccount.mercadoPagoLink]);

  if (!isOpen) return null;

  const change = Math.max(0, cashReceived - total);

  const handleCopy = (text: string, type: 'alias' | 'cbu' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'alias') {
      setCopiedAlias(true);
      setTimeout(() => setCopiedAlias(false), 2000);
    } else if (type === 'cbu') {
      setCopiedCbu(true);
      setTimeout(() => setCopiedCbu(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('El archivo del comprobante no debe superar los 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setTransferProofFile({
        name: file.name,
        dataUrl: uploadEvent.target?.result as string,
      });
      setFormError(null);
    };
    reader.readAsDataURL(file);
  };

  // WhatsApp ticket sender helper
  const handleSendTicketViaWhatsApp = () => {
    const cleanNumber = company.phone.replace(/[^0-9]/g, '');
    let msg = `*COMPROBANTE DE PAGO POR TRANSFERENCIA — TITUFARIS*\n`;
    msg += `-----------------------------------------\n`;
    msg += `👤 *Cliente:* ${customerName || 'Cliente Web'}\n`;
    msg += `📄 *CUIT / DNI:* ${customerDoc || 'No especificado'}\n`;
    msg += `🏢 *Condición IVA:* ${taxPayerType.replace('_', ' ').toUpperCase()}\n`;
    msg += `📱 *Teléfono:* ${customerPhone || 'No especificado'}\n`;
    if (deliveryMethod === 'shipping' && deliveryAddress) {
      msg += `📍 *Domicilio Entrega:* ${deliveryAddress}\n`;
      if (deliverySchedule) msg += `⏰ *Días/Horarios:* ${deliverySchedule}\n`;
    } else {
      msg += `🏬 *Modalidad:* Retiro en Fábrica\n`;
    }
    if (transferRef) {
      msg += `🔢 *N° Transf / Comprobante:* ${transferRef}\n`;
    }
    msg += `💰 *Monto Transferido:* ${formatCurrency(total)}\n`;
    msg += `-----------------------------------------\n`;
    msg += `📦 *Detalle del pedido:*\n`;
    cart.forEach((it, idx) => {
      msg += `${idx + 1}. ${it.product.name} (x${it.quantity}) - ${formatCurrency(it.unitPrice * it.quantity)}\n`;
    });
    msg += `-----------------------------------------\n`;
    msg += `Adjunto a continuación la captura del comprobante bancario para su verificación y despacho. ¡Muchas gracias!`;

    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const handleProcessPayment = () => {
    // Basic validation in public store mode
    if (isPublicStore) {
      if (!customerName.trim()) {
        setFormError('Por favor ingrese su Nombre o Razón Social.');
        return;
      }
      if (!customerDoc.trim()) {
        setFormError('Por favor ingrese su CUIT o DNI para la facturación.');
        return;
      }
      if (!customerPhone.trim()) {
        setFormError('Por favor ingrese un Teléfono o WhatsApp de contacto.');
        return;
      }
      if (deliveryMethod === 'shipping' && !deliveryAddress.trim()) {
        setFormError('Por favor ingrese el domicilio completo de entrega.');
        return;
      }
    }

    setFormError(null);
    setIsProcessing(true);

    setTimeout(() => {
      const receiptNumber = `TF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const saleData = {
        receiptNumber,
        items: cart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.unitPrice * item.quantity,
        })),
        subtotal,
        discountPercentage: discount,
        discountAmount: (subtotal * discount) / 100,
        taxPercentage: 21,
        taxAmount: total * 0.21,
        total,
        paymentMethod: method,
        amountPaid: method === 'cash' ? cashReceived : total,
        changeGiven: method === 'cash' ? change : 0,
        paymentStatus: 'completed' as const,
        customerName: customerName.trim() || 'Consumidor Final',
        customerDoc: customerDoc.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        taxPayerType,
        deliveryAddress: deliveryMethod === 'shipping' ? deliveryAddress.trim() : 'Retiro en Fábrica',
        deliverySchedule: deliverySchedule.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        transferProofUrl: transferProofFile?.dataUrl || undefined,
        transferProofName: transferProofFile?.name || undefined,
        cashierId: currentUser.id,
        cashierName: isPublicStore ? 'Tienda Online' : currentUser.name,
        notes: [
          notes.trim(),
          transferRef ? `Ref. Transf: ${transferRef}` : '',
          deliverySchedule ? `Horario de entrega: ${deliverySchedule}` : ''
        ].filter(Boolean).join(' | ') || undefined,
      };

      playSuccessChime();
      onCompleteSale(saleData);

      setCompletedSale({
        id: 'sale-' + Date.now(),
        createdAt: new Date().toISOString(),
        ...saleData,
      });

      setIsProcessing(false);
      onClearCart();
    }, 900);
  };

  const handlePrintReceipt = () => {
    if (!completedSale) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprobante de Pedido - ${completedSale.receiptNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; max-width: 480px; margin: 0 auto; color: #1e293b; font-size: 13px; line-height: 1.4; }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 16px; }
            .brand { font-size: 18px; font-weight: 800; color: #0f172a; }
            .badge { display: inline-block; background: #ea580c; color: #fff; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; margin-top: 4px; }
            .section { margin: 12px 0; padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            .section-title { font-weight: bold; color: #0f172a; margin-bottom: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            .items { width: 100%; border-collapse: collapse; margin: 12px 0; }
            .items th { text-align: left; padding: 6px 0; border-bottom: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #64748b; }
            .items td { padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
            .items td.num { text-align: right; font-weight: 600; }
            .total { border-top: 2px dashed #cbd5e1; border-bottom: 2px dashed #cbd5e1; padding: 10px 0; margin: 14px 0; font-size: 16px; font-weight: 900; color: #0f172a; display: flex; justify-content: space-between; }
            .footer { text-align: center; margin-top: 18px; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">${company.name.toUpperCase()}</div>
            <div class="badge">ORDEN DE COMPRA / FACTURACIÓN</div>
            <div style="margin-top: 6px; color: #64748b;">${company.tagline}</div>
            <div>CUIT: ${company.taxId}</div>
            <div>${company.address}</div>
            <div style="margin-top: 8px; font-weight: bold; color: #0f172a;">COMPROBANTE N° ${completedSale.receiptNumber}</div>
            <div style="font-size: 11px; color: #64748b;">${new Date(completedSale.createdAt).toLocaleString('es-AR')}</div>
          </div>

          <div class="section">
            <div class="section-title">Datos del Cliente y Facturación</div>
            <div><strong>Nombre/Razón Social:</strong> ${completedSale.customerName}</div>
            ${completedSale.customerDoc ? `<div><strong>CUIT/DNI:</strong> ${completedSale.customerDoc}</div>` : ''}
            ${completedSale.taxPayerType ? `<div><strong>Condición IVA:</strong> ${completedSale.taxPayerType.replace('_', ' ').toUpperCase()}</div>` : ''}
            ${completedSale.customerPhone ? `<div><strong>Contacto:</strong> ${completedSale.customerPhone}</div>` : ''}
            ${completedSale.deliveryAddress ? `<div><strong>Entrega:</strong> ${completedSale.deliveryAddress}</div>` : ''}
            ${completedSale.deliverySchedule ? `<div><strong>Horario acordado:</strong> ${completedSale.deliverySchedule}</div>` : ''}
          </div>

          <table class="items">
            <thead>
              <tr><th>Cant</th><th>Descripción</th><th style="text-align: right;">Total</th></tr>
            </thead>
            <tbody>
              ${completedSale.items.map(it => `
                <tr>
                  <td style="width: 40px; font-weight: bold;">${it.quantity}x</td>
                  <td>${it.name}</td>
                  <td class="num">$${it.subtotal.toLocaleString('es-AR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            <span>TOTAL:</span>
            <span>$${completedSale.total.toLocaleString('es-AR')}</span>
          </div>

          <div class="section">
            <div class="section-title">Información de Pago</div>
            <div><strong>Medio:</strong> ${completedSale.paymentMethod === 'bank_transfer' ? 'Transferencia Bancaria' : completedSale.paymentMethod.toUpperCase()}</div>
            <div><strong>Alias receptor:</strong> ${company.bankAccount.alias}</div>
            <div><strong>Estado:</strong> ${completedSale.paymentStatus === 'completed' ? 'Confirmado' : 'Pendiente de verificación'}</div>
          </div>

          <div class="footer">
            ¡Muchas gracias por equipar su negocio con Titufaris!<br/>
            ${company.phone} • ${company.email}<br/>
            ${company.website}
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">
                {completedSale
                  ? 'Pedido & Pago Registrado'
                  : isPublicStore
                  ? 'Pago Seguro por Transferencia Bancaria'
                  : 'Terminal de Cobro & Facturación'}
              </h2>
              <p className="text-xs text-slate-400">
                {completedSale
                  ? `Comprobante ${completedSale.receiptNumber}`
                  : isPublicStore
                  ? 'Escanée el QR o use el Alias para abonar al instante'
                  : 'Punto de Venta Titufaris'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {completedSale ? (
          /* SUCCESS VIEW */
          <div className="p-6 text-center space-y-6 overflow-y-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-0.5 rounded-full mb-2">
                Operación Exitosa
              </span>
              <h3 className="text-3xl font-black text-slate-900">
                {formatCurrency(completedSale.total)}
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Comprobante N° <span className="font-mono text-slate-800">{completedSale.receiptNumber}</span> emitido correctamente
              </p>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2.5">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Titular / Razón Social:</span>
                <span className="font-bold text-slate-900">{completedSale.customerName}</span>
              </div>
              {completedSale.customerDoc && (
                <div className="flex justify-between">
                  <span className="text-slate-500">CUIT / DNI:</span>
                  <span className="font-mono font-semibold text-slate-800">{completedSale.customerDoc}</span>
                </div>
              )}
              {completedSale.taxPayerType && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Condición Impositiva:</span>
                  <span className="font-semibold text-slate-800 uppercase">{completedSale.taxPayerType.replace('_', ' ')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Modalidad de Pago:</span>
                <span className="font-semibold text-orange-600 font-medium">
                  {completedSale.paymentMethod === 'bank_transfer' ? 'Transferencia Bancaria Directa' : completedSale.paymentMethod.toUpperCase()}
                </span>
              </div>
              {completedSale.deliveryAddress && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Entrega / Despacho:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[65%]">{completedSale.deliveryAddress}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Artículos pedidos:</span>
                <span className="font-bold text-slate-900">
                  {completedSale.items.reduce((acc, it) => acc + it.quantity, 0)} unidades
                </span>
              </div>
            </div>

            {/* Next Steps Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 text-left flex items-start gap-2.5">
              <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">¿Qué ocurre ahora con tu pedido?</strong>
                Un asesor de Titufaris verificará la acreditación de la transferencia y se comunicará a tu teléfono o WhatsApp para coordinar el despacho o entrega de tus equipos.
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handlePrintReceipt}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 text-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                Imprimir Comprobante
              </button>

              <button
                onClick={handleSendTicketViaWhatsApp}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                Avisar por WhatsApp
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cerrar y continuar navegando
            </button>
          </div>
        ) : (
          /* PAYMENT & CHECKOUT VIEW */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Amount Banner */}
            <div className="bg-orange-50/80 border border-orange-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-extrabold text-orange-800 uppercase tracking-wider">
                  Total a Transferir
                </span>
                <div className="text-3xl font-black text-orange-600 tracking-tight">
                  {formatCurrency(total)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(total.toString(), 'amount')}
                  className="px-3 py-1.5 bg-white border border-orange-200 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAmount ? 'Monto Copiado' : 'Copiar Monto'}</span>
                </button>
                <div className="text-right text-xs text-slate-500 hidden sm:block">
                  <div>Subtotal: {formatCurrency(subtotal)}</div>
                  {discount > 0 && <div className="text-emerald-600 font-bold">Desc: -{discount}%</div>}
                  <div>{cart.reduce((acc, it) => acc + it.quantity, 0)} productos</div>
                </div>
              </div>
            </div>

            {/* Method Selector (Only shown if admin staff wants to change to cash or card) */}
            {!isPublicStore && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Seleccione Medio de Cobro (POS Interno)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'bank_transfer', label: 'Transferencia', icon: ArrowRightLeft },
                    { id: 'mercadopago_qr', label: 'QR Mercado Pago', icon: QrCode },
                    { id: 'credit_card', label: 'Tarjeta Crédito', icon: CreditCard },
                    { id: 'debit_card', label: 'Tarjeta Débito', icon: CreditCard },
                    { id: 'cash', label: 'Efectivo', icon: Banknote },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = method === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMethod(item.id as PaymentMethod)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold cursor-pointer ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500/10 text-orange-700 ring-2 ring-orange-500/20 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                        <span className="text-[11px] text-center leading-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------- BLOQUE DE VENTAJAS Y SEGURIDAD DEL PAGO ---------------- */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 sm:p-4 space-y-3 shadow-2xs">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex items-start sm:items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                      <span>¿Por qué este método de pago es más seguro y ventajoso para vos?</span>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                        100% Protegido
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Operación directa, sin intermediarios riesgosos y con total respaldo bancario.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentAdvantages(!showPaymentAdvantages)}
                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer bg-white hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors shrink-0 shadow-2xs"
                >
                  <span>{showPaymentAdvantages ? 'Ocultar' : 'Ver ventajas'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showPaymentAdvantages ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Badges rápidos destacados siempre visibles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-2xs">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-slate-800 block leading-tight">
                      Cero datos de tarjetas
                    </span>
                    <span className="text-[9px] text-slate-500 block leading-tight">
                      No los pedimos ni guardamos
                    </span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-2xs">
                  <Fingerprint className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-slate-800 block leading-tight">
                      Validación biométrica
                    </span>
                    <span className="text-[9px] text-slate-500 block leading-tight">
                      Autorizás con huella o PIN
                    </span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-2xs">
                  <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-slate-800 block leading-tight">
                      Sin cobros fantasma
                    </span>
                    <span className="text-[9px] text-slate-500 block leading-tight">
                      Cero suscripciones ocultas
                    </span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-2xs">
                  <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-slate-800 block leading-tight">
                      Comprobante legal
                    </span>
                    <span className="text-[9px] text-slate-500 block leading-tight">
                      Respaldo BCRA / AFIP
                    </span>
                  </div>
                </div>
              </div>

              {/* Desglose detallado explicativo */}
              {showPaymentAdvantages && (
                <div className="pt-2.5 border-t border-emerald-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs animate-in fade-in duration-200">
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-100 space-y-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>1. Privacidad y Seguridad Absoluta</span>
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      No ingresás tus números de tarjeta, vencimientos ni código de seguridad (CVV) en este sitio web. La transacción ocurre enteramente dentro del entorno blindado de tu propio banco o de Mercado Pago.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-emerald-100 space-y-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>2. Cero Riesgo de Clonación o Cargos No Reconocidos</span>
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Al no quedar tus credenciales bancarias archivadas en servidores web de comercio electrónico, eliminás por completo el riesgo de hackeos, suscripciones automáticas o débitos recurrentes sorpresa.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-emerald-100 space-y-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Fingerprint className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>3. Control Total en tus Manos</span>
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Nadie puede debitar dinero sin tu consentimiento expreso. Vos decidís e ingresás el monto exacto y lo autorizás con tu propia huella digital, Face ID o token de seguridad personal.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-emerald-100 space-y-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>4. Comprobante Oficial e Inalterable</span>
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Cada transferencia genera un comprobante electrónico auditado por el Banco Central de la República Argentina (BCRA) con número de operación, CUIT y razón social de Titufaris, asegurando tu factura y garantía de fábrica.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-emerald-100 space-y-1 sm:col-span-2">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>5. Sin Comisiones Extra y Despacho Prioritario</span>
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      El pago por transferencia es 100% gratuito para el comprador (sin sobreprecios de comisiones bancarias). Al acreditarse de inmediato, tu pedido entra sin demoras a la cola de armado y logística en fábrica.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ---------------- SECTION 1: INSTRUCCIONES DE PAGO Y TRANSFERENCIA ---------------- */}
            {method === 'bank_transfer' && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-black text-xs flex items-center justify-center">
                      1
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Aboná tu Pedido ({formatCurrency(total)})
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Acreditación Inmediata
                  </span>
                </div>

                {/* Sub-selector tabs: Transferencia Alias/CBU vs Mercado Pago Oficial */}
                <div className="flex p-1 bg-slate-200/80 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setDigitalPayTab('alias')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      digitalPayTab === 'alias'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-orange-600" />
                    <span>Transferencia (Mercado Pago, Naranja X, Bancos)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDigitalPayTab('mercadopago')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      digitalPayTab === 'mercadopago'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-sky-600" />
                    <span>Mercado Pago (Link / QR Oficial)</span>
                  </button>
                </div>

                {digitalPayTab === 'alias' ? (
                  /* TAB 1: TRANSFERENCIA DIRECTA POR ALIAS / CBU */
                  <div className="space-y-3.5">
                    {/* Alerta explicativa Mercado Pago / Naranja X */}
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-amber-950">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>¿Vas a transferir desde Mercado Pago o Naranja X?</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Los lectores de QR de Mercado Pago y Naranja X rechazan códigos de texto bancarios. 
                        <strong> Para transferir gratis y al instante:</strong> abrí tu app, tocá <strong>"Transferir"</strong> ➔ <strong>"Con Alias, CBU o CVU"</strong> y pegá el Alias oficial copiado abajo.
                      </p>
                    </div>

                    {/* Account Data & Copy Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Alias Block */}
                      <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Alias para Transferir</span>
                          <span className="font-mono text-sm font-black text-orange-600 select-all truncate block">
                            {company.bankAccount.alias}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(company.bankAccount.alias, 'alias')}
                          className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          {copiedAlias ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedAlias ? '¡Copiado!' : 'Copiar Alias'}</span>
                        </button>
                      </div>

                      {/* Monto Block */}
                      <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Monto Exacto a Transferir</span>
                          <span className="font-mono text-sm font-black text-slate-900 select-all block">
                            {formatCurrency(total)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(total.toString(), 'amount')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedAmount ? '¡Copiado!' : 'Copiar Monto'}</span>
                        </button>
                      </div>

                      {/* CBU Block */}
                      <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between sm:col-span-2 shadow-2xs">
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">CBU / CVU Bancario</span>
                          <span className="font-mono text-xs font-bold text-slate-800 break-all select-all">
                            {company.bankAccount.cbu}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(company.bankAccount.cbu, 'cbu')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          {copiedCbu ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCbu ? '¡Copiado!' : 'Copiar CBU'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Titular y Banco */}
                    <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
                      <div><strong>Titular:</strong> {company.bankAccount.holder || company.name}</div>
                      <div><strong>Banco:</strong> {company.bankAccount.bank}</div>
                      <div><strong>CUIT:</strong> {company.taxId}</div>
                    </div>

                    {/* Botones de apps para móvil */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-500 font-medium">Accesos rápidos:</span>
                      <a
                        href="https://www.mercadopago.com.ar"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>Abrir Mercado Pago</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <a
                        href="https://www.naranjax.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>Abrir Naranja X</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  /* TAB 2: MERCADO PAGO OFICIAL (LINK Y QR) */
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-5 flex flex-col items-center justify-center text-center">
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
                          {qrCodeDataUrl ? (
                            <img
                              src={qrCodeDataUrl}
                              alt="QR Oficial Mercado Pago"
                              className="w-44 h-44 object-contain rounded-lg"
                            />
                          ) : (
                            <div className="w-44 h-44 bg-slate-100 flex items-center justify-center rounded-lg animate-pulse">
                              <QrCode className="w-12 h-12 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-700 mt-2 font-bold flex items-center gap-1 justify-center">
                          <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                          <span>Escanear con la CÁMARA del celular</span>
                        </p>
                      </div>

                      <div className="md:col-span-7 space-y-3 text-left">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                            Pasarela Oficial Mercado Pago
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">
                            Instrucciones para pagar:
                          </h4>
                          
                          {/* Pasos claros según lo solicitado */}
                          <div className="mt-2 space-y-2 text-xs text-slate-700">
                            <div className="flex items-start gap-2 bg-sky-50/50 p-2.5 rounded-lg border border-sky-100">
                              <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                              <p className="leading-snug">
                                <strong>Escaneá el código QR</strong> utilizando directamente la <strong>cámara de fotos de tu celular</strong>.
                              </p>
                            </div>

                            <div className="flex items-start gap-2 bg-sky-50/50 p-2.5 rounded-lg border border-sky-100">
                              <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                              <div className="leading-snug">
                                <span>Ingresá el monto exacto a pagar: </span>
                                <strong className="text-slate-900 font-mono font-black">{formatCurrency(total)}</strong>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(total.toString(), 'amount')}
                                  className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 hover:text-sky-800 bg-white px-2 py-0.5 rounded border border-sky-200 cursor-pointer"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                  <span>{copiedAmount ? '¡Copiado!' : 'Copiar'}</span>
                                </button>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 bg-sky-50/50 p-2.5 rounded-lg border border-sky-100">
                              <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                              <p className="leading-snug">
                                Hacé clic en <strong>"Continuar"</strong> y utilizá cualquiera de tus medios de pago disponibles en Mercado Pago (dinero en cuenta, tarjetas de débito o crédito en cuotas).
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Nota aclaratoria explícita: este QR debe escanearse con la cámara, no directamente desde la app de MP */}
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
                          <p className="font-bold flex items-center gap-1.5 text-amber-950">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Nota importante sobre el escaneo:</span>
                          </p>
                          <p className="text-amber-800 leading-relaxed text-[11px]">
                            Este código QR <strong>no es admisible para escanear directamente desde la app de Mercado Pago</strong>; debés <strong>usar la cámara de tu celular</strong> para abrir el enlace de pago seguro en tu navegador.
                          </p>
                        </div>

                        {/* Botón directo si está en el mismo celular o computadora */}
                        {(() => {
                          const officialMpLink = normalizeMercadoPagoUrl(company.bankAccount.mercadoPagoLink);
                          return (
                            <div className="pt-1 space-y-1.5">
                              <a
                                href={officialMpLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span>Abrir link de Mercado Pago directamente</span>
                              </a>
                              <p className="text-[10px] text-slate-400 font-mono text-center truncate px-2" title={officialMpLink}>
                                {officialMpLink}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Upload Ticket or WhatsApp */}
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Comprobante de la Transferencia
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600">
                    Sube la captura de pantalla de la transferencia o ingresa el número de operación para asociarlo a tu factura:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* File Upload Box */}
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full p-3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all text-xs cursor-pointer ${
                          transferProofFile
                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold'
                            : 'border-slate-300 bg-white hover:border-orange-500 hover:bg-orange-50/30 text-slate-600'
                        }`}
                      >
                        {transferProofFile ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span className="truncate max-w-full px-2">{transferProofFile.name}</span>
                            <span className="text-[10px] text-emerald-600 underline">Cambiar comprobante</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-slate-400" />
                            <span className="font-bold text-slate-800">Subir foto o PDF del Ticket</span>
                            <span className="text-[10px] text-slate-400">Archivos hasta 5MB</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* WhatsApp ticket alternative */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block mb-1">
                          ¿Prefieres enviarlo por WhatsApp?
                        </span>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          Puedes enviarnos la constancia directamente a nuestro chat oficial con el pedido precargado.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendTicketViaWhatsApp}
                        className="mt-2.5 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 fill-emerald-600 text-white" />
                        <span>Enviar comprobante por WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  {/* Reference text field */}
                  <div>
                    <input
                      type="text"
                      value={transferRef}
                      onChange={(e) => setTransferRef(e.target.value)}
                      placeholder="N° de transacción, operación o referencia bancaria (opcional)..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Internal POS Specifics (Cash, Card, QR Mercado Pago) */}
            {!isPublicStore && method === 'cash' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Monto Recibido:</span>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={e => setCashReceived(Number(e.target.value))}
                    className="w-36 px-3 py-1.5 text-right font-black text-slate-900 bg-white border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-bold">
                  <span className="text-slate-600">Vuelto a entregar:</span>
                  <span className="text-emerald-600 text-lg font-black">
                    {formatCurrency(change)}
                  </span>
                </div>
              </div>
            )}

            {!isPublicStore && (method === 'credit_card' || method === 'debit_card') && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Plan de Cuotas</label>
                    <select
                      value={cardInstallments}
                      onChange={e => setCardInstallments(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none font-medium"
                    >
                      <option value={1}>1 Pago sin recargo</option>
                      <option value={3}>3 Cuotas fijas</option>
                      <option value={6}>6 Cuotas fijas</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Valor por cuota</label>
                    <div className="mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800">
                      {formatCurrency(total / cardInstallments)} / mes
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isPublicStore && method === 'mercadopago_qr' && (
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-center space-y-2">
                <span className="inline-block text-[11px] font-bold uppercase bg-sky-600 text-white px-3 py-0.5 rounded-full">
                  QR Interoperable
                </span>
                <p className="text-xs text-sky-900">
                  Terminal en mostrador lista para cobro con billeteras virtuales.
                </p>
              </div>
            )}

            {/* ---------------- SECTION 3: DATOS DEL CLIENTE, FACTURACIÓN Y ENVÍO ---------------- */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-black text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  Datos de Facturación y Envío
                </h3>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Nombre o Razon Social */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Nombre y Apellido o Razón Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Juan Pérez / Panadería San José S.R.L."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-orange-500 font-medium text-base sm:text-xs"
                  />
                </div>

                {/* CUIT / DNI */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    CUIT o DNI <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerDoc}
                    onChange={(e) => setCustomerDoc(e.target.value)}
                    placeholder="Ej. 20-34567890-9 o 34567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-orange-500 font-mono font-medium text-base sm:text-xs"
                  />
                </div>

                {/* Tipo de Contribuyente */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Tipo de Contribuyente (AFIP) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={taxPayerType}
                    onChange={(e) => setTaxPayerType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-orange-500 font-medium text-base sm:text-xs"
                  >
                    <option value="consumidor_final">Consumidor Final (Factura B)</option>
                    <option value="responsable_inscripto">Responsable Inscripto (Factura A)</option>
                    <option value="monotributo">Monotributista</option>
                    <option value="exento">Exento / Entidad</option>
                  </select>
                </div>

                {/* Telefono / WhatsApp */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Teléfono o WhatsApp de Contacto <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ej. 11 4567 8900"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-orange-500 font-medium text-base sm:text-xs"
                    />
                  </div>
                </div>

                {/* Correo Electronico (Opcional) */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Correo Electrónico (para envío de Factura electrónica)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="nombre@ejemplo.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-orange-500 font-medium text-base sm:text-xs"
                  />
                </div>

                {/* Delivery Method selector */}
                <div className="sm:col-span-2 pt-1">
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Modalidad de Recepción de los Equipos <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('shipping')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer text-xs ${
                        deliveryMethod === 'shipping'
                          ? 'border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span>Envío a Domicilio / Obra</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer text-xs ${
                        deliveryMethod === 'pickup'
                          ? 'border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Retiro en Fábrica (Bonificado)</span>
                    </button>
                  </div>
                </div>

                {/* Domicilio de entrega (if shipping) */}
                {deliveryMethod === 'shipping' && (
                  <>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-bold mb-1">
                        Domicilio de Entrega (Calle, Número, Localidad y Provincia) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Ej. Av. Corrientes 1234, Local 4, CABA o Rosario, Santa Fe"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-orange-500 font-medium text-base sm:text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-bold mb-1">
                        Días y Horarios Hábiles de Recepción
                      </label>
                      <div className="relative">
                        <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={deliverySchedule}
                          onChange={(e) => setDeliverySchedule(e.target.value)}
                          placeholder="Ej. Lunes a Viernes de 9 a 17 hs / Consultar antes de salir"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-orange-500 font-medium text-base sm:text-xs"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Observaciones adicionales */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Observaciones o Notas Especiales
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. Dejar aviso en portería / Embalaje reforzado para transporte expreso"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-orange-500 font-medium text-base sm:text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Form Validation Error Banner */}
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Confirm / Submit Button */}
            <div className="space-y-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleProcessPayment}
                className="w-full py-4 px-4 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registrando Pedido y Notificando a Fábrica...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirmar Pedido & Pago • {formatCurrency(total)}</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Operación protegida con Facturación Oficial y Garantía Titufaris</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
