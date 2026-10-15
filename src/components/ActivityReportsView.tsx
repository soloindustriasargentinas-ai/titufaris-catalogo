import React, { useState } from 'react';
import {
  Activity,
  Search,
  Filter,
  ShoppingCart,
  Tag,
  AlertTriangle,
  FileText,
  XCircle,
  CheckCircle,
  RotateCcw,
  Trash2,
  Calendar,
  CreditCard,
  DollarSign,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { ActivityLog, ActivityAction, Product, Sale, User, PaymentMethod, CompanyProfile } from '../types';
import { formatCurrency, formatDate } from '../utils/storage';
import { extractCustomersFromSales } from '../utils/customers';
import { CustomersRemarketingView } from './CustomersRemarketingView';

interface ActivityReportsViewProps {
  logs: ActivityLog[];
  products: Product[];
  sales: Sale[];
  company?: CompanyProfile;
  currentUser?: User;
  onCancelSale?: (saleId: string, restoreStock: boolean, reason?: string) => Promise<void> | void;
  onDeleteSale?: (saleId: string, restoreStock: boolean) => Promise<void> | void;
  onClearAllSales?: () => Promise<void> | void;
}

export const ActivityReportsView: React.FC<ActivityReportsViewProps> = ({
  logs,
  products,
  sales,
  company,
  currentUser,
  onCancelSale,
  onDeleteSale,
  onClearAllSales,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'sales' | 'customers' | 'logs'>('sales');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchLogs, setSearchLogs] = useState('');

  // Sales View Filter State
  const [searchSales, setSearchSales] = useState('');
  const [salesStatusFilter, setSalesStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  // Cancellation Modal State
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [cancelRestoreStock, setCancelRestoreStock] = useState<boolean>(true);
  const [cancelReason, setCancelReason] = useState<string>('Devolución de mercadería');

  // Deletion Modal State
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [deleteRestoreStock, setDeleteRestoreStock] = useState<boolean>(true);

  // Computations
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalCostValuation = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + p.retailPrice * p.stock, 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  const completedSales = sales.filter(s => s.paymentStatus !== 'cancelled' && s.status !== 'cancelled');
  const cancelledSales = sales.filter(s => s.paymentStatus === 'cancelled' || s.status === 'cancelled');
  const totalSalesRevenue = completedSales.reduce((acc, s) => acc + s.total, 0);
  const uniqueCustomersCount = React.useMemo(() => extractCustomersFromSales(sales).length, [sales]);

  // Filtered Sales
  const filteredSales = sales.filter(sale => {
    const isCancelled = sale.paymentStatus === 'cancelled' || sale.status === 'cancelled';
    const matchesStatus =
      salesStatusFilter === 'all' ||
      (salesStatusFilter === 'completed' && !isCancelled) ||
      (salesStatusFilter === 'cancelled' && isCancelled);

    const q = searchSales.toLowerCase().trim();
    const matchesQuery =
      !q ||
      sale.receiptNumber.toLowerCase().includes(q) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(q)) ||
      (sale.cashierName && sale.cashierName.toLowerCase().includes(q)) ||
      sale.items.some(it => it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q));

    return matchesStatus && matchesQuery;
  });

  // Filtered Logs
  const filteredLogs = logs.filter(log => {
    const matchAction = filterAction === 'all' || log.action === filterAction;
    const q = searchLogs.toLowerCase().trim();
    const matchQuery =
      !q ||
      log.title.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q);
    return matchAction && matchQuery;
  });

  const getPaymentMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case 'mercadopago_qr':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
            Mercado Pago QR
          </span>
        );
      case 'credit_card':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
            <CreditCard className="w-3 h-3" /> Tarjeta Crédito
          </span>
        );
      case 'debit_card':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
            <CreditCard className="w-3 h-3" /> Tarjeta Débito
          </span>
        );
      case 'bank_transfer':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
            Transferencia Bancaria
          </span>
        );
      case 'cash':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            <DollarSign className="w-3 h-3" /> Efectivo
          </span>
        );
    }
  };

  const getActionBadge = (action: ActivityAction) => {
    switch (action) {
      case 'sale_completed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            <ShoppingCart className="w-3 h-3" /> Venta POS
          </span>
        );
      case 'sale_cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" /> Venta Anulada
          </span>
        );
      case 'price_updated':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
            <Tag className="w-3 h-3" /> Precio Modificado
          </span>
        );
      case 'stock_adjusted':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" /> Ajuste de Stock
          </span>
        );
      case 'catalog_exported':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
            <FileText className="w-3 h-3" /> Exportación PDF
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
            <Activity className="w-3 h-3" /> Sistema
          </span>
        );
    }
  };

  const handleConfirmCancel = async () => {
    if (!saleToCancel || !onCancelSale) return;
    await onCancelSale(saleToCancel.id, cancelRestoreStock, cancelReason);
    setSaleToCancel(null);
  };

  const handleConfirmDelete = async () => {
    if (!saleToDelete || !onDeleteSale) return;
    await onDeleteSale(saleToDelete.id, deleteRestoreStock);
    setSaleToDelete(null);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Retail Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Valuación Inventario (PVP)
            </span>
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(totalRetailValuation)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Costo base: {formatCurrency(totalCostValuation)}
          </p>
        </div>

        {/* Stock Units */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Unidades en Depósito
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalStockUnits.toLocaleString('es-AR')} u.
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Distribuidas en {products.length} artículos activos
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Alertas de Stock
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">
            {lowStockCount} artículos
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Por debajo del umbral mínimo de seguridad
          </p>
        </div>

        {/* Sales Processed (Active Revenue) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Cobrado en Ventas
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {formatCurrency(totalSalesRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {completedSales.length} cobradas {cancelledSales.length > 0 && `(${cancelledSales.length} anuladas)`}
          </p>
        </div>
      </div>

      {/* Main View Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-3 gap-3 overflow-x-auto">
        <button
          onClick={() => setActiveMainTab('sales')}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeMainTab === 'sales'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Historial de Ventas ({sales.length})</span>
        </button>

        <button
          id="tab-crm-customers"
          onClick={() => setActiveMainTab('customers')}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeMainTab === 'customers'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Base de Clientes & CRM ({uniqueCustomersCount})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('logs')}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeMainTab === 'logs'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Registro de Auditoría & Logs ({logs.length})</span>
        </button>
      </div>

      {/* SUB-VIEW 1: SALES & CANCELLATIONS */}
      {activeMainTab === 'sales' && (
        <div className="bg-white rounded-b-2xl border border-slate-200 border-t-0 shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span>Ventas Realizadas y Control de Tickets</span>
                <span className="text-xs font-normal text-slate-500">
                  (Permite anular tickets cobrados y reintegrar mercadería al stock)
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Los cambios de anulación y eliminación se sincronizan en tiempo real con Google Cloud Firestore.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchSales}
                  onChange={e => setSearchSales(e.target.value)}
                  placeholder="Buscar ticket, cliente o artículo..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-orange-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={salesStatusFilter}
                onChange={e => setSalesStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none font-medium cursor-pointer"
              >
                <option value="all">Todas las ventas</option>
                <option value="completed">Solo Cobradas</option>
                <option value="cancelled">Solo Anuladas / Canceladas</option>
              </select>

              {onClearAllSales && sales.length > 0 && (
                <button
                  onClick={onClearAllSales}
                  title="Eliminar todos los registros de ventas del sistema"
                  className="px-2.5 py-1.5 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Vaciar Registro</span>
                </button>
              )}
            </div>
          </div>

          {/* Sales List */}
          <div className="divide-y divide-slate-100">
            {filteredSales.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No hay ventas registradas con este criterio</p>
                <p className="text-xs text-slate-400 mt-1">
                  Las ventas completadas desde la terminal POS aparecerán listadas aquí con opciones de anulación.
                </p>
              </div>
            ) : (
              filteredSales.map(sale => {
                const isCancelled = sale.paymentStatus === 'cancelled' || sale.status === 'cancelled';
                const isExpanded = expandedSaleId === sale.id;

                return (
                  <div
                    key={sale.id}
                    className={`p-4 sm:p-5 transition-colors ${
                      isCancelled ? 'bg-rose-50/40 opacity-90' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Receipt Info */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                            {sale.receiptNumber}
                          </span>

                          {isCancelled ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Venta Anulada / Cancelada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Cobrada
                            </span>
                          )}

                          {getPaymentMethodBadge(sale.paymentMethod)}

                          {sale.stockReintegrated && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              <RotateCcw className="w-3 h-3" /> Stock Reincorporado
                            </span>
                          )}
                        </div>

                        {/* Customer & Cashier Info */}
                        <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                          <span>
                            Cliente: <strong>{sale.customerName || 'Consumidor Final'}</strong>
                            {sale.customerDoc && ` (${sale.customerDoc})`}
                          </span>
                          <span>•</span>
                          <span>
                            Cajero/a: <strong>{sale.cashierName}</strong>
                          </span>
                          <span>•</span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(sale.createdAt)}
                          </span>
                        </div>

                        {/* Cancellation note if cancelled */}
                        {isCancelled && sale.cancellationReason && (
                          <div className="mt-2 text-xs bg-rose-100/70 border border-rose-200 rounded-lg p-2 text-rose-900">
                            <strong>Motivo de anulación:</strong> {sale.cancellationReason}
                            {sale.cancelledBy && ` (por ${sale.cancelledBy})`}
                          </div>
                        )}
                      </div>

                      {/* Right: Total & Action Buttons */}
                      <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block font-medium">Total</span>
                          <span
                            className={`text-lg sm:text-xl font-black ${
                              isCancelled ? 'text-slate-400 line-through' : 'text-slate-900'
                            }`}
                          >
                            {formatCurrency(sale.total)}
                          </span>
                          {sale.discountAmount > 0 && (
                            <span className="text-[10px] text-emerald-600 block">
                              Desc. {sale.discountPercentage}% (-{formatCurrency(sale.discountAmount)})
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          {/* Toggle items breakdown */}
                          <button
                            onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                            title="Ver detalle de artículos vendidos"
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                          >
                            <span>{sale.items.length} {sale.items.length === 1 ? 'artículo' : 'artículos'}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          {/* Cancel Sale Button (if not already cancelled) */}
                          {!isCancelled && onCancelSale && (
                            <button
                              onClick={() => {
                                setSaleToCancel(sale);
                                setCancelRestoreStock(true);
                                setCancelReason('Devolución de mercadería');
                              }}
                              title="Anular venta y reintegrar stock"
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Anular</span>
                            </button>
                          )}

                          {/* Delete Sale Button */}
                          {onDeleteSale && (
                            <button
                              onClick={() => {
                                setSaleToDelete(sale);
                                setDeleteRestoreStock(!isCancelled);
                              }}
                              title="Eliminar registro permanentemente"
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable items breakdown */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-slate-200/80 bg-slate-50/80 rounded-xl p-3 space-y-3">
                        {/* Customer, Invoicing & Delivery info block */}
                        {(sale.customerDoc || sale.taxPayerType || sale.deliveryAddress || sale.customerPhone || sale.transferProofUrl || sale.notes) && (
                          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                            <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wider block">
                              Datos de Facturación & Logística:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-slate-600">
                              {sale.customerDoc && (
                                <div><strong className="text-slate-800">CUIT / DNI:</strong> <span className="font-mono">{sale.customerDoc}</span></div>
                              )}
                              {sale.taxPayerType && (
                                <div><strong className="text-slate-800">Condición IVA:</strong> {sale.taxPayerType.replace('_', ' ').toUpperCase()}</div>
                              )}
                              {sale.customerPhone && (
                                <div><strong className="text-slate-800">Contacto:</strong> {sale.customerPhone}</div>
                              )}
                              {sale.deliveryAddress && (
                                <div className="sm:col-span-2"><strong className="text-slate-800">Entrega:</strong> {sale.deliveryAddress}</div>
                              )}
                              {sale.deliverySchedule && (
                                <div className="sm:col-span-2"><strong className="text-slate-800">Horario de entrega:</strong> {sale.deliverySchedule}</div>
                              )}
                              {sale.notes && (
                                <div className="sm:col-span-2"><strong className="text-slate-800">Notas:</strong> {sale.notes}</div>
                              )}
                            </div>

                            {/* Ticket Proof link or thumbnail */}
                            {sale.transferProofUrl && (
                              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                                <span className="font-bold text-slate-700">Ticket de Transferencia adjunto:</span>
                                <a
                                  href={sale.transferProofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-orange-600 hover:underline font-bold text-xs inline-flex items-center gap-1"
                                >
                                  Ver Comprobante ({sale.transferProofName || 'Archivo'})
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Detalle de renglones del ticket ({sale.items.length}):
                        </p>
                        <div className="space-y-1.5">
                          {sale.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1 border-b border-slate-200/50 last:border-0"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded text-[11px]">
                                  {item.quantity}x
                                </span>
                                <span className="font-semibold text-slate-900">{item.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">({item.sku})</span>
                              </div>
                              <div className="text-slate-700 font-medium">
                                {formatCurrency(item.unitPrice)} c/u = <strong className="text-slate-900">{formatCurrency(item.subtotal)}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: CUSTOMERS BASE & REMARKETING CRM */}
      {activeMainTab === 'customers' && (
        <CustomersRemarketingView
          sales={sales}
          company={company || {
            name: 'Titufaris',
            tagline: 'EQUIPAMIENTO COMERCIAL & LAYOUT',
            legalName: 'Titufaris Soluciones Comerciales S.R.L.',
            taxId: '30-71648291-8',
            address: 'Av. Juan B. Justo 4850, Parque Industrial',
            city: 'Córdoba / Buenos Aires, Argentina',
            phone: '+54 9 11 5824-9100',
            email: 'soloindustriasargentinas@gmail.com',
            website: 'https://titufaris.com.ar',
            currency: 'ARS',
            currencySymbol: '$',
            bankAccount: {
              bank: 'Banco Santander Río',
              alias: 'TITUFARIS.EQUIPAMIENTO',
              cbu: '0720045820000001849201',
              holder: 'Titufaris Soluciones Comerciales S.R.L.'
            },
            catalogNotes: '',
            termsAndConditions: ''
          }}
        />
      )}

      {/* SUB-VIEW 3: AUDIT LOGS */}
      {activeMainTab === 'logs' && (
        <div className="bg-white rounded-b-2xl border border-slate-200 border-t-0 shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Registro Detallado de Auditoría & Actividad
              </h3>
              <p className="text-xs text-slate-500">
                Historial cronológico de cambios de precios, modificaciones de stock y ventas multiusuario
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchLogs}
                  onChange={e => setSearchLogs(e.target.value)}
                  placeholder="Filtrar por usuario o detalle..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-orange-500"
                />
              </div>

              {/* Filter Action */}
              <select
                value={filterAction}
                onChange={e => setFilterAction(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none font-medium cursor-pointer"
              >
                <option value="all">Todas las acciones</option>
                <option value="sale_completed">Ventas POS</option>
                <option value="sale_cancelled">Ventas Anuladas</option>
                <option value="price_updated">Cambios de Precios</option>
                <option value="stock_adjusted">Ajustes de Inventario</option>
                <option value="catalog_exported">Exportaciones PDF</option>
                <option value="product_updated">Modificaciones</option>
              </select>
            </div>
          </div>

          {/* Logs Table / List */}
          <div className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Activity className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No se encontraron registros con este filtro</p>
              </div>
            ) : (
              filteredLogs.map(log => (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {log.userName.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-xs text-slate-900">
                          {log.title}
                        </h4>
                        {getActionBadge(log.action)}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {log.details}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                        <span>Operador: <strong>{log.userName}</strong> ({log.userRole})</span>
                        <span>•</span>
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  {log.amount && (
                    <div className="shrink-0 text-right">
                      <span className="text-xs text-slate-400 block font-medium">Monto</span>
                      <span
                        className={`text-base font-black ${
                          log.amount < 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {log.amount > 0 ? '+' : ''}{formatCurrency(log.amount)}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ANULAR / CANCELAR VENTA */}
      {/* ========================================================================= */}
      {saleToCancel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  Anular Venta {saleToCancel.receiptNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Total cobrado: <strong className="text-slate-800">{formatCurrency(saleToCancel.total)}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Al anular esta venta, el monto dejará de computarse en las ventas activas y quedará asentado en el historial y en Firestore como ticket cancelado.
            </p>

            {/* Restitution Checkbox */}
            <label className="flex items-start gap-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-50 transition-colors">
              <input
                type="checkbox"
                checked={cancelRestoreStock}
                onChange={e => setCancelRestoreStock(e.target.checked)}
                className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
              />
              <div className="text-xs">
                <span className="font-bold text-amber-950 block">
                  Reincorporar stock de los artículos automáticamente (Recomendado)
                </span>
                <span className="text-amber-800/90 mt-0.5 block">
                  Suma nuevamente las unidades vendidas ({saleToCancel.items.reduce((acc, it) => acc + it.quantity, 0)} u.) al inventario del depósito.
                </span>
              </div>
            </label>

            {/* Reason selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Motivo de la anulación:
              </label>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-orange-500"
              >
                <option value="Devolución de mercadería por el cliente">Devolución de mercadería por el cliente</option>
                <option value="Error en cobro / Ticket duplicado">Error en cobro / Ticket duplicado</option>
                <option value="Cambio de producto">Cambio de producto</option>
                <option value="Pago rechazado / no acreditado">Pago rechazado / no acreditado</option>
                <option value="Cancelación solicitada por administración">Cancelación solicitada por administración</option>
                <option value="Otro motivo">Otro motivo</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSaleToCancel(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirmar Anulación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ELIMINAR VENTA DEFINITIVAMENTE */}
      {/* ========================================================================= */}
      {saleToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  ¿Eliminar Ticket {saleToDelete.receiptNumber}?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta acción borrará el registro de forma definitiva.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              El registro de la venta {saleToDelete.receiptNumber} será removido permanentemente de tu navegador y de Google Cloud Firestore.
            </p>

            {/* Restitution Checkbox */}
            {saleToDelete.paymentStatus !== 'cancelled' && (
              <label className="flex items-start gap-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-50 transition-colors">
                <input
                  type="checkbox"
                  checked={deleteRestoreStock}
                  onChange={e => setDeleteRestoreStock(e.target.checked)}
                  className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-amber-950 block">
                    Restituir unidades al inventario antes de borrar
                  </span>
                  <span className="text-amber-800/90 mt-0.5 block">
                    Devuelve las unidades ({saleToDelete.items.reduce((acc, it) => acc + it.quantity, 0)} u.) al stock actual.
                  </span>
                </div>
              </label>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSaleToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Registro</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
