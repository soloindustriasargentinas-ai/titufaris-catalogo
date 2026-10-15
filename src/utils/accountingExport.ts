import { Sale, CompanyProfile } from '../types';

export function exportLibroIvaVentasCSV(sales: Sale[], company?: CompanyProfile): void {
  const headers = [
    'Fecha',
    'Hora',
    'Nro Comprobante',
    'Estado',
    'Cliente',
    'CUIT / Documento',
    'Condicion IVA',
    'Neto Gravado (ARS)',
    'Alicuota IVA',
    'Debito Fiscal IVA 21% (ARS)',
    'Descuento (ARS)',
    'Total Facturado (ARS)',
    'Medio de Pago',
    'Cajero / Operador',
    'Sucursal'
  ];

  const rows = sales.map(s => {
    const isCancelled = s.paymentStatus === 'cancelled' || s.status === 'cancelled';
    const saleDate = new Date(s.createdAt);
    const dateStr = !isNaN(saleDate.getTime())
      ? saleDate.toLocaleDateString('es-AR')
      : s.createdAt;
    const timeStr = !isNaN(saleDate.getTime())
      ? saleDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      : '';

    // In Argentina standard VAT calculation:
    // If taxAmount was explicitly tracked, use it; otherwise compute from total (21%)
    const total = s.total || 0;
    const ivaRate = 0.21;
    const neto = isCancelled ? 0 : Math.round((total / (1 + ivaRate)) * 100) / 100;
    const ivaDebito = isCancelled ? 0 : Math.round((total - neto) * 100) / 100;

    const paymentLabel = s.paymentMethod === 'mercadopago_qr'
      ? 'Mercado Pago QR'
      : s.paymentMethod === 'credit_card'
      ? 'Tarjeta de Crédito'
      : s.paymentMethod === 'debit_card'
      ? 'Tarjeta de Débito'
      : s.paymentMethod === 'cash'
      ? 'Efectivo Mostrador'
      : 'Transferencia Bancaria';

    return [
      `"${dateStr}"`,
      `"${timeStr}"`,
      `"${s.receiptNumber}"`,
      `"${isCancelled ? 'ANULADA' : 'EMITIDA'}"`,
      `"${(s.customerName || 'Consumidor Final').replace(/"/g, '""')}"`,
      `"${s.customerDoc || '00-00000000-0'}"`,
      `"${(s.taxPayerType || 'consumidor_final').replace(/_/g, ' ').toUpperCase()}"`,
      neto.toFixed(2),
      '"21.00%"',
      ivaDebito.toFixed(2),
      (s.discountAmount || 0).toFixed(2),
      (isCancelled ? 0 : total).toFixed(2),
      `"${paymentLabel}"`,
      `"${(s.cashierName || 'Caja Central').replace(/"/g, '""')}"`,
      `"${(s.branchName || 'Sucursal Central').replace(/"/g, '""')}"`
    ].join(';');
  });

  // Calculate totals
  const completedSales = sales.filter(s => s.paymentStatus !== 'cancelled' && s.status !== 'cancelled');
  const sumTotal = completedSales.reduce((acc, s) => acc + (s.total || 0), 0);
  const sumNeto = Math.round((sumTotal / 1.21) * 100) / 100;
  const sumIva = Math.round((sumTotal - sumNeto) * 100) / 100;

  const summaryRow = [
    '"TOTALES"',
    '""',
    `"Total Operaciones: ${completedSales.length}"`,
    '""',
    '""',
    '""',
    '""',
    sumNeto.toFixed(2),
    '""',
    sumIva.toFixed(2),
    '""',
    sumTotal.toFixed(2),
    '""',
    '""',
    '""'
  ].join(';');

  const bom = '\uFEFF';
  const csvContent = bom + [headers.join(';'), ...rows, summaryRow].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const now = new Date();
  const dateTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const fileName = `Libro_IVA_Ventas_${(company?.name || 'Titufaris').replace(/[^a-zA-Z0-9]/g, '_')}_${dateTag}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
