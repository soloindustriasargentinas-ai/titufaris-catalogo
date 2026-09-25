import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Sparkles, RefreshCw, Layers, Check, Copy, Star, Image as ImageIcon, ImagePlus, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { Product, Category, ProductSpecification } from '../types';
import { compressImageFile } from '../utils/imageCompression';

interface ProductFormModalProps {
  product: Product | null;
  isDuplicate?: boolean;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'updatedAt' | 'updatedBy'> & { id?: string }) => void;
  onAddCategory?: (category: Category) => void;
  onOpenCategoryManager?: () => void;
  onDeleteCategory?: (category: Category) => void;
  onDelete?: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  isDuplicate = false,
  categories,
  isOpen,
  onClose,
  onSave,
  onAddCategory,
  onOpenCategoryManager,
  onDeleteCategory,
  onDelete,
  onDuplicate,
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [retailPrice, setRetailPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(3);
  const [unit, setUnit] = useState('unidad');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [specifications, setSpecifications] = useState<ProductSpecification[]>([
    { key: 'Medidas', value: '' },
    { key: 'Material', value: 'Chapa de acero doblada en frío' }
  ]);
  const [featured, setFeatured] = useState(false);
  const [isMadeToOrder, setIsMadeToOrder] = useState(false);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(15);
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#F97316');
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (product) {
      if (isDuplicate) {
        // Variant creation pre-fill
        const randomVariantNum = Math.floor(10 + Math.random() * 90);
        setSku(`${product.sku}-V${randomVariantNum}`);
        setName(`${product.name} (Variante)`);
        setBarcode(`77980${Math.floor(10000000 + Math.random() * 90000000)}`);
        setFeatured(false);
      } else {
        setSku(product.sku);
        setName(product.name);
        setBarcode(product.barcode || '');
        setFeatured(!!product.featured);
      }
      setCategory(product.category);
      setDescription(product.description);
      setCostPrice(product.costPrice);
      setWholesalePrice(product.wholesalePrice);
      setRetailPrice(product.retailPrice);
      setStock(product.stock);
      setMinStock(product.minStock);
      setUnit(product.unit || 'unidad');
      const prodImages = (
        product.images && product.images.length > 0
          ? product.images
          : product.imageUrl ? [product.imageUrl] : []
      ).filter(img => typeof img === 'string' && img.trim() !== '');
      setImages(prodImages);
      setImageUrl(prodImages[0] || (product.imageUrl && product.imageUrl.trim() !== '' ? product.imageUrl : ''));
      setTagsInput(product.tags ? product.tags.join(', ') : '');
      let initialSpecs: ProductSpecification[] = [];
      if (Array.isArray(product.specifications) && product.specifications.length > 0) {
        initialSpecs = product.specifications
          .filter(s => s && typeof s === 'object')
          .map(s => ({
            key: String(s.key || (s as any).name || '').trim(),
            value: String(s.value || (s as any).val || '').trim()
          }))
          .filter(s => s.key || s.value);
      } else if (product.specifications && typeof product.specifications === 'object') {
        initialSpecs = Object.entries(product.specifications).map(([k, v]) => ({
          key: String(k).trim(),
          value: String(typeof v === 'object' && v !== null ? (v as any).value || '' : v).trim()
        })).filter(s => s.key || s.value);
      }

      setSpecifications(
        initialSpecs.length > 0
          ? initialSpecs
          : [{ key: 'Medidas', value: '' }]
      );
      setIsMadeToOrder(!!product.isMadeToOrder);
      setLeadTimeDays(product.leadTimeDays ?? 15);
    } else {
      // Defaults for new product
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setSku(`TF-ART-${randomSuffix}`);
      setName('');
      setCategory(categories[0]?.id || 'gondolas');
      setDescription('');
      setCostPrice(50000);
      setWholesalePrice(75000);
      setRetailPrice(98000);
      setStock(15);
      setMinStock(4);
      setUnit('unidad');
      setImages([]);
      setImageUrl('');
      setBarcode(`77980${Math.floor(10000000 + Math.random() * 90000000)}`);
      setTagsInput('Comercial, Layout');
      setSpecifications([
        { key: 'Medidas', value: '1.20 x 0.50 x 2.00 m' },
        { key: 'Material', value: 'Chapa SAE 1010 fosfatizada' },
        { key: 'Capacidad de Carga', value: '120 kg por estante' }
      ]);
      setFeatured(false);
      setIsMadeToOrder(false);
      setLeadTimeDays(15);
    }
  }, [product, categories, isOpen]);

  if (!isOpen) return null;

  const handleImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];
    setIsCompressing(true);
    try {
      const compressedUrls = await Promise.all(
        fileList.map((file: File) => compressImageFile(file, 900, 0.76))
      );
      setImages(prev => {
        const cleanPrev = prev.filter(img => !img.includes('unsplash.com'));
        const combined = [...compressedUrls, ...cleanPrev];
        setImageUrl(combined[0] || '');
        return combined;
      });
    } catch (err) {
      console.warn('Error compressing image files:', err);
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    setImages(prev => {
      const cleanPrev = prev.filter(img => !img.includes('unsplash.com'));
      const combined = [...cleanPrev, trimmed];
      if (!imageUrl || imageUrl.includes('unsplash.com')) {
        setImageUrl(combined[0] || trimmed);
      }
      return combined;
    });
    setNewImageUrl('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(prev => {
      const filtered = prev.filter((_, i) => i !== indexToRemove);
      if (filtered.length > 0) {
        setImageUrl(filtered[0]);
      } else {
        setImageUrl('');
      }
      return filtered;
    });
  };

  const handleSetMainImage = (index: number) => {
    if (index === 0 || index >= images.length) return;
    const target = images[index];
    const rest = images.filter((_, i) => i !== index);
    const reordered = [target, ...rest];
    setImages(reordered);
    setImageUrl(target);
  };

  const handleDropImages = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fileList = (Array.from(files) as File[]).filter((f: File) => f.type.startsWith('image/'));
      if (fileList.length === 0) return;
      setIsCompressing(true);
      try {
        const compressedUrls = await Promise.all(
          fileList.map((file: File) => compressImageFile(file, 900, 0.76))
        );
        if (compressedUrls.length > 0) {
          setImages(prev => {
            const cleanPrev = prev.filter(img => !img.includes('unsplash.com'));
            const combined = [...compressedUrls, ...cleanPrev];
            setImageUrl(combined[0] || '');
            return combined;
          });
        }
      } catch (err) {
        console.warn('Error compressing dropped images:', err);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const generateBarcode = () => {
    const num = '77980' + Math.floor(10000000 + Math.random() * 90000000).toString();
    setBarcode(num);
  };

  const addSpecRow = (defaultKey = '', defaultValue = '') => {
    setSpecifications(prev => [...prev, { key: defaultKey, value: defaultValue }]);
  };

  const updateSpecRow = (idx: number, field: 'key' | 'value', val: string) => {
    setSpecifications(prev => {
      const copy = [...prev];
      if (copy[idx]) {
        copy[idx] = { ...copy[idx], [field]: val };
      }
      return copy;
    });
  };

  const removeSpecRow = (idx: number) => {
    setSpecifications(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateNewCategory = () => {
    if (!newCatName.trim() || !onAddCategory) return;
    const catId = newCatName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newCat: Category = {
      id: catId,
      name: newCatName.trim(),
      iconName: 'Layers',
      color: newCatColor || '#F97316',
      description: 'Categoría personalizada'
    };
    onAddCategory(newCat);
    setCategory(catId);
    setNewCatName('');
    setShowNewCatInput(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const validSpecs = specifications
      .map(s => ({
        key: s.key.trim() || 'Característica',
        value: s.value.trim()
      }))
      .filter(s => s.value.length > 0);
    const finalImages = images.length > 0 ? images : (imageUrl ? [imageUrl.trim()] : []);
    const primaryImg = finalImages[0] || imageUrl.trim() || '';

    onSave({
      ...(product && !isDuplicate ? { id: product.id } : {}),
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category,
      description: description.trim(),
      costPrice: Number(costPrice) || 0,
      wholesalePrice: Number(wholesalePrice) || 0,
      retailPrice: Number(retailPrice) || 0,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      unit: unit.trim() || 'unidad',
      imageUrl: primaryImg,
      images: finalImages,
      barcode: barcode.trim(),
      tags,
      specifications: validSpecs,
      featured,
      isMadeToOrder,
      leadTimeDays: isMadeToOrder ? (Number(leadTimeDays) || 15) : undefined,
      active: product && product.active !== undefined ? product.active : true,
    });
    onClose();
  };

  const marginRetail = costPrice > 0 ? (((retailPrice - costPrice) / costPrice) * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              {isDuplicate && <Copy className="w-5 h-5 text-orange-400" />}
              <span>
                {isDuplicate
                  ? 'Duplicar Artículo / Nueva Variante'
                  : product
                  ? 'Editar Producto & Precios'
                  : 'Nuevo Producto / Módulo de Equipamiento'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {isDuplicate
                ? `Copiando datos base de "${product?.name}". Ajusta dimensiones, color o precios para crear la variante.`
                : 'Complete los datos técnicos, fotos y lista de precios para el catálogo Titufaris'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Variant notification banner */}
          {isDuplicate && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-orange-950">
              <Sparkles className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Acelerador de Variantes:</strong> Todos los datos de la ficha técnica, imágenes y precios se copiaron del producto base. Modifica las medidas, materiales o SKU y pulsa <strong>«Crear Variante»</strong> para darlo de alta en el catálogo como nuevo producto.
              </div>
            </div>
          )}
          {/* General Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Nombre del Producto / Artículo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ej. Góndola Central Reforzada Doble Faz 2.00m"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Código / SKU *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="GON-CEN-200"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none font-mono font-bold uppercase"
              />
            </div>
          </div>

          {/* Category & Barcode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Categoría del Catálogo
                </label>
                <div className="flex items-center gap-2">
                  {onOpenCategoryManager && (
                    <button
                      type="button"
                      onClick={onOpenCategoryManager}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer flex items-center gap-1"
                      title="Abrir gestor para organizar o eliminar categorías"
                    >
                      <Layers className="w-3 h-3 text-orange-600" />
                      Gestionar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(!showNewCatInput)}
                    className="text-xs text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
                  >
                    + Nueva
                  </button>
                </div>
              </div>

              {showNewCatInput ? (
                <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="Nombre de nueva categoría..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleCreateNewCategory}
                      className="px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-orange-700 transition-colors"
                    >
                      Crear
                    </button>
                  </div>
                  {/* Inline Color Palette & Picker */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Color:</span>
                    {['#F97316', '#0284C7', '#10B981', '#8B5CF6', '#EAB308', '#0F172A', '#EC4899', '#EF4444'].map(hex => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setNewCatColor(hex)}
                        className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${
                          newCatColor.toLowerCase() === hex.toLowerCase()
                            ? 'scale-125 ring-2 ring-slate-800'
                            : 'hover:scale-110 opacity-80'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                    <label
                      title="Color personalizado"
                      className="w-5 h-5 rounded-full border border-slate-300 relative overflow-hidden cursor-pointer flex items-center justify-center hover:scale-110"
                      style={{ backgroundColor: newCatColor }}
                    >
                      <input
                        type="color"
                        value={newCatColor}
                        onChange={e => setNewCatColor(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {/* Active category color dot inside the select */}
                    {(() => {
                      const curCat = categories.find(c => c.id === category);
                      const catColor = curCat?.color || '#F97316';
                      return (
                        <span
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-2xs pointer-events-none"
                          style={{ backgroundColor: catColor }}
                        />
                      );
                    })()}
                  </div>
                  {onDeleteCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        const currentCat = categories.find(c => c.id === category);
                        if (currentCat) {
                          onDeleteCategory(currentCat);
                        }
                      }}
                      title="Eliminar esta categoría"
                      className="p-2 border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Código de Barras (EAN-13)
                </label>
                <button
                  type="button"
                  onClick={generateBarcode}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Generar
                </button>
              </div>
              <input
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                placeholder="7798012340018"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Pricing Section - Highly detailed */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Estructura de Precios & Margen
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Margen Minorista: +{marginRetail}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">
                  Costo de Fabricación / Compra ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={e => setCostPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-orange-500 outline-none font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">
                  Precio Mayorista ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={wholesalePrice}
                  onChange={e => setWholesalePrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-orange-500 outline-none font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">
                  Precio Minorista / PVP ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={retailPrice}
                  onChange={e => setRetailPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-orange-300 rounded-xl focus:border-orange-500 outline-none font-black text-orange-600 text-base"
                />
              </div>
            </div>
          </div>

          {/* Stock & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Stock Disponible
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={e => setStock(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Alerta Stock Mínimo
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={e => setMinStock(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Unidad de Venta
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium cursor-pointer"
              >
                <option value="unidad">unidad</option>
                <option value="módulo">módulo</option>
                <option value="tramo">tramo</option>
                <option value="metro">metro</option>
                <option value="juego">juego</option>
                <option value="set">set</option>
              </select>
            </div>
          </div>

          {/* Modalidad de Entrega / Fabricación a Pedido */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span>Disponibilidad & Modalidad de Entrega</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Indica si el producto tiene stock para entrega inmediata o si solo se fabrica a pedido.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setIsMadeToOrder(false)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  !isMadeToOrder
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  checked={!isMadeToOrder}
                  onChange={() => setIsMadeToOrder(false)}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Disponible para Entrega Inmediata</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Cuenta con stock físico en depósito/planta listo para despacho.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setIsMadeToOrder(true)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  isMadeToOrder
                    ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  checked={isMadeToOrder}
                  onChange={() => setIsMadeToOrder(true)}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">Solo Fabricación a Pedido</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Se produce bajo pedido con plazo de fabricación estimado.
                  </p>
                </div>
              </label>
            </div>

            {isMadeToOrder && (
              <div className="p-3.5 bg-white rounded-xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Demora estimada de fabricación y entrega:
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    En la tienda pública y catálogo figurará: <strong>"Fabricación a pedido (Demora aprox. {leadTimeDays || 15} días)"</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={leadTimeDays}
                    onChange={e => setLeadTimeDays(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20 px-3 py-1.5 text-sm font-black text-center text-indigo-800 bg-indigo-50 border border-indigo-300 rounded-lg outline-none focus:border-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-700">días hábiles</span>
                </div>
              </div>
            )}
          </div>

          {/* Photo & Multi-Image Gallery Manager */}
          <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-orange-600" />
                <span>Galería de Fotos del Producto</span>
              </label>
              <span className="text-xs font-mono font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                {images.length} {images.length === 1 ? 'imagen' : 'imágenes'}
              </span>
            </div>

            {/* Upload Buttons & URL Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* File upload from device */}
              <div>
                <label className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors ${
                  isCompressing
                    ? 'bg-slate-700 text-slate-200 cursor-wait'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}>
                  {isCompressing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                      <span>Optimizando fotos de alta resolución...</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="w-4 h-4" />
                      <span>Cargar fotos desde dispositivo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isCompressing}
                    onChange={handleImageFiles}
                    className="hidden"
                  />
                </label>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
                  <span>JPG, PNG, WEBP (múltiples)</span>
                  <span className="text-emerald-700 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Auto-optimizado antidesborde
                  </span>
                </div>
              </div>

              {/* Add by URL */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  placeholder="https://ejemplo.com/foto.jpg"
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-orange-500 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleAddImageUrl()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shrink-0"
                >
                  + URL
                </button>
              </div>
            </div>

            {/* Drag and drop zone & thumbnails preview */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDropImages}
              className={`p-3 rounded-xl border-2 border-dashed transition-colors ${
                isDragOver
                  ? 'border-orange-500 bg-orange-50/70'
                  : 'border-slate-300 bg-white/80'
              }`}
            >
              {images.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <Upload className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                  <span>Arrastra fotos aquí o usa los botones superiores</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                  {images.filter(img => typeof img === 'string' && img.trim() !== '').map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-xl overflow-hidden border group bg-slate-50 transition-all ${
                        idx === 0
                          ? 'ring-2 ring-orange-500 border-orange-500 shadow-xs'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={img || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80'}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80';
                        }}
                      />

                      {/* Main Photo Badge or Button */}
                      {idx === 0 ? (
                        <div className="absolute top-1 left-1 bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs pointer-events-none">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          <span>Principal</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetMainImage(idx)}
                          title="Fijar como foto principal"
                          className="absolute top-1 left-1 bg-slate-900/80 hover:bg-orange-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shadow-xs cursor-pointer"
                        >
                          <Star className="w-2.5 h-2.5" />
                          <span>Principal</span>
                        </button>
                      )}

                      {/* Delete Photo Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        title="Eliminar esta foto"
                        className="absolute top-1 right-1 p-1 rounded-md bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-xs cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Descripción Detallada
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describa el producto, usos comerciales, terminaciones, opciones de personalización..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-normal"
            />
          </div>

          {/* Technical Specifications (Dynamic Key/Value Builder) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Especificaciones Técnicas (Ficha para Catálogo)
                </label>
                <p className="text-[11px] text-slate-500">
                  Sin límite de filas. Ambos campos (nombre y valor) deben tener texto para guardarse.
                </p>
              </div>
              <button
                type="button"
                onClick={() => addSpecRow()}
                className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar fila
              </button>
            </div>

            {/* Quick preset suggestions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Sugerencias:</span>
                {[
                  { label: '+ Medidas', key: 'Medidas' },
                  { label: '+ Altura', key: 'Altura' },
                  { label: '+ Largo', key: 'Largo' },
                  { label: '+ Profundidad', key: 'Profundidad' },
                  { label: '+ Carga / Estante', key: 'Capacidad de Carga' },
                  { label: '+ Cantidad Estantes', key: 'Cantidad de Estantes' },
                  { label: '+ Material', key: 'Material' },
                  { label: '+ Terminación', key: 'Terminación' },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => addSpecRow(preset.key, '')}
                    className="px-2 py-0.5 text-[10.5px] rounded-md bg-slate-100 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const standardEquipmentSpecs = [
                    { key: 'Altura', value: '1,60 metros' },
                    { key: 'Largo', value: '1,20 metros' },
                    { key: 'Profundidad de estantes', value: '38 cm' },
                    { key: 'Cantidad de estantes', value: '4 niveles reforzados' },
                    { key: 'Capacidad de carga / estante', value: '120 Kilos' },
                    { key: 'Material & Pintura', value: 'Chapa de acero SAE 1010 con pintura epoxi horneada' }
                  ];
                  setSpecifications(prev => {
                    const existingKeys = new Set(prev.map(s => s.key.toLowerCase().trim()));
                    const filtered = standardEquipmentSpecs.filter(s => !existingKeys.has(s.key.toLowerCase()));
                    return [...prev.filter(s => s.key.trim() || s.value.trim()), ...filtered];
                  });
                }}
                className="text-[11px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                title="Carga automáticamente las especificaciones típicas de equipamiento comercial"
              >
                ⚡ Cargar plantilla comercial
              </button>
            </div>

            <div className="space-y-2">
              {specifications.map((spec, idx) => {
                const isKeyEmpty = !spec.key.trim();
                const isValEmpty = !spec.value.trim();
                const isIncomplete = (isKeyEmpty && !isValEmpty) || (!isKeyEmpty && isValEmpty);

                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Característica (ej. Altura, Carga)"
                        value={spec.key}
                        onChange={e => updateSpecRow(idx, 'key', e.target.value)}
                        className={`w-1/3 px-3 py-1.5 text-xs rounded-lg outline-none font-medium transition-colors ${
                          isKeyEmpty && !isValEmpty
                            ? 'bg-amber-50 border border-amber-400 focus:bg-white'
                            : 'bg-slate-50 border border-slate-300 focus:bg-white focus:border-orange-500'
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Valor (ej. 2.00 m, 180 kg por nivel)"
                        value={spec.value}
                        onChange={e => updateSpecRow(idx, 'value', e.target.value)}
                        className={`flex-1 px-3 py-1.5 text-xs rounded-lg outline-none transition-colors ${
                          !isKeyEmpty && isValEmpty
                            ? 'bg-amber-50 border border-amber-400 focus:bg-white'
                            : 'bg-slate-50 border border-slate-300 focus:bg-white focus:border-orange-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecRow(idx)}
                        title="Eliminar fila de especificación"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {isIncomplete && (
                      <p className="text-[10px] text-amber-600 pl-1 font-medium">
                        ⚠️ Completa ambos campos para que esta característica se guarde.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tags & Featured Checkbox */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Etiquetas / Tags (separadas por comas)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="Góndola, Supermercado, Reforzada"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-4 sm:pt-0">
              <label className="relative flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={e => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded-sm border-slate-300 focus:ring-orange-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  Destacar en Portada del Catálogo
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {product && !isDuplicate && (
              <>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onDelete(product);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl border border-red-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Artículo</span>
                  </button>
                )}
                {onDuplicate && (
                  <button
                    type="button"
                    onClick={() => {
                      onDuplicate(product);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-xl border border-slate-300 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-orange-600" />
                    <span>Duplicar Variante</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {isDuplicate
                  ? 'Crear Variante'
                  : product
                  ? 'Guardar Cambios'
                  : 'Crear Producto'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
