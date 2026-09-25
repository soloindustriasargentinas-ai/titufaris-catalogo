import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
  FileJson,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  CloudUpload,
  Check,
  Download
} from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/storage';
import {
  scanBrowserForLostProducts,
  parseRawProductText,
  RecoveredItemSource
} from '../utils/recovery';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProducts: Product[];
  onRecoverProducts: (productsToRestore: Product[]) => void;
  onOpenBackupModal?: () => void;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({
  isOpen,
  onClose,
  currentProducts,
  onRecoverProducts,
  onOpenBackupModal,
}) => {
  const [activeTab, setActiveTab] = useState<'auto_scan' | 'quick_paste' | 'file_upload'>('auto_scan');
  const [scannedItems, setScannedItems] = useState<RecoveredItemSource[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pastedText, setPastedText] = useState('');
  const [parsedPastedProducts, setParsedPastedProducts] = useState<Product[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Run scanner when modal opens or tab changes
  useEffect(() => {
    if (isOpen) {
      handleRunScan();
    }
  }, [isOpen, currentProducts]);

  const handleRunScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const found = scanBrowserForLostProducts(currentProducts);
      setScannedItems(found);
      setSelectedIds(new Set(found.map(f => f.product.id)));
      setIsScanning(false);
    }, 400);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === scannedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(scannedItems.map(s => s.product.id)));
    }
  };

  const handleRestoreSelected = () => {
    const toRestore = scannedItems
      .filter(s => selectedIds.has(s.product.id))
      .map(s => s.product);

    if (toRestore.length > 0) {
      onRecoverProducts(toRestore);
      onClose();
    }
  };

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) return;
    const parsed = parseRawProductText(pastedText);
    setParsedPastedProducts(parsed);
  };

  const handleImportParsedText = () => {
    if (parsedPastedProducts.length > 0) {
      onRecoverProducts(parsedPastedProducts);
      setPastedText('');
      setParsedPastedProducts([]);
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus(`Leyendo ${file.name}...`);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const parsed = parseRawProductText(text);
        if (parsed.length > 0) {
          onRecoverProducts(parsed);
          setUploadStatus(`¡Éxito! Se importaron ${parsed.length} artículos a Firestore.`);
          setTimeout(() => {
            setUploadStatus(null);
            onClose();
          }, 1200);
        } else {
          setUploadStatus('No se reconocieron artículos válidos en el archivo.');
        }
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Recuperador de Artículos & Carga Masiva</h2>
              <p className="text-amber-100 text-xs mt-0.5">
                Restaura artículos anteriores de tu navegador o carga tus productos directamente a Firestore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('auto_scan')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'auto_scan'
                ? 'border-amber-600 text-amber-900 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
            Escaneo de Memoria Local ({scannedItems.length})
          </button>
          <button
            onClick={() => setActiveTab('quick_paste')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'quick_paste'
                ? 'border-amber-600 text-amber-900 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Pegado Rápido (Texto/Excel)
          </button>
          <button
            onClick={() => setActiveTab('file_upload')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'file_upload'
                ? 'border-amber-600 text-amber-900 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            Subir Archivo (CSV / JSON)
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: Auto Scan */}
          {activeTab === 'auto_scan' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Buscador automático de artículos perdidos</p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Este analizador examina las claves de almacenamiento del navegador, el registro de auditoría y el historial de ventas previas en busca de artículos que hayan quedado fuera del catálogo activo.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleRunScan}
                  disabled={isScanning}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'Analizando...' : 'Volver a escanear'}
                </button>

                {scannedItems.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-amber-800 hover:text-amber-900 font-semibold underline"
                  >
                    {selectedIds.size === scannedItems.length ? 'Desmarcar todos' : 'Seleccionar todos'}
                  </button>
                )}
              </div>

              {isScanning ? (
                <div className="py-12 text-center text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-600 mb-2" />
                  <p className="text-sm font-medium">Buscando artículos en la memoria del navegador...</p>
                </div>
              ) : scannedItems.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl p-6">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-slate-700">No se encontraron artículos residuales en caché</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                    La memoria temporal del navegador ya fue sincronizada o reemplazada. Si tienes una lista en Excel, CSV o una copia de seguridad JSON, puedes restaurarla en las pestañas siguientes.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setActiveTab('quick_paste')}
                      className="px-4 py-2 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Pegar lista de artículos
                    </button>
                    {onOpenBackupModal && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenBackupModal();
                        }}
                        className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        Abrir Copia de Seguridad JSON
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                  {scannedItems.map((item) => {
                    const isSelected = selectedIds.has(item.product.id);
                    return (
                      <div
                        key={item.product.id}
                        onClick={() => toggleSelect(item.product.id)}
                        className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-900">{item.product.name}</span>
                              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {item.product.sku}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>PVP: {formatCurrency(item.product.retailPrice)}</span>
                              <span>•</span>
                              <span className="capitalize">Cat: {item.product.category}</span>
                              <span>•</span>
                              <span className="text-[10px] text-amber-700 bg-amber-100/70 px-1 rounded">
                                Origen: {item.source.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-1 rounded-md">
                          Recuperable
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Quick Paste */}
          {activeTab === 'quick_paste' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Pega directamente filas copiadas de Excel, Google Sheets, texto separado por comas o tabulaciones.
                Formato recomendado: <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-800">Nombre, SKU, Precio, Stock, Categoría</code>
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`Ejemplo:\nExhibidor Giratorio 4 Caras, EXH-GIR-4C, 320000, 10, exhibidores\nGóndola Central Doble Faz, GON-CEN-01, 280000, 15, gondolas`}
                className="w-full h-44 p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={handleProcessPastedText}
                  disabled={!pastedText.trim()}
                  className="px-4 py-2 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                  Analizar Texto Pegado
                </button>

                {parsedPastedProducts.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <Check className="w-4 h-4" /> {parsedPastedProducts.length} artículos identificados
                  </span>
                )}
              </div>

              {parsedPastedProducts.length > 0 && (
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-emerald-900 uppercase">Vista previa de artículos a incorporar</h4>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 divide-y divide-emerald-100 text-xs">
                    {parsedPastedProducts.map((p, idx) => (
                      <div key={idx} className="pt-1.5 flex justify-between text-slate-800">
                        <span className="font-medium">{p.name} ({p.sku})</span>
                        <span className="font-bold text-emerald-700">{formatCurrency(p.retailPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: File Upload */}
          {activeTab === 'file_upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all"
              >
                <CloudUpload className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Haz clic para seleccionar tu archivo CSV, TXT o JSON</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Sube tu listado de artículos para cargarlos inmediatamente a la base de datos Firestore y sincronizarlos con todos los dispositivos.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {uploadStatus && (
                <div className="p-3 bg-amber-50 text-amber-900 text-xs font-semibold rounded-lg border border-amber-200 text-center">
                  {uploadStatus}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            {activeTab === 'auto_scan' && scannedItems.length > 0 && (
              <button
                onClick={handleRestoreSelected}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <CloudUpload className="w-4 h-4" />
                Restaurar y Guardar en Firestore ({selectedIds.size})
              </button>
            )}

            {activeTab === 'quick_paste' && parsedPastedProducts.length > 0 && (
              <button
                onClick={handleImportParsedText}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <CloudUpload className="w-4 h-4" />
                Subir {parsedPastedProducts.length} Artículos a Firestore
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
