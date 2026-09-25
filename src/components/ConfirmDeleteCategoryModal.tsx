import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, ArrowRight, Layers, AlertCircle } from 'lucide-react';
import { Category, Product } from '../types';

interface ConfirmDeleteCategoryModalProps {
  isOpen: boolean;
  category: Category | null;
  categories: Category[];
  products: Product[];
  onClose: () => void;
  onConfirm: (categoryId: string, targetCategoryId?: string) => void;
}

export const ConfirmDeleteCategoryModal: React.FC<ConfirmDeleteCategoryModalProps> = ({
  isOpen,
  category,
  categories,
  products,
  onClose,
  onConfirm,
}) => {
  const otherCategories = categories.filter(c => c.id !== category?.id);
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');

  useEffect(() => {
    if (otherCategories.length > 0) {
      setTargetCategoryId(otherCategories[0].id);
    }
  }, [category, categories]);

  if (!isOpen || !category) return null;

  const assignedProducts = products.filter(p => p.category === category.id);
  const isOnlyCategory = categories.length <= 1;

  const handleConfirm = () => {
    if (isOnlyCategory) return;
    onConfirm(category.id, assignedProducts.length > 0 ? targetCategoryId : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-red-50 p-5 border-b border-red-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                ¿Eliminar categoría de catálogo?
              </h3>
              <p className="text-xs text-red-700 font-medium mt-0.5">
                {category.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {isOnlyCategory ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertCircle className="w-4 h-4" />
                <span>Acción no permitida</span>
              </div>
              <p>
                No es posible eliminar la única categoría existente en el catálogo. Primero crea otra categoría antes de eliminar esta.
              </p>
            </div>
          ) : assignedProducts.length > 0 ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    {assignedProducts.length} {assignedProducts.length === 1 ? 'artículo vinculado' : 'artículos vinculados'}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Para no desorganizar el inventario ni dejar artículos huérfanos, selecciona la categoría donde se reubicarán estos productos:
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reasignar artículos a:
                </label>
                <div className="relative">
                  <select
                    value={targetCategoryId}
                    onChange={e => setTargetCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 font-semibold text-slate-800 outline-none cursor-pointer"
                  >
                    {otherCategories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sample list of affected products */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-32 overflow-y-auto space-y-1 text-xs">
                <p className="font-bold text-slate-600 mb-1 text-[11px] uppercase tracking-wider">
                  Artículos que cambiarán de categoría:
                </p>
                {assignedProducts.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between text-slate-700 py-0.5">
                    <span className="truncate pr-2">{p.name}</span>
                    <span className="font-mono text-[10px] text-slate-500 shrink-0">{p.sku}</span>
                  </div>
                ))}
                {assignedProducts.length > 5 && (
                  <p className="text-[11px] text-slate-500 italic pt-1">
                    ... y {assignedProducts.length - 5} artículos más.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <p>
                La categoría <strong>{category.name}</strong> no tiene ningún artículo asociado en este momento.
              </p>
              <p className="text-slate-500">
                Se eliminará definitivamente de las opciones de filtro y de carga de productos.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          {!isOnlyCategory && (
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {assignedProducts.length > 0 ? 'Reasignar y Eliminar' : 'Eliminar Categoría'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
