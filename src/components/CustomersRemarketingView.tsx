import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Download,
  Copy,
  Check,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  FileSpreadsheet,
  Building,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Sale, CustomerRemarketingProfile, CompanyProfile } from '../types';
import { formatCurrency, formatDate } from '../utils/storage';
import {
  extractCustomersFromSales,
  exportCustomersToCSV,
  copyCustomerPhonesToClipboard,
  buildWhatsAppRemarketingLink,
} from '../utils/customers';

interface CustomersRemarketingViewProps {
  sales: Sale[];
  company: CompanyProfile;
}

export const CustomersRemarketingView: React.FC<CustomersRemarketingViewProps> = ({
  sales,
  company,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSegment, setFilterSegment] = useState<'all' | 'recurring' | 'vip' | 'inscripto' | 'with_phone'>('all');
  const [copiedPhones, setCopiedPhones] = useState<number | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [activeWhatsAppModal, setActiveWhatsAppModal] = useState<CustomerRemarketingProfile | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'promo' | 'novedades' | 'seguimiento'>('promo');

  // Extract deduplicated & aggregated customers from sales
  const allCustomers = useMemo(() => {
    return extractCustomersFromSales(sales);
  }, [sales]);

  // Overall Statistics
  const totalRevenue = useMemo(() => {
    return allCustomers.reduce((acc, c) => acc + c.totalSpent, 0);
  }, [allCustomers]);

  const avgOrderValue = useMemo(() => {
    const totalOrders = allCustomers.reduce((acc, c) => acc + c.ordersCount, 0);
    return totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  }, [allCustomers, totalRevenue]);

  const customersWithPhoneCount = useMemo(() => {
    return allCustomers.filter(c => c.phone && c.phone.trim().length >= 8).length;
  }, [allCustomers]);

  // Filtering
  const filteredCustomers = useMemo(() => {
    return allCustomers.filter(customer => {
      // Segment filter
      if (filterSegment === 'recurring' && customer.ordersCount < 2) return false;
      if (filterSegment === 'vip' && customer.totalSpent < 500000) return false;
      if (filterSegment === 'inscripto' && customer.taxPayerType !== 'responsable_inscripto') return false;
      if (filterSegment === 'with_phone' && (!customer.phone || customer.phone.trim().length < 8)) return false;

      // Query filter
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const matchesName = customer.name.toLowerCase().includes(q);
      const matchesDoc = customer.doc?.toLowerCase().includes(q);
      const matchesPhone = customer.phone?.toLowerCase().includes(q);
      const matchesEmail = customer.email?.toLowerCase().includes(q);
      const matchesAddress = customer.address?.toLowerCase().includes(q);
      const matchesProducts = customer.purchasedProducts.some(
        p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );

      return matchesName || matchesDoc || matchesPhone || matchesEmail || matchesAddress || matchesProducts;
    });
  }, [allCustomers, filterSegment, searchQuery]);

  // Actions
  const handleExportCSV = () => {
    exportCustomersToCSV(filteredCustomers, company.name);
  };

  const handleCopyPhones = async () => {
    const count = await copyCustomerPhonesToClipboard(filteredCustomers);
    setCopiedPhones(count);
    setTimeout(() => setCopiedPhones(null), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Base de Clientes Únicos
            </span>
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {allCustomers.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Consolidados por CUIT, Teléfono y Razón Social
          </p>
        </div>

        {/* Total LTV Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Facturación Acumulada (LTV)
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Gasto total histórico de clientes registrados
          </p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Ticket Promedio
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(avgOrderValue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Inversión promedio por compra de equipamiento
          </p>
        </div>

        {/* WhatsApp Verified Leads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Contactos con WhatsApp
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <MessageCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {customersWithPhoneCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Listos para campañas directas y fidelización
          </p>
        </div>
      </div>

      {/* Main CRM Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls & Export Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>Gestión de Clientes & Remarketing B2B</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Base de datos unificada con historial de compras, equipos instalados y canales de contacto directo.
            </p>
          </div>

          {/* Action Buttons: Export to CSV and Copy WhatsApps */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              id="btn-copy-crm-phones"
              onClick={handleCopyPhones}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs hover:border-slate-300"
              title="Copiar números de WhatsApp de los clientes filtrados para listas de difusión"
            >
              {copiedPhones !== null ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-extrabold">¡{copiedPhones} teléfonos copiados!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar WhatsApps</span>
                </>
              )}
            </button>

            <button
              id="btn-export-crm-excel"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer shadow-xs shadow-emerald-600/20"
              title="Descargar planilla compatible con Microsoft Excel y Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Excel / CSV ({filteredCustomers.length})</span>
            </button>
          </div>
        </div>

        {/* Search & Segment Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, CUIT, teléfono, equipo..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Segment Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setFilterSegment('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterSegment === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({allCustomers.length})
            </button>
            <button
              onClick={() => setFilterSegment('recurring')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterSegment === 'recurring'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Recurrentes (2+ compras)
            </button>
            <button
              onClick={() => setFilterSegment('vip')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterSegment === 'vip'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              VIP (&gt; $500k)
            </button>
            <button
              onClick={() => setFilterSegment('inscripto')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterSegment === 'inscripto'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Resp. Inscripto (Factura A)
            </button>
            <button
              onClick={() => setFilterSegment('with_phone')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterSegment === 'with_phone'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Con WhatsApp ({customersWithPhoneCount})
            </button>
          </div>
        </div>

        {/* Customers Table / List */}
        <div className="divide-y divide-slate-100">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No se encontraron clientes con este criterio</p>
              <p className="text-xs text-slate-400 mt-1">
                A medida que los clientes compren por la tienda web o por la terminal POS, sus perfiles se consolidarán aquí automáticamente.
              </p>
            </div>
          ) : (
            filteredCustomers.map(customer => {
              const isExpanded = expandedCustomerId === customer.id;
              const hasPhone = customer.phone && customer.phone.trim().length >= 8;
              const isVip = customer.totalSpent >= 500000;
              const isRecurring = customer.ordersCount > 1;

              return (
                <div
                  key={customer.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Customer identity & fiscal condition */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-slate-900">
                          {customer.name}
                        </span>

                        {isVip && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            VIP
                          </span>
                        )}

                        {isRecurring && (
                          <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {customer.ordersCount} compras
                          </span>
                        )}

                        {customer.taxPayerType && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {customer.taxPayerType === 'responsable_inscripto'
                              ? 'Resp. Inscripto (Factura A)'
                              : customer.taxPayerType.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      {/* Contact and Identification Bar */}
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                        {customer.doc && (
                          <div className="flex items-center gap-1 font-mono font-medium text-slate-700">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>CUIT / DNI: {customer.doc}</span>
                          </div>
                        )}

                        {customer.phone && (
                          <div className="flex items-center gap-1 font-medium text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{customer.phone}</span>
                          </div>
                        )}

                        {customer.email && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <a href={`mailto:${customer.email}`} className="hover:underline hover:text-orange-600">
                              {customer.email}
                            </a>
                          </div>
                        )}

                        {customer.address && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-xs">{customer.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Spend Metrics & Quick Contact Actions */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="text-left lg:text-right">
                        <div className="text-base sm:text-lg font-black text-slate-900">
                          {formatCurrency(customer.totalSpent)}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-300" />
                          <span>Última compra: {formatDate(customer.lastOrderDate)}</span>
                        </div>
                      </div>

                      {/* WhatsApp Remarketing Button */}
                      {hasPhone && (
                        <button
                          onClick={() => setActiveWhatsAppModal(customer)}
                          title="Contactar por WhatsApp con mensaje de remarketing"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs transition-all cursor-pointer shadow-2xs hover:scale-105"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                      )}

                      {/* Expand Details Button */}
                      <button
                        onClick={() => setExpandedCustomerId(isExpanded ? null : customer.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title={isExpanded ? 'Contraer historial' : 'Ver productos adquiridos'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Breakdown: Products purchased & delivery details */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-200/80 bg-slate-50/80 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-150">
                      {/* Delivery and Notes Info */}
                      {(customer.address || customer.deliverySchedule) && (
                        <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                          <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wider block">
                            Información de Entrega y Logística:
                          </span>
                          {customer.address && (
                            <p className="text-slate-600">
                              <strong className="text-slate-800">Dirección:</strong> {customer.address}
                            </p>
                          )}
                          {customer.deliverySchedule && (
                            <p className="text-slate-600">
                              <strong className="text-slate-800">Horario habitual de recepción:</strong> {customer.deliverySchedule}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Products purchased summary */}
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-orange-600" />
                          <span>Equipamiento instalado / Artículos adquiridos ({customer.purchasedProducts.length}):</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {customer.purchasedProducts.map((p, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-2.5 rounded-lg border border-slate-200/90 text-xs flex items-center justify-between"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-semibold text-slate-900 block truncate">{p.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-extrabold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-[11px] block">
                                  {p.quantity} u.
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                                  {formatCurrency(p.totalAmount)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Receipts list */}
                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-bold text-slate-700">Comprobantes emitidos:</span>
                        {customer.salesReceipts.map((rec, idx) => (
                          <span
                            key={idx}
                            className="bg-white border border-slate-300 font-mono text-[11px] px-2 py-0.5 rounded text-slate-700"
                          >
                            {rec}
                          </span>
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

      {/* WhatsApp Remarketing Template Modal */}
      {activeWhatsAppModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <div className="p-2.5 bg-emerald-100 rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Campaña de WhatsApp Directa
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enviar mensaje personalizado a {activeWhatsAppModal.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveWhatsAppModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Template selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Seleccionar Enfoque del Mensaje:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('promo')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    selectedTemplate === 'promo'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="block font-extrabold">Promoción Especial</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Nuevas ofertas de fábrica</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate('novedades')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    selectedTemplate === 'novedades'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="block font-extrabold">Novedades & Stock</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Nuevos tramos y modelos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate('seguimiento')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    selectedTemplate === 'seguimiento'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="block font-extrabold">Posventa & Calidad</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Satisfacción y service</span>
                </button>
              </div>
            </div>

            {/* Message Preview */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Vista previa del texto que se abrirá en WhatsApp:
              </label>
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs text-slate-800 leading-relaxed font-sans">
                {selectedTemplate === 'promo' && (
                  <p>
                    Hola {activeWhatsAppModal.name.split(' ')[0]}! Te saludamos de {company.name} Equipamiento Comercial. Queremos contarte que tenemos promociones especiales y stock inmediato en líneas seleccionadas de góndolas, estanterías y racks para renovar tu local o depósito. ¿Te gustaría recibir nuestro catálogo actualizado con precios promocionales?
                  </p>
                )}
                {selectedTemplate === 'novedades' && (
                  <p>
                    Hola {activeWhatsAppModal.name.split(' ')[0]}! Desde {company.name} esperamos que tus instalaciones estén funcionando excelente. Acabamos de sumar nuevos modelos y tramos complementarios para optimizar tus espacios. Podés ver las novedades en nuestra tienda online. Avisanos si necesitás cotizar ampliaciones o nuevos proyectos.
                  </p>
                )}
                {selectedTemplate === 'seguimiento' && (
                  <p>
                    Hola {activeWhatsAppModal.name.split(' ')[0]}! Te escribimos de {company.name} para hacer seguimiento de tu compra reciente. ¿Todo llegó en perfectas condiciones? Estamos a tu disposición para cualquier consulta técnica o asesoramiento de layout.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveWhatsAppModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <a
                href={buildWhatsAppRemarketingLink(
                  activeWhatsAppModal.phone || '',
                  activeWhatsAppModal.name,
                  selectedTemplate,
                  company.name
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setActiveWhatsAppModal(null)}
                className="px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir Chat de WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
