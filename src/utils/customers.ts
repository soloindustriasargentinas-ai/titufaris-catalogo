import { Sale, CustomerRemarketingProfile } from '../types';

/**
 * Normalizes an identifier string (CUIT, DNI, phone or name) for customer grouping
 */
function normalizeCustomerKey(sale: Sale): string {
  if (sale.customerDoc && sale.customerDoc.trim().length >= 7) {
    return 'doc:' + sale.customerDoc.replace(/[^0-9]/g, '');
  }
  if (sale.customerPhone && sale.customerPhone.trim().length >= 6) {
    return 'phone:' + sale.customerPhone.replace(/[^0-9]/g, '');
  }
  if (sale.customerEmail && sale.customerEmail.includes('@')) {
    return 'email:' + sale.customerEmail.trim().toLowerCase();
  }
  const name = (sale.customerName || 'Consumidor Final').trim().toLowerCase();
  return 'name:' + name;
}

/**
 * Aggregates all recorded sales into deduplicated Customer Remarketing Profiles
 */
export function extractCustomersFromSales(sales: Sale[]): CustomerRemarketingProfile[] {
  const customerMap = new Map<string, CustomerRemarketingProfile>();

  // Sort sales from oldest to newest to trace lifetime journey
  const validSales = sales
    .filter(s => s.paymentStatus !== 'cancelled' && s.status !== 'cancelled')
    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  for (const sale of validSales) {
    const key = normalizeCustomerKey(sale);
    const existing = customerMap.get(key);

    const displayName = sale.customerName?.trim() || existing?.name || 'Cliente sin nombre';
    const saleDate = sale.createdAt || new Date().toISOString();

    if (!existing) {
      const productMap = new Map<string, { name: string; sku: string; quantity: number; totalAmount: number }>();
      
      for (const item of sale.items) {
        productMap.set(item.sku, {
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          totalAmount: item.subtotal,
        });
      }

      customerMap.set(key, {
        id: key,
        name: displayName,
        doc: sale.customerDoc?.trim() || undefined,
        taxPayerType: sale.taxPayerType,
        phone: sale.customerPhone?.trim() || undefined,
        email: sale.customerEmail?.trim() || undefined,
        address: sale.deliveryAddress?.trim() || undefined,
        deliverySchedule: sale.deliverySchedule?.trim() || undefined,
        ordersCount: 1,
        totalSpent: sale.total,
        firstOrderDate: saleDate,
        lastOrderDate: saleDate,
        purchasedProducts: Array.from(productMap.values()),
        salesReceipts: [sale.receiptNumber],
      });
    } else {
      // Update existing customer record
      existing.ordersCount += 1;
      existing.totalSpent += sale.total;
      existing.lastOrderDate = saleDate;

      if (!existing.salesReceipts.includes(sale.receiptNumber)) {
        existing.salesReceipts.push(sale.receiptNumber);
      }

      // Enrich contact fields if the latest sale provides new data
      if (sale.customerName && sale.customerName.trim() !== 'Consumidor Final') {
        existing.name = sale.customerName.trim();
      }
      if (sale.customerDoc) existing.doc = sale.customerDoc.trim();
      if (sale.customerPhone) existing.phone = sale.customerPhone.trim();
      if (sale.customerEmail) existing.email = sale.customerEmail.trim();
      if (sale.deliveryAddress) existing.address = sale.deliveryAddress.trim();
      if (sale.deliverySchedule) existing.deliverySchedule = sale.deliverySchedule.trim();
      if (sale.taxPayerType) existing.taxPayerType = sale.taxPayerType;

      // Aggregate purchased items
      for (const item of sale.items) {
        const found = existing.purchasedProducts.find(p => p.sku === item.sku);
        if (found) {
          found.quantity += item.quantity;
          found.totalAmount += item.subtotal;
        } else {
          existing.purchasedProducts.push({
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            totalAmount: item.subtotal,
          });
        }
      }
    }
  }

  // Return sorted by total spent (highest value customers first)
  return Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Exports customers to a clean Excel-compatible CSV file with UTF-8 BOM
 */
export function exportCustomersToCSV(customers: CustomerRemarketingProfile[], companyName: string = 'Titufaris'): void {
  const headers = [
    'Razón Social / Nombre',
    'CUIT / DNI',
    'Condición IVA',
    'WhatsApp / Teléfono',
    'Email',
    'Domicilio / Localidad Entrega',
    'Horario Entrega',
    'Total Comprado ($)',
    'Cantidad de Compras',
    'Ticket Promedio ($)',
    'Primera Compra',
    'Última Compra',
    'Equipos y Artículos Adquiridos',
    'Tickets / Facturas',
  ];

  const rows = customers.map(c => {
    const avgTicket = c.ordersCount > 0 ? Math.round(c.totalSpent / c.ordersCount) : 0;
    const taxTypeLabel = c.taxPayerType ? c.taxPayerType.replace('_', ' ').toUpperCase() : 'NO ESPECIFICADO';
    const itemsSummary = c.purchasedProducts.map(p => `${p.quantity}x ${p.name} (${p.sku})`).join(' | ');
    const receipts = c.salesReceipts.join(', ');

    return [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.doc || '').replace(/"/g, '""')}"`,
      `"${taxTypeLabel}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${(c.deliverySchedule || '').replace(/"/g, '""')}"`,
      c.totalSpent,
      c.ordersCount,
      avgTicket,
      `"${c.firstOrderDate.slice(0, 10)}"`,
      `"${c.lastOrderDate.slice(0, 10)}"`,
      `"${itemsSummary.replace(/"/g, '""')}"`,
      `"${receipts.replace(/"/g, '""')}"`,
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${companyName.toLowerCase()}_base_clientes_remarketing_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies clean phone numbers to clipboard formatted for WhatsApp broadcast lists
 */
export async function copyCustomerPhonesToClipboard(customers: CustomerRemarketingProfile[]): Promise<number> {
  const validPhones = customers
    .map(c => c.phone?.replace(/[^0-9+]/g, '').trim())
    .filter((p): p is string => Boolean(p && p.length >= 8));

  const uniquePhones = Array.from(new Set(validPhones));
  if (uniquePhones.length === 0) return 0;

  const textToCopy = uniquePhones.join(', ');
  await navigator.clipboard.writeText(textToCopy);
  return uniquePhones.length;
}

/**
 * Pre-constructs friendly, personalized WhatsApp message links for remarketing
 */
export function buildWhatsAppRemarketingLink(
  phone: string,
  customerName: string,
  template: 'promo' | 'novedades' | 'seguimiento' | 'custom',
  companyName: string = 'Titufaris'
): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  let message = '';

  const firstName = customerName.split(' ')[0] || 'Estimado/a';

  switch (template) {
    case 'promo':
      message = `Hola ${firstName}! Te saludamos de ${companyName} Equipamiento Comercial. Queremos contarte que tenemos promociones especiales y stock inmediato en líneas seleccionadas de góndolas, estanterías y racks para renovar tu local o depósito. ¿Te gustaría recibir nuestro catálogo actualizado con precios promocionales?`;
      break;
    case 'novedades':
      message = `Hola ${firstName}! Desde ${companyName} esperamos que tus instalaciones estén funcionando excelente. Acabamos de sumar nuevos modelos y tramos complementarios para optimizar tus espacios. Podés ver las novedades en nuestra tienda online. Avisanos si necesitás cotizar ampliaciones o nuevos proyectos.`;
      break;
    case 'seguimiento':
      message = `Hola ${firstName}! Te escribimos de ${companyName} para hacer seguimiento de tu compra reciente. ¿Todo llegó en perfectas condiciones? Estamos a tu disposición para cualquier consulta técnica o asesoramiento de layout.`;
      break;
    default:
      message = `Hola ${firstName}! Te contactamos desde ${companyName} Equipamiento Comercial por consultas sobre tus pedidos y equipamiento.`;
      break;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
