import React, { useState } from 'react';
import { Layers, Plus, Trash2, X, AlertTriangle, ArrowRight, CheckCircle2, FolderKanban } from 'lucide-react';
import { Category, Product, User } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  products: Product[];
  currentUser: User;
  onAddCategory: (category: Category) => void;
  onRequestDeleteCategory: (category: Category) => void;
}

const PRESET_COLORS = [
  { name: 'Naranja', hex: '#F97316' },
  { name: 'Azul', hex: '#0284C7' },
  { name: 'Verde Esmeralda', hex: '#10B981' },
  { name: 'Violeta', hex: '#8B5CF6' },
  { name: 'Amarillo Dorado', hex: '#EAB308' },
  { name: 'Grafito', hex: '#0F172A' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Rojo', hex: '#EF4444' },
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  products,
  currentUser,
  onAddCategory,
  onRequestDeleteCategory,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0].hex);
  const [newCatDescription, setNewCatDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const canManage = currentUser.role === 'admin' || currentUser.permissions.canManageInventory;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setErrorMsg('Ingresa un nombre para la categoría.');
      return;
    }

    const slug = trimmed
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const id = slug || 'cat-' + Date.now();

    if (categories.some(c => c.id === id || c.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('Ya existe una categoría con ese nombre.');
      return;
    }

    const created: Category = {
      id,
      name: trimmed,
      iconName: 'FolderKanban',
      color: newCatColor,
      description: newCatDescription.trim() || undefined,
    };

    onAddCategory(created);
    setNewCatName('');
    setNewCatDescription('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Gestor de Categorías</h2>
              <p className="text-xs text-slate-300">
                Organiza las líneas de productos del catálogo de Titufaris
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* New Category Form */}
          {canManage && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-orange-600" />
                Nueva Categoría de Catálogo
              </h3>

              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Nombre de la Categoría *
                    </label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={e => {
                        setNewCatName(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Ej: Iluminación LED Comercial..."
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Color Distintivo
                    </label>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setNewCatColor(c.hex)}
                          title={c.name}
                          className={`w-6 h-6 rounded-full transition-transform cursor-pointer shadow-2xs ${
                            newCatColor.toLowerCase() === c.hex.toLowerCase()
                              ? 'scale-125 ring-2 ring-offset-2 ring-slate-800'
                              : 'hover:scale-110 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                      {/* Custom color picker */}
                      <label
                        title="Seleccionar color personalizado"
                        className="w-6 h-6 rounded-full border border-slate-300 overflow-hidden cursor-pointer relative flex items-center justify-center hover:scale-110 transition-transform shadow-2xs"
                        style={{ backgroundColor: newCatColor }}
                      >
                        <input
                          type="color"
                          value={newCatColor}
                          onChange={e => setNewCatColor(e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                      </label>
                      <span className="font-mono text-[10px] text-slate-500 font-bold ml-1 uppercase">
                        {newCatColor}
                      </span>
                    </div>

                    {/* Live Preview Badge */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Vista previa:</span>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase shadow-2xs"
                        style={{
                          backgroundColor: `${newCatColor}18`,
                          color: newCatColor,
                          border: `1px solid ${newCatColor}35`,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: newCatColor }}
                        />
                        <span className="truncate max-w-[150px]">
                          {newCatName.trim() || 'Nueva Categoría'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Descripción / Uso (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newCatDescription}
                    onChange={e => setNewCatDescription(e.target.value)}
                    placeholder="Ej: Accesorios de iluminación para estantes y vitrinas..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-orange-500 outline-none"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Categoría</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Categories List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Categorías Registradas ({categories.length})
              </h3>
              <span className="text-xs text-slate-500">
                Total de artículos: <strong>{products.length}</strong>
              </span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {categories.map(c => {
                const productCount = products.filter(p => p.category === c.id).length;
                return (
                  <div
                    key={c.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: c.color || '#F97316' }}
                      >
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase shadow-2xs"
                            style={{
                              backgroundColor: `${c.color || '#F97316'}18`,
                              color: c.color || '#ea580c',
                              border: `1px solid ${c.color || '#F97316'}35`,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: c.color || '#F97316' }}
                            />
                            {c.color || '#F97316'}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {productCount} {productCount === 1 ? 'artículo' : 'artículos'}
                          </span>
                        </div>
                        {c.description && (
                          <p className="text-xs text-slate-500 truncate mt-0.5 max-w-md">
                            {c.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => onRequestDeleteCategory(c)}
                          title={`Eliminar categoría "${c.name}"`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Eliminar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            Al eliminar una categoría con artículos, el sistema te solicitará a qué categoría reasignarlos.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
