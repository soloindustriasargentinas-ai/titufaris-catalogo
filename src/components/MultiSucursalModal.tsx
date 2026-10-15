import React, { useState } from 'react';
import {
  X,
  Store,
  Warehouse,
  ArrowRightLeft,
  Boxes,
  Plus,
  CheckCircle2,
  AlertTriangle,
  History,
  Building2,
  MapPin,
  Phone,
  UserCheck,
  Zap,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Branch, BranchStockTransfer, Product, SaaSTenantStore } from '../types';
import {
  loadBranches,
  saveBranches,
  loadStockTransfers,
  saveStockTransfers,
  executeStockTransfer,
  ensureProductBranchStock
} from '../utils/branchStorage';
import { formatCurrency } from '../utils/storage';

interface MultiSucursalModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  currentTenant: SaaSTenantStore;
  currentUserName: string;
  onOpenUpgradeModal?: () => void;
  activeBranchId: string;
  onSelectActiveBranch: (branchId: string) => void;
}

export const MultiSucursalModal: React.FC<MultiSucursalModalProps> = ({
  isOpen,
  onClose,
  products,
  onUpdateProducts,
  currentTenant,
  currentUserName,
  onOpenUpgradeModal,
  activeBranchId,
  onSelectActiveBranch,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'transfer' | 'branches' | 'history'>('inventory');
  const [branches, setBranches] = useState<Branch[]>(() => loadBranches(currentTenant.id));
  const [transfers, setTransfers] = useState<BranchStockTransfer[]>(() => loadStockTransfers(currentTenant.id));

  // Branch creation form
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchManager, setNewBranchManager] = useState('');

  // Transfer form state
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [sourceBranchId, setSourceBranchId] = useState<string>(branches[0]?.id || '');
  const [targetBranchId, setTargetBranchId] = useState<string>(branches[1]?.id || '');
  const [transferQty, setTransferQty] = useState<number>(1);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferStatus, setTransferStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const isEnterpriseOrTrial =
    currentTenant.id === 'titufaris' ||
    currentTenant.planId === 'enterprise' ||
    currentTenant.subscriptionStatus === 'trial';

  // Ensure all products have branchStock initialized
  const initializedProducts = products.map(p => ensureProductBranchStock(p, branches));

  const filteredProducts = initializedProducts.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const selectedProduct = initializedProducts.find(p => p.id === selectedProductId) || initializedProducts[0];
  const sourceBranch = branches.find(b => b.id === sourceBranchId) || branches[0];
  const targetBranch = branches.find(b => b.id === targetBranchId) || branches[1];
  const availableInSource = selectedProduct?.branchStock?.[sourceBranchId] ?? 0;

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    const newBranch: Branch = {
      id: 'branch-' + Date.now(),
      name: newBranchName.trim(),
      code: newBranchCode.trim().toUpperCase() || `SUC-${branches.length + 1}`,
      address: newBranchAddress.trim() || 'Dirección no especificada',
      city: newBranchCity.trim() || 'Ciudad',
      phone: newBranchPhone.trim(),
      managerName: newBranchManager.trim() || currentUserName,
      isDefault: branches.length === 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const nextBranches = [...branches, newBranch];
    setBranches(nextBranches);
    saveBranches(nextBranches, currentTenant.id);

    // Initialize stock 0 for all products in this new branch
    const updated = products.map(p => ({
      ...p,
      branchStock: {
        ...(p.branchStock || {}),
        [newBranch.id]: 0,
      },
    }));
    onUpdateProducts(updated);

    // Reset form
    setNewBranchName('');
    setNewBranchCode('');
    setNewBranchAddress('');
    setNewBranchCity('');
    setNewBranchPhone('');
    setNewBranchManager('');
    setIsAddingBranch(false);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferStatus(null);

    if (!selectedProduct) {
      setTransferStatus({ success: false, message: 'Selecciona un artículo para transferir.' });
      return;
    }

    if (sourceBranchId === targetBranchId) {
      setTransferStatus({ success: false, message: 'La sucursal de origen y destino deben ser distintas.' });
      return;
    }

    if (transferQty <= 0) {
      setTransferStatus({ success: false, message: 'La cantidad a transferir debe ser mayor a 0.' });
      return;
    }

    if (transferQty > availableInSource) {
      setTransferStatus({
        success: false,
        message: `Stock insuficiente en ${sourceBranch.name}. Solo hay ${availableInSource} unidades disponibles.`
      });
      return;
    }

    try {
      const { updatedProduct, transferRecord } = executeStockTransfer(
        selectedProduct,
        sourceBranch,
        targetBranch,
        transferQty,
        currentUserName,
        transferNotes
      );

      const nextProducts = products.map(p => (p.id === updatedProduct.id ? updatedProduct : p));
      onUpdateProducts(nextProducts);

      const nextTransfers = [transferRecord, ...transfers];
      setTransfers(nextTransfers);
      saveStockTransfers(nextTransfers, currentTenant.id);

      setTransferStatus({
        success: true,
        message: `¡Transferencia exitosa! Se movieron ${transferQty} unidad(es) de "${selectedProduct.name}" desde ${sourceBranch.name} hacia ${targetBranch.name}.`
      });

      setTransferQty(1);
      setTransferNotes('');
    } catch (err: any) {
      setTransferStatus({ success: false, message: err?.message || 'Error al procesar transferencia' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-100 animate-fadeIn">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Store className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg">Gestión Multi-Sucursal & Depósitos</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Inventario Unificado
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sincronización de stock en tiempo real entre locales comerciales y depósitos de almacenamiento.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Plan Upgrade Banner if not Enterprise */}
        {!isEnterpriseOrTrial && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-900">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Función del Plan Empresa & Multi-Sucursal:</strong> Puedes probar las transferencias y la asignación de sucursales en este entorno. Para desbloquear terminales ilimitadas y sync en vivo en producción, escala tu tienda.
              </span>
            </div>
            {onOpenUpgradeModal && (
              <button
                onClick={onOpenUpgradeModal}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" /> Escalar a Plan Empresa
              </button>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 pt-3 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 px-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'inventory'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Stock por Sucursal ({products.length} artículos)</span>
          </button>

          <button
            onClick={() => setActiveTab('transfer')}
            className={`pb-3 px-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'transfer'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transferir Mercadería</span>
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            className={`pb-3 px-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'branches'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Sucursales & Depósitos ({branches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial de Movimientos ({transfers.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: INVENTORY MATRIX */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar por artículo, SKU o categoría..."
                  className="w-full sm:w-80 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-semibold">Punto de venta actual:</span>
                  <select
                    value={activeBranchId}
                    onChange={e => onSelectActiveBranch(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50 font-bold text-indigo-900 cursor-pointer outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3">Artículo / SKU</th>
                        <th className="p-3">Categoría</th>
                        {branches.map(b => (
                          <th key={b.id} className="p-3 text-center">
                            <div className="flex flex-col items-center">
                              <span>{b.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({b.code})</span>
                            </div>
                          </th>
                        ))}
                        <th className="p-3 text-center bg-slate-200/60 font-black">Total Unificado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map(p => {
                        const totalUnits = branches.reduce((sum, b) => sum + (p.branchStock?.[b.id] ?? 0), 0);
                        const isLow = totalUnits <= (p.minStock ?? 5);

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{p.name}</div>
                              <div className="font-mono text-[10px] text-slate-400">SKU: {p.sku}</div>
                            </td>
                            <td className="p-3 text-slate-600 capitalize">{p.category}</td>
                            {branches.map(b => {
                              const qty = p.branchStock?.[b.id] ?? 0;
                              return (
                                <td key={b.id} className="p-3 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${
                                      qty === 0
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : qty <= 3
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-slate-100 text-slate-800'
                                    }`}
                                  >
                                    {qty} {p.unit || 'u.'}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="p-3 text-center bg-slate-50/70 font-black">
                              <span
                                className={`px-2.5 py-1 rounded-md text-xs font-black ${
                                  isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {totalUnits} {p.unit || 'u.'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSFER STOCK */}
          {activeTab === 'transfer' && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-xs text-indigo-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Transferencia Inmediata entre Depósitos y Locales
                </p>
                <p className="text-slate-600">
                  El stock se descontará instantáneamente del depósito/sucursal de origen y se acreditará en el destino, quedando registrado en la auditoría contable.
                </p>
              </div>

              {transferStatus && (
                <div
                  className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
                    transferStatus.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {transferStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{transferStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleExecuteTransfer} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Artículo a Mover *
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    {initializedProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) &bull; Total en depósito: {branches.reduce((s, b) => s + (p.branchStock?.[b.id] ?? 0), 0)} {p.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sucursal de Origen (Emite) *
                    </label>
                    <select
                      value={sourceBranchId}
                      onChange={e => setSourceBranchId(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({selectedProduct?.branchStock?.[b.id] ?? 0} disp.)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sucursal de Destino (Recibe) *
                    </label>
                    <select
                      value={targetBranchId}
                      onChange={e => setTargetBranchId(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({selectedProduct?.branchStock?.[b.id] ?? 0} disp.)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cantidad de Unidades a Transferir *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={availableInSource}
                      value={transferQty}
                      onChange={e => setTransferQty(parseInt(e.target.value) || 1)}
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                      required
                    />
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Disponible en origen: <strong>{availableInSource}</strong> {selectedProduct?.unit || 'u.'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Notas / Remito de Traslado
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Reposición semanal de vidriera"
                      value={transferNotes}
                      onChange={e => setTransferNotes(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={availableInSource <= 0}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md"
                  >
                    <ArrowRightLeft className="w-4 h-4" /> Confirmar Transferencia
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: BRANCHES MANAGEMENT */}
          {activeTab === 'branches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Puntos de Venta & Depósitos Habilitados</h3>
                  <p className="text-xs text-slate-500">
                    Administra los locales físicos, franquicias o almacenes logísticos de tu negocio.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingBranch(!isAddingBranch)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> {isAddingBranch ? 'Cerrar Formulario' : 'Nueva Sucursal'}
                </button>
              </div>

              {isAddingBranch && (
                <form onSubmit={handleCreateBranch} className="bg-slate-50 p-4 rounded-xl border border-indigo-200 space-y-3 animate-fadeIn">
                  <h4 className="font-bold text-xs text-indigo-950 uppercase tracking-wider">Alta de Nueva Sucursal</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Nombre *</label>
                      <input
                        type="text"
                        placeholder="Ej: Sucursal Belgrano"
                        value={newBranchName}
                        onChange={e => setNewBranchName(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Código Único</label>
                      <input
                        type="text"
                        placeholder="Ej: SUC-03"
                        value={newBranchCode}
                        onChange={e => setNewBranchCode(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white uppercase font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Responsable</label>
                      <input
                        type="text"
                        placeholder="Ej: Laura Martínez"
                        value={newBranchManager}
                        onChange={e => setNewBranchManager(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Dirección</label>
                      <input
                        type="text"
                        placeholder="Av. Cabildo 2400"
                        value={newBranchAddress}
                        onChange={e => setNewBranchAddress(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Ciudad / Localidad</label>
                      <input
                        type="text"
                        placeholder="Buenos Aires"
                        value={newBranchCity}
                        onChange={e => setNewBranchCity(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Teléfono</label>
                      <input
                        type="text"
                        placeholder="+54 11 4780-0000"
                        value={newBranchPhone}
                        onChange={e => setNewBranchPhone(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg cursor-pointer"
                    >
                      Guardar Sucursal
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {branches.map(b => (
                  <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {b.code}
                      </span>
                      {b.isDefault && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Casa Matriz
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{b.name}</h4>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{b.address}{b.city ? `, ${b.city}` : ''}</span>
                      </div>
                      {b.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{b.phone}</span>
                        </div>
                      )}
                      {b.managerName && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <UserCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>Responsable: {b.managerName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TRANSFER HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Registro de Movimientos de Stock</h3>
              {transfers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No hay movimientos de mercadería registrados aún.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Artículo / SKU</th>
                        <th className="p-3">Origen</th>
                        <th className="p-3">Destino</th>
                        <th className="p-3 text-center">Cantidad</th>
                        <th className="p-3">Operador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transfers.map(tr => (
                        <tr key={tr.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-500">{new Date(tr.date).toLocaleDateString()} {new Date(tr.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900">{tr.productName}</span>
                            <span className="text-[10px] font-mono text-slate-400 block">{tr.sku}</span>
                          </td>
                          <td className="p-3 text-slate-700">{tr.sourceBranchName}</td>
                          <td className="p-3 text-slate-700">{tr.targetBranchName}</td>
                          <td className="p-3 text-center font-bold text-indigo-700">+{tr.quantity}</td>
                          <td className="p-3 text-slate-500">{tr.transferredBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Sincronización multi-caja en Google Firestore Cloud activa</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
