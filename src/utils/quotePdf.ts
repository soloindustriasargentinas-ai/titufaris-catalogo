import jsPDF from 'jspdf';
import { CartItem, CompanyProfile } from '../types';
import { formatCurrency } from './storage';

export interface CustomerQuoteInfo {
  name: string;
  phone: string;
  location: string;
  deliveryMethod: 'pickup' | 'shipping';
}

/**
 * Genera y descarga un presupuesto comercial en PDF formal para el cliente
 * con el membrete oficial, detalle de artículos, totales y datos bancarios.
 */
export function generateQuotePdf(
  cart: CartItem[],
  company: CompanyProfile,
  customer: CustomerQuoteInfo
) {
  if (!cart || cart.length === 0) return;

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

  // Header background principal
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 24, 'F');

  // Línea acento en naranja
  doc.setFillColor(249, 115, 22); // orange-500
  doc.rect(margin, y + 24, contentWidth, 1.5, 'F');

  // Marca y Razón Social de la Empresa
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(company.name.toUpperCase(), margin + 6, y + 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(company.tagline || 'EQUIPAMIENTO COMERCIAL & INDUSTRIAL', margin + 6, y + 16);

  // Lado derecho de encabezado: Tipo de Documento y Fecha
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  const quoteCode = `COT-${Date.now().toString().slice(-6)}`;
  doc.text('COTIZACIÓN FORMAL', pageWidth - margin - 6, y + 9, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  const todayStr = new Date().toLocaleDateString('es-AR');
  doc.text(`N°: ${quoteCode}  |  Fecha: ${todayStr}`, pageWidth - margin - 6, y + 15, { align: 'right' });
  doc.text('Validez: 7 días corridos', pageWidth - margin - 6, y + 20, { align: 'right' });

  y += 31;

  // 2 Bloques: Emisor y Cliente
  const colW = (contentWidth - 4) / 2;

  // Bloque Izquierdo: Emisor / Fábrica
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, colW, 28, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DATOS DE LA EMPRESA', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Razón Social: ${company.legalName || company.name}`, margin + 4, y + 11);
  doc.text(`CUIT: ${company.taxId || '27-25578358-6'}`, margin + 4, y + 15.5);
  doc.text(`Dirección: ${company.address || 'Buenos Aires / Córdoba'}`, margin + 4, y + 20);
  doc.text(`Tel / WhatsApp: ${company.phone}`, margin + 4, y + 24.5);

  // Bloque Derecho: Cliente
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + colW + 4, y, colW, 28, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DATOS DEL CLIENTE / DESTINATARIO', margin + colW + 8, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const custName = customer.name?.trim() || 'Cliente / Consumidor Final';
  const custPhone = customer.phone?.trim() || 'A coordinar';
  const custLoc = customer.location?.trim() || 'A coordinar';
  const deliveryLabel = customer.deliveryMethod === 'shipping' ? 'Envío a coordinar' : 'Retiro en fábrica';

  doc.text(`Nombre / Razón Social: ${custName}`, margin + colW + 8, y + 11);
  doc.text(`WhatsApp / Teléfono: ${custPhone}`, margin + colW + 8, y + 15.5);
  doc.text(`Destino / Entrega: ${custLoc}`, margin + colW + 8, y + 20);
  doc.text(`Modalidad: ${deliveryLabel}`, margin + colW + 8, y + 24.5);

  y += 33;

  // Banner Mayorista si supera 10 productos
  const totalQty = cart.reduce((acc, it) => acc + it.quantity, 0);
  const isWholesale = totalQty > 10;
  if (isWholesale) {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(167, 243, 208); // emerald-200
    doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'FD');
    doc.setTextColor(6, 95, 70); // emerald-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`★ TARIFA MAYORISTA APLICADA EN TODO EL PEDIDO: Más de 10 productos seleccionados (${totalQty} unidades).`, margin + 4, y + 5.5);
    y += 11;
  }

  // Encabezado de la tabla de artículos
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

  // Filas de productos
  cart.forEach((item, index) => {
    // Si la tabla supera el alto de la página, creamos una nueva página
    if (y > pageHeight - 55) {
      doc.addPage();
      y = 15;
    }

    const prod = item.product || (item as any);
    const name = prod.name || 'Producto';
    const sku = prod.sku || '-';
    const qty = item.quantity;
    const unitPrice = item.unitPrice || prod.retailPrice;
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
      doc.text('Entrega Inmediata', colX.status, y + 4.8);
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(lineTotal), colX.total, y + 4.8, { align: 'right' });

    y += 7;
  });

  y += 4;

  // Bloque inferior: Totales y Datos Bancarios
  if (y > pageHeight - 55) {
    doc.addPage();
    y = 15;
  }

  const bottomColW = (contentWidth - 6) / 2;

  // Caja izquierda: Medios de pago y cuenta bancaria
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, bottomColW, 36, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FORMAS DE PAGO & DATOS BANCARIOS', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('• Transferencia Bancaria Directa:', margin + 4, y + 11);
  if (company.bankAccount) {
    doc.text(`   Banco: ${company.bankAccount.bank || 'Santander Río'}`, margin + 4, y + 15);
    doc.text(`   Alias: ${company.bankAccount.alias || 'TITUFARIS.EQUIPAMIENTO'}`, margin + 4, y + 19);
    doc.text(`   CBU: ${company.bankAccount.cbu || '0720045820000001849201'}`, margin + 4, y + 23);
    doc.text(`   Titular: ${company.bankAccount.holder || company.name}`, margin + 4, y + 27);
  }
  doc.text('• Mercado Pago (Transferencia / QR / Tarjetas)', margin + 4, y + 32);

  // Caja derecha: Total Presupuestado
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin + bottomColW + 6, y, bottomColW, 36, 2, 2, 'F');

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Subtotal de Productos:', margin + bottomColW + 8, y + 8);
  doc.text(`${totalQty} unidades`, pageWidth - margin - 6, y + 8, { align: 'right' });

  doc.text('Asesoramiento técnico & layout:', margin + bottomColW + 8, y + 14);
  doc.setTextColor(52, 211, 153);
  doc.text('BONIFICADO', pageWidth - margin - 6, y + 14, { align: 'right' });

  doc.setDrawColor(51, 65, 85);
  doc.line(margin + bottomColW + 8, y + 18, pageWidth - margin - 6, y + 18);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('TOTAL PRESUPUESTO:', margin + bottomColW + 8, y + 26);

  doc.setTextColor(249, 115, 22);
  doc.setFontSize(12);
  doc.text(formatCurrency(grandTotal), pageWidth - margin - 6, y + 26, { align: 'right' });

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Precios vigentes en Pesos Argentinos (ARS)', pageWidth - margin - 6, y + 32, { align: 'right' });

  y += 41;

  // Condiciones comerciales y contacto
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(251, 191, 36); // amber-400
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setTextColor(146, 64, 14); // amber-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('INFORMACIÓN DE CIERRE & SEGUIMIENTO POR WHATSAPP:', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(
    `Para confirmar este presupuesto o coordinar logística y flete, envíe este documento por WhatsApp a: ${company.phone}. Estructuras reforzadas con 12 meses de garantía oficial de fábrica ${company.name}.`,
    margin + 4,
    y + 9.5
  );

  // Pie de página
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(6.5);
  doc.text(
    `Documento emitido por la tienda digital de ${company.name} (${company.website || 'titufaris.online'}). Válido por 7 días.`,
    margin,
    pageHeight - 6
  );

  const cleanDocName = `Presupuesto_${company.name.replace(/[^a-zA-Z0-9]/g, '_')}_${quoteCode}.pdf`;
  doc.save(cleanDocName);
}
