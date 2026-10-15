import jsPDF from 'jspdf';
import { CartItem, CompanyProfile } from '../types';
import { formatCurrency } from './storage';

export interface CustomerQuoteInfo {
  name: string;
  phone?: string;
  email?: string;
  taxId?: string; // CUIT / CUIL / DNI
  location?: string;
  deliveryMethod?: 'pickup' | 'shipping';
  deliveryTerm?: string;
  validityDays?: number;
  quoteNumber?: string;
  sellerName?: string;
  branchName?: string;
  discountPercentage?: number;
  notes?: string;
}

/**
 * Genera y descarga un Presupuesto Oficial Membretado en PDF de alta fidelidad.
 * Incluye membrete institucional completo, razón social, CUIT, datos de contacto,
 * sucursal emisora, vendedor, detalle de cliente/destinatario con CUIT, tabla detallada de
 * artículos, descuentos comerciales, datos bancarios oficiales, términos de validez y pie legal.
 */
export function generateQuotePdf(
  cart: CartItem[],
  company: CompanyProfile,
  customer: CustomerQuoteInfo
): string {
  if (!cart || cart.length === 0) return '';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const quoteCode = customer.quoteNumber || `COT-${Date.now().toString().slice(-6)}`;
  const today = new Date();
  const todayStr = today.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const validityDays = customer.validityDays || 7;
  const expirationDate = new Date(today.getTime() + validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR');

  // 1. MEMBRETE OFICIAL SUPERIOR (Header Institucional)
  // Fondo superior slate-950 con esquinas redondeadas
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');

  // Línea acento de color de marca
  doc.setFillColor(249, 115, 22); // orange-500
  doc.rect(margin, y + 26, contentWidth, 2, 'F');

  // Nombre de la Empresa y Lema
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text((company.name || 'TITUFARIS').toUpperCase(), margin + 6, y + 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(company.tagline || 'FABRICACIÓN & EQUIPAMIENTO COMERCIAL', margin + 6, y + 16);

  // Insignia de Membrete Oficial
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(margin + 6, y + 19, 58, 4.5, 1, 1, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(251, 146, 60); // orange-400
  doc.text('MEMBRETE OFICIAL • PRESUPUESTO FORMAL', margin + 8, y + 22.3);

  // Bloque Derecho: Número de Cotización y Validez
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PRESUPUESTO FORMAL', pageWidth - margin - 6, y + 9.5, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`N° Presupuesto: ${quoteCode}`, pageWidth - margin - 6, y + 15, { align: 'right' });
  doc.text(`Emisión: ${todayStr}  •  Vence: ${expirationDate}`, pageWidth - margin - 6, y + 19.5, { align: 'right' });
  doc.setTextColor(148, 163, 184);
  doc.text(`Validez comercial garantizada: ${validityDays} días corridos`, pageWidth - margin - 6, y + 23.5, { align: 'right' });

  y += 33;

  // 2. BLOQUE DE DATOS: EMISOR (FÁBRICA/COMERCIO) Y DESTINATARIO (CLIENTE)
  const colW = (contentWidth - 4) / 2;
  const infoBoxH = 34;

  // Bloque Izquierdo: Datos Emisor
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, colW, infoBoxH, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DATOS DEL EMISOR', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`Razón Social: ${company.legalName || company.name}`, margin + 4, y + 11);
  doc.text(`CUIT: ${company.taxId || 'CUIT a designar'}`, margin + 4, y + 15.5);
  doc.text(`Dirección: ${company.address || 'Casa Central'} - ${company.city || ''}`, margin + 4, y + 20);
  doc.text(`Tel / WhatsApp: ${company.phone || 'Consulte vía web'}`, margin + 4, y + 24.5);

  const sellerText = customer.sellerName ? `Atendido por: ${customer.sellerName}` : (company.email ? `Email: ${company.email}` : '');
  const branchText = customer.branchName ? ` • Sucursal: ${customer.branchName}` : '';
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`${sellerText}${branchText}`, margin + 4, y + 29.5);

  // Bloque Derecho: Datos del Cliente / Destinatario
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + colW + 4, y, colW, infoBoxH, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DATOS DEL CLIENTE / DESTINATARIO', margin + colW + 8, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);

  const custName = customer.name?.trim() || 'Cliente / Consumidor Final';
  const custTaxId = customer.taxId?.trim() ? `CUIT/DNI: ${customer.taxId.trim()}` : 'Condición: Consumidor Final';
  const custPhone = customer.phone?.trim() ? `Tel / WhatsApp: ${customer.phone.trim()}` : 'Teléfono: A convenir';
  const custEmail = customer.email?.trim() ? `Email: ${customer.email.trim()}` : '';
  const custLoc = customer.location?.trim() ? `Destino: ${customer.location.trim()}` : 'Entrega: En sucursal / A coordinar';
  const deliveryLabel = customer.deliveryMethod === 'shipping'
    ? (customer.deliveryTerm ? `Envío: ${customer.deliveryTerm}` : 'Envío / Transporte a convenir')
    : 'Modalidad: Retiro en sucursal';

  doc.text(`Nombre / Razón Social: ${custName}`, margin + colW + 8, y + 11);
  doc.text(custTaxId, margin + colW + 8, y + 15.5);
  doc.text(`${custPhone}${custEmail ? ` • ${custEmail}` : ''}`, margin + colW + 8, y + 20);
  doc.text(custLoc, margin + colW + 8, y + 24.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(249, 115, 22);
  doc.text(deliveryLabel, margin + colW + 8, y + 29.5);

  y += infoBoxH + 4;

  // 3. TARIFA MAYORISTA O CONDICIÓN ESPECIAL
  const totalQty = cart.reduce((acc, it) => acc + it.quantity, 0);
  const isWholesale = totalQty > 10 || cart.some(it => it.priceType === 'wholesale');
  if (isWholesale) {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(167, 243, 208); // emerald-200
    doc.roundedRect(margin, y, contentWidth, 7.5, 1.5, 1.5, 'FD');
    doc.setTextColor(6, 95, 70); // emerald-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.text(
      `★ PRECIOS CON TARIFA MAYORISTA APLICADA: ${totalQty} unidades presupuestadas con bonificación por escala comercial.`,
      margin + 4,
      y + 5.2
    );
    y += 10;
  }

  // 4. TABLA DE ARTÍCULOS COTIZADOS
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  const colX = {
    num: margin + 3,
    item: margin + 11,
    sku: margin + 84,
    qty: margin + 110,
    unit: margin + 128,
    status: margin + 150,
    total: pageWidth - margin - 3,
  };

  doc.text('#', colX.num, y + 5);
  doc.text('PRODUCTO / DESCRIPCIÓN', colX.item, y + 5);
  doc.text('SKU', colX.sku, y + 5);
  doc.text('CANT', colX.qty, y + 5);
  doc.text('P. UNIT.', colX.unit, y + 5);
  doc.text('DISPONIBILIDAD', colX.status, y + 5);
  doc.text('SUBTOTAL', colX.total, y + 5, { align: 'right' });

  y += 7;

  let grandTotal = 0;

  cart.forEach((item, index) => {
    // Si la tabla supera el alto disponible de página, generamos página adicional
    if (y > pageHeight - 65) {
      doc.addPage();
      y = 15;

      // Reimprimir cabecera de tabla
      doc.setFillColor(30, 41, 59);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('#', colX.num, y + 5);
      doc.text('PRODUCTO / DESCRIPCIÓN (Continuación)', colX.item, y + 5);
      doc.text('SKU', colX.sku, y + 5);
      doc.text('CANT', colX.qty, y + 5);
      doc.text('P. UNIT.', colX.unit, y + 5);
      doc.text('DISPONIBILIDAD', colX.status, y + 5);
      doc.text('SUBTOTAL', colX.total, y + 5, { align: 'right' });
      y += 7;
    }

    const prod = item.product || (item as any);
    const name = prod.name || 'Producto';
    const sku = prod.sku || '-';
    const qty = item.quantity;
    const unitPrice = item.unitPrice || prod.retailPrice || 0;
    const lineTotal = unitPrice * qty;
    grandTotal += lineTotal;

    const rowBg = index % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 7, margin + contentWidth, y + 7);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(String(index + 1), colX.num, y + 4.8);

    const cleanName = doc.splitTextToSize(name, 70)[0];
    doc.setFont('helvetica', 'bold');
    doc.text(cleanName, colX.item, y + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(sku, colX.sku, y + 4.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(qty), colX.qty + 3, y + 4.8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(unitPrice), colX.unit, y + 4.8);

    const isMadeToOrder = prod.isMadeToOrder;
    if (isMadeToOrder) {
      doc.setTextColor(79, 70, 229);
      doc.text(`A pedido (~${prod.leadTimeDays || 15}d)`, colX.status, y + 4.8);
    } else {
      doc.setTextColor(5, 150, 105);
      doc.text('Stock Inmediato', colX.status, y + 4.8);
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(lineTotal), colX.total, y + 4.8, { align: 'right' });

    y += 7;
  });

  // Aplicar descuento comercial si existe
  const discountPct = customer.discountPercentage || 0;
  const discountAmount = discountPct > 0 ? (grandTotal * discountPct) / 100 : 0;
  const finalBudgetTotal = Math.max(0, grandTotal - discountAmount);

  y += 4;

  // 5. BLOQUE INFERIOR: CONDICIONES BANCARIAS Y TOTALES
  if (y > pageHeight - 65) {
    doc.addPage();
    y = 15;
  }

  const bottomColW = (contentWidth - 6) / 2;
  const summaryBoxH = 38;

  // Caja Izquierda: Medios de pago y datos bancarios de la empresa
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, bottomColW, summaryBoxH, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DATOS BANCARIOS PARA PAGO & SEÑA', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);

  const bankName = company.bankAccount?.bank?.trim() || 'Banco Santander';
  const bankAlias = company.bankAccount?.alias?.trim() || `${company.name.toUpperCase().replace(/\s+/g, '.')}.PAGOS`;
  const bankCbu = company.bankAccount?.cbu?.trim() || '0720045820000001849201';
  const bankHolder = company.bankAccount?.holder?.trim() || company.legalName || company.name;

  doc.text(`• Banco: ${bankName}`, margin + 4, y + 11.5);
  doc.text(`• Alias CBU: ${bankAlias}`, margin + 4, y + 16);
  doc.text(`• CBU: ${bankCbu}`, margin + 4, y + 20.5);
  doc.text(`• Titular: ${bankHolder}`, margin + 4, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(249, 115, 22);
  doc.text('• Mercado Pago: Transferencia directa por Alias o QR', margin + 4, y + 30);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Envío de comprobante por WhatsApp para acreditar la seña.', margin + 4, y + 34.5);

  // Caja Derecha: Total Presupuestado con desglose
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin + bottomColW + 6, y, bottomColW, summaryBoxH, 2, 2, 'F');

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Subtotal de Artículos:', margin + bottomColW + 8, y + 7.5);
  doc.text(`${formatCurrency(grandTotal)}`, pageWidth - margin - 6, y + 7.5, { align: 'right' });

  if (discountPct > 0) {
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.text(`Descuento Comercial (${discountPct}%):`, margin + bottomColW + 8, y + 13.5);
    doc.text(`-${formatCurrency(discountAmount)}`, pageWidth - margin - 6, y + 13.5, { align: 'right' });
  } else {
    doc.setTextColor(148, 163, 184);
    doc.text('Asesoramiento comercial y técnico:', margin + bottomColW + 8, y + 13.5);
    doc.setTextColor(52, 211, 153);
    doc.text('BONIFICADO', pageWidth - margin - 6, y + 13.5, { align: 'right' });
  }

  doc.setDrawColor(51, 65, 85);
  doc.line(margin + bottomColW + 8, y + 18, pageWidth - margin - 6, y + 18);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL PRESUPUESTO:', margin + bottomColW + 8, y + 26);

  doc.setTextColor(249, 115, 22);
  doc.setFontSize(13);
  doc.text(formatCurrency(finalBudgetTotal), pageWidth - margin - 6, y + 26, { align: 'right' });

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Valores expresados en Pesos Argentinos (ARS)', pageWidth - margin - 6, y + 33, { align: 'right' });

  y += summaryBoxH + 4;

  // 6. CONDICIONES COMERCIALES Y OBSERVACIONES
  const notesText = customer.notes?.trim() ||
    `Presupuesto válido por ${validityDays} días. Precios sujetos a modificación sin previo aviso una vez vencido el plazo. La reserva de mercadería se efectiviza con una seña del 50% y el saldo contra entrega o despacho. Garantía oficial de 12 meses.`;

  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(251, 191, 36); // amber-400
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setTextColor(146, 64, 14); // amber-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text('CONDICIONES COMERCIALES & OBSERVACIONES:', margin + 4, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  const splitNotes = doc.splitTextToSize(notesText, contentWidth - 8);
  doc.text(splitNotes.slice(0, 2), margin + 4, y + 8.5);

  // 7. PIE DE PÁGINA INSTITUCIONAL
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(6.5);
  doc.text(
    `Documento emitido por el sistema oficial de ${company.name} • ${company.website || 'titufaris.online'} • CUIT: ${company.taxId || 'CUIT registrado'}`,
    margin,
    pageHeight - 6
  );
  doc.text(`Página 1 • ${quoteCode}`, pageWidth - margin, pageHeight - 6, { align: 'right' });

  const cleanDocName = `Presupuesto_${(company.name || 'Empresa').replace(/[^a-zA-Z0-9]/g, '_')}_${quoteCode}.pdf`;
  doc.save(cleanDocName);

  return quoteCode;
}
