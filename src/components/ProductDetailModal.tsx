import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  ShoppingCart,
  Edit3,
  Plus,
  Minus,
  Tag,
  CheckCircle,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Move,
  Eye,
  Info,
  Copy,
  Trash2,
  Image as ImageIcon,
  ImagePlus,
  Upload,
  ChevronLeft,
  ChevronRight,
  Star,
  Link as LinkIcon,
  RefreshCw,
  Clock,
  Truck,
  Check,
  SlidersHorizontal,
  MessageCircle,
} from 'lucide-react';
import { Product, Category, User, CompanyProfile } from '../types';
import { formatCurrency } from '../utils/storage';
import { compressImageFile } from '../utils/imageCompression';
import { openWhatsAppProductInquiry } from '../utils/whatsAppCatalog';

interface ProductDetailModalProps {
  product: Product | null;
  category?: Category;
  company: CompanyProfile;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit: (product: Product) => void;
  onOpenQR: (product: Product) => void;
  onAddToCart: (product: Product, priceType?: 'retail' | 'wholesale') => void;
  onStockChange: (product: Product, newStock: number) => void;
  onDuplicateProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
  onUpdateProductImages?: (product: Product, newImages: string[]) => void;
  isStaffMode?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  category,
  company,
  currentUser,
  isOpen,
  onClose,
  onOpenEdit,
  onOpenQR,
  onAddToCart,
  onStockChange,
  onDuplicateProduct,
  onDeleteProduct,
  onUpdateProductImages,
  isStaffMode = false,
}) => {
  // Photo Gallery State
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputMode, setUrlInputMode] = useState<'replace' | 'add'>('add');
  const [copiedSpecs, setCopiedSpecs] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputReplaceRef = useRef<HTMLInputElement | null>(null);
  const fileInputAddRef = useRef<HTMLInputElement | null>(null);

  // Zoom & Pan state for inline viewer
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  // Fullscreen Lightbox Zoom state
  const [isFullscreenZoom, setIsFullscreenZoom] = useState(false);
  const [fsZoom, setFsZoom] = useState(1);
  const [fsPan, setFsPan] = useState({ x: 0, y: 0 });
  const [isFsDragging, setIsFsDragging] = useState(false);
  const fsDragStartRef = useRef({ x: 0, y: 0 });
  const fsHasDraggedRef = useRef(false);

  // Reset when product or open state changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsFullscreenZoom(false);
    setFsZoom(1);
    setFsPan({ x: 0, y: 0 });
  }, [product?.id, isOpen]);

  // Handle ESC key for fullscreen lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenZoom) {
        setIsFullscreenZoom(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenZoom]);

  if (!isOpen || !product) return null;

  const canEditPrices = isStaffMode && (currentUser.permissions.canEditPrices || currentUser.role === 'admin');
  const canManageInventory = isStaffMode && (currentUser.permissions.canManageInventory || currentUser.role === 'admin');
  const canViewCost = isStaffMode && (currentUser.role === 'admin' || currentUser.role === 'supervisor');
  const canModifyProduct = isStaffMode && (currentUser.role === 'admin' || currentUser.permissions.canManageInventory);

  const marginRetail = product.costPrice > 0
    ? (((product.retailPrice - product.costPrice) / product.costPrice) * 100).toFixed(1)
    : '0';

  const marginWholesale = product.costPrice > 0
    ? (((product.wholesalePrice - product.costPrice) / product.costPrice) * 100).toFixed(1)
    : '0';

  // Photo Gallery derivations & handlers
  const currentImages: string[] =
    product?.images && product.images.length > 0
      ? product.images.filter(img => typeof img === 'string' && img.trim() !== '')
      : product?.imageUrl && product.imageUrl.trim() !== ''
      ? [product.imageUrl]
      : [];

  const safeIdx = Math.max(0, Math.min(selectedImageIdx, Math.max(0, currentImages.length - 1)));
  const activeImage =
    (currentImages[safeIdx] && currentImages[safeIdx].trim() !== '')
      ? currentImages[safeIdx]
      : (product?.imageUrl && product.imageUrl.trim() !== '')
      ? product.imageUrl
      : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'replace' | 'add') => {
    const files = e.target.files;
    if (!files || files.length === 0 || !product || !onUpdateProductImages) return;

    const fileList = Array.from(files) as File[];
    setIsCompressing(true);
    try {
      const newUrls = await Promise.all(
        fileList.map((file: File) => compressImageFile(file, 1200, 0.82))
      );

      if (mode === 'replace') {
        const updated = [...currentImages];
        if (updated.length === 0) {
          updated.push(newUrls[0]);
        } else {
          updated[safeIdx] = newUrls[0];
        }
        onUpdateProductImages(product, updated);
      } else {
        const updated = [...currentImages, ...newUrls];
        onUpdateProductImages(product, updated);
        setSelectedImageIdx(currentImages.length);
      }
    } catch (err) {
      console.warn('Error compressing photos in detail modal:', err);
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customImageUrl.trim();
    if (!trimmed || !product || !onUpdateProductImages) return;

    if (urlInputMode === 'replace') {
      const updated = [...currentImages];
      if (updated.length === 0) {
        updated.push(trimmed);
      } else {
        updated[safeIdx] = trimmed;
      }
      onUpdateProductImages(product, updated);
    } else {
      const updated = [...currentImages, trimmed];
      onUpdateProductImages(product, updated);
      setSelectedImageIdx(currentImages.length);
    }

    setCustomImageUrl('');
    setShowUrlInput(false);
  };

  const handleDeleteImage = (indexToDelete?: number) => {
    if (!product || !onUpdateProductImages) return;
    const target = indexToDelete !== undefined ? indexToDelete : safeIdx;
    const updated = currentImages.filter((_, i) => i !== target);
    onUpdateProductImages(product, updated);
    if (safeIdx >= updated.length) {
      setSelectedImageIdx(Math.max(0, updated.length - 1));
    }
  };

  const handleSetMainPhoto = (index: number) => {
    if (!product || !onUpdateProductImages || index === 0 || index >= currentImages.length) return;
    const target = currentImages[index];
    const rest = currentImages.filter((_, i) => i !== index);
    const updated = [target, ...rest];
    onUpdateProductImages(product, updated);
    setSelectedImageIdx(0);
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentImages.length <= 1) return;
    setSelectedImageIdx(prev => (prev + 1) % currentImages.length);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentImages.length <= 1) return;
    setSelectedImageIdx(prev => (prev - 1 + currentImages.length) % currentImages.length);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleDropFiles = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!isStaffMode || !product || !onUpdateProductImages) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fileList = (Array.from(files) as File[]).filter((f: File) => f.type.startsWith('image/'));
      if (fileList.length === 0) return;
      setIsCompressing(true);
      try {
        const newUrls = await Promise.all(
          fileList.map((file: File) => compressImageFile(file, 1200, 0.82))
        );
        if (newUrls.length > 0) {
          const updated = [...currentImages, ...newUrls];
          onUpdateProductImages(product, updated);
          setSelectedImageIdx(currentImages.length);
        }
      } catch (err) {
        console.warn('Error compressing dropped photos:', err);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  // Inline Zoom Handlers
  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(prev => Math.min(Number((prev + 0.5).toFixed(1)), 4));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(prev => {
      const next = Math.max(Number((prev - 0.5).toFixed(1)), 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(Number((prev + 0.25).toFixed(2)), 4));
    } else {
      setZoom(prev => {
        const next = Math.max(Number((prev - 0.25).toFixed(2)), 1);
        if (next <= 1) {
          setPan({ x: 0, y: 0 });
          return 1;
        }
        return next;
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    hasDraggedRef.current = true;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoom <= 1 || e.touches.length !== 1) return;
    hasDraggedRef.current = true;
    setPan({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleImageClick = () => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    if (zoom === 1) {
      setZoom(2);
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  // Fullscreen Lightbox Handlers
  const handleFsWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setFsZoom(prev => Math.min(Number((prev + 0.3).toFixed(2)), 5));
    } else {
      setFsZoom(prev => {
        const next = Math.max(Number((prev - 0.3).toFixed(2)), 1);
        if (next <= 1) {
          setFsPan({ x: 0, y: 0 });
          return 1;
        }
        return next;
      });
    }
  };

  const handleFsMouseDown = (e: React.MouseEvent) => {
    if (fsZoom <= 1) return;
    setIsFsDragging(true);
    fsHasDraggedRef.current = false;
    fsDragStartRef.current = { x: e.clientX - fsPan.x, y: e.clientY - fsPan.y };
  };

  const handleFsMouseMove = (e: React.MouseEvent) => {
    if (!isFsDragging || fsZoom <= 1) return;
    fsHasDraggedRef.current = true;
    setFsPan({
      x: e.clientX - fsDragStartRef.current.x,
      y: e.clientY - fsDragStartRef.current.y,
    });
  };

  const handleFsMouseUp = () => {
    setIsFsDragging(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[94vh] sm:max-h-[92vh]">
          {/* Header */}
          <div className="bg-slate-900 text-white p-3.5 sm:p-4 px-4 sm:px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-md">
                {product.sku}
              </span>
              {(() => {
                const catColor = category?.color || '#F97316';
                const catName = category?.name || product.category;
                return (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md shadow-2xs"
                    style={{
                      backgroundColor: `${catColor}25`,
                      color: catColor,
                      border: `1px solid ${catColor}40`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: catColor }}
                    />
                    <span>{catName}</span>
                  </span>
                );
              })()}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenQR(product)}
                title="Ver y compartir Código QR"
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <QrCode className="w-5 h-5" />
              </button>
              {isStaffMode && onDuplicateProduct && (
                <button
                  onClick={() => {
                    onClose();
                    onDuplicateProduct(product);
                  }}
                  title="Duplicar artículo para crear variante"
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Copy className="w-5 h-5" />
                </button>
              )}
              {canEditPrices && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenEdit(product);
                  }}
                  title="Editar Producto"
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
              {isStaffMode && onDeleteProduct && (currentUser.role === 'admin' || currentUser.permissions.canManageInventory) && (
                <button
                  onClick={() => {
                    onClose();
                    onDeleteProduct(product);
                  }}
                  title="Eliminar artículo del catálogo"
                  className="p-2 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-900/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Main Visual & Key Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              {/* Image Container with Zoom, Pan, Multi-photo gallery & management */}
              <div className="space-y-3">
                {/* Hidden File Inputs for Replace and Add */}
                <input
                  type="file"
                  ref={fileInputReplaceRef}
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'replace')}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={fileInputAddRef}
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileChange(e, 'add')}
                  className="hidden"
                />

                {/* Gallery Header & Photo Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Fotografías
                    </span>
                    {currentImages.length > 0 && (
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                        {safeIdx + 1} / {currentImages.length}
                      </span>
                    )}
                  </div>

                  {canModifyProduct && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputReplaceRef.current?.click()}
                        title="Reemplazar la foto actual con una nueva imagen"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3 text-slate-500" />
                        <span className="hidden sm:inline">Cambiar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputAddRef.current?.click()}
                        title="Cargar más fotos a la galería de este artículo"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        <ImagePlus className="w-3 h-3" />
                        <span>+ Fotos</span>
                      </button>

                      {currentImages.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteImage()}
                          title="Eliminar la foto actual del artículo"
                          className="p-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        title="Cargar o cambiar foto mediante enlace URL"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline URL Input Form */}
                {showUrlInput && (
                  <form onSubmit={handleAddUrl} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in">
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={e => setCustomImageUrl(e.target.value)}
                      placeholder="https://ejemplo.com/foto.jpg"
                      className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg outline-none font-mono"
                    />
                    <select
                      value={urlInputMode}
                      onChange={e => setUrlInputMode(e.target.value as 'add' | 'replace')}
                      className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg outline-none font-medium cursor-pointer"
                    >
                      <option value="add">Agregar</option>
                      <option value="replace">Reemplazar</option>
                    </select>
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-orange-600 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-orange-700"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}

                {/* Main Image Box with Zoom, Pan, Navigation and Drag & Drop */}
                <div
                  className={`relative rounded-2xl overflow-hidden bg-slate-50 border aspect-4/3 flex items-center justify-center p-3 group shadow-inner transition-colors ${
                    isDragOver ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20' : 'border-slate-200'
                  }`}
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onClick={handleImageClick}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDropFiles}
                  style={{
                    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                  }}
                >
                  {/* The Active Image */}
                  <img
                    src={activeImage}
                    alt={product.name}
                    draggable={false}
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0, 0, 1)',
                    }}
                    className="max-w-full max-h-full w-auto h-auto object-contain select-none pointer-events-none"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80';
                    }}
                  />

                  {/* Badges: Featured and Primary Photo */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-auto">
                    {product.featured && (
                      <span className="bg-orange-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md pointer-events-none">
                        Destacado Titufaris
                      </span>
                    )}

                    {safeIdx === 0 && currentImages.length > 0 ? (
                      <span className="bg-slate-900/80 backdrop-blur-xs text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-orange-500/30 shadow-xs pointer-events-none">
                        <Star className="w-3 h-3 fill-orange-400" />
                        <span>Foto Principal</span>
                      </span>
                    ) : (
                      canModifyProduct && currentImages.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetMainPhoto(safeIdx);
                          }}
                          title="Fijar esta imagen como foto principal del catálogo"
                          className="bg-slate-900/80 hover:bg-orange-600 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                        >
                          <Star className="w-3 h-3" />
                          <span>Hacer Principal</span>
                        </button>
                      )
                    )}
                  </div>

                  {/* Previous and Next Navigation Arrows */}
                  {currentImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevPhoto}
                        title="Foto anterior"
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950/90 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 z-10 cursor-pointer shadow-md backdrop-blur-xs"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextPhoto}
                        title="Foto siguiente"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950/90 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 z-10 cursor-pointer shadow-md backdrop-blur-xs"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Drag indicator badge when zoomed */}
                  {zoom > 1 ? (
                    <div className="absolute top-3 right-3 bg-orange-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 pointer-events-none z-10">
                      <Move className="w-3 h-3" />
                      <span>Arrastra para mover</span>
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-slate-900/60 backdrop-blur-xs text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-md pointer-events-none z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-3 h-3 text-orange-400" />
                      <span>Clic o rueda para zoom</span>
                    </div>
                  )}

                  {/* Floating Zoom Controls Toolbar */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-3 inset-x-3 flex items-center justify-between bg-slate-900/85 backdrop-blur-md p-1.5 px-2.5 rounded-xl shadow-lg border border-white/10 text-white z-10"
                  >
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleZoomOut}
                        disabled={zoom <= 1}
                        title="Alejar (-)"
                        className="p-1 rounded-lg hover:bg-white/20 disabled:opacity-30 transition-colors cursor-pointer"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>

                      <span className="text-[11px] font-mono font-bold px-1.5 text-orange-300 select-none min-w-[42px] text-center">
                        {Math.round(zoom * 100)}%
                      </span>

                      <button
                        type="button"
                        onClick={handleZoomIn}
                        disabled={zoom >= 4}
                        title="Acercar (+)"
                        className="p-1 rounded-lg hover:bg-white/20 disabled:opacity-30 transition-colors cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>

                      {zoom > 1 && (
                        <button
                          type="button"
                          onClick={handleResetZoom}
                          title="Restablecer vista (100%)"
                          className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer ml-0.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setFsZoom(Math.max(zoom, 1.5));
                          setIsFullscreenZoom(true);
                        }}
                        title="Ver en pantalla completa con zoom ampliado"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Detalle Full</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Thumbnails Strip & Add Photo Quick Button */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {currentImages.map((img, idx) => {
                      const isSelected = idx === safeIdx;
                      return (
                        <div
                          key={idx}
                          className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden cursor-pointer group border transition-all ${
                            isSelected
                              ? 'ring-2 ring-orange-500 border-orange-500 shadow-md scale-105'
                              : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100 bg-slate-50'
                          }`}
                          onClick={() => {
                            setSelectedImageIdx(idx);
                            setZoom(1);
                            setPan({ x: 0, y: 0 });
                          }}
                        >
                          <img
                            src={img || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=80'}
                            alt={`Miniatura ${idx + 1}`}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=80';
                            }}
                          />
                          {idx === 0 && (
                            <div className="absolute bottom-0 inset-x-0 bg-orange-600 text-white text-[8px] font-bold text-center py-0.2">
                              Principal
                            </div>
                          )}
                          {canModifyProduct && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteImage(idx);
                              }}
                              title="Eliminar esta foto"
                              className="absolute top-0.5 right-0.5 p-0.5 rounded-md bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-xs"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {canModifyProduct && (
                      <button
                        type="button"
                        onClick={() => fileInputAddRef.current?.click()}
                        title="Agregar otra foto al artículo"
                        className="shrink-0 w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-500 hover:bg-orange-50/50 flex flex-col items-center justify-center text-slate-400 hover:text-orange-600 transition-all cursor-pointer group"
                      >
                        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-bold mt-0.5">+ Foto</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    {canModifyProduct ? (
                      <span>Arrastra fotos directamente sobre el recuadro para agregarlas</span>
                    ) : (
                      <span>Imágenes oficiales del catálogo Titufaris</span>
                    )}
                    <span className="font-medium">Zoom máx. 400%</span>
                  </div>
                </div>
              </div>

              {/* Title & Pricing Block */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 leading-snug">
                    {product.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Código de Barras: <span className="font-mono font-medium text-slate-700">{product.barcode}</span>
                  </p>
                </div>

                {/* Price Cards */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Precio Minorista (PVP)
                      </span>
                      <div className="text-2xl font-black text-orange-600">
                        {formatCurrency(product.retailPrice)}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">IVA Incluido</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Precio Mayorista (a partir de 10 unidades)
                      </span>
                      <div className="text-base font-bold text-slate-800">
                        {formatCurrency(product.wholesalePrice)}
                      </div>
                    </div>
                    {canViewCost && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Margen: +{marginWholesale}%
                      </span>
                    )}
                  </div>

                  {canViewCost && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Costo de Fabricación:</span>
                      <span className="font-semibold text-slate-700">{formatCurrency(product.costPrice)}</span>
                    </div>
                  )}
                </div>

                {/* Delivery & Production Status Banner */}
                <div
                  className={`p-3.5 rounded-xl border ${
                    product.isMadeToOrder
                      ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
                      : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {product.isMadeToOrder ? (
                      <>
                        <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                          Fabricación a Pedido
                        </span>
                        <span className="ml-auto text-[11px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                          Demora ~{product.leadTimeDays || 15} días
                        </span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                          Entrega Inmediata
                        </span>
                        <span className="ml-auto text-[11px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                          En Stock
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">
                    {product.isMadeToOrder
                      ? `Este modelo se produce bajo plano técnico y requerimientos a medida. Plazo estimado de fabricación y entrega: ${product.leadTimeDays || 15} días hábiles.`
                      : 'Disponibilidad inmediata con stock físico en planta/depósito para entrega o despacho directo.'}
                  </p>
                </div>

                {/* Stock Management Controls */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Disponibilidad en Depósito
                    </span>
                    {product.stock <= product.minStock ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Stock Crítico (Mín: {product.minStock})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Stock Normal
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      <strong className="text-xl font-extrabold text-slate-900">{product.stock}</strong> {product.unit}s disponibles
                    </span>

                    {canManageInventory && (
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                          onClick={() => onStockChange(product, Math.max(0, product.stock - 1))}
                          disabled={product.stock <= 0}
                          title="Restar 1 unidad"
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 shadow-2xs cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onStockChange(product, product.stock + 1)}
                          title="Sumar 1 unidad"
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Zoom shortcut */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Descripción del Producto & Uso
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setFsZoom(2);
                    setIsFullscreenZoom(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Inspeccionar fotografía en detalle</span>
                </button>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                {product.description}
              </p>
            </div>

            {/* Technical Specifications */}
            {(() => {
              const specs = Array.isArray(product.specifications)
                ? product.specifications.filter(s => s && s.key && s.value)
                : (product.specifications && typeof product.specifications === 'object'
                  ? Object.entries(product.specifications).map(([k, v]) => ({
                      key: String(k),
                      value: String(typeof v === 'object' && v !== null ? (v as any).value || '' : v)
                    })).filter(s => s.key && s.value)
                  : []);

              if (specs.length === 0) return null;

              const handleCopySpecs = () => {
                const text = `${product.name} (${product.sku})\n` + specs.map(s => `• ${s.key}: ${s.value}`).join('\n');
                navigator.clipboard?.writeText(text);
                setCopiedSpecs(true);
                setTimeout(() => setCopiedSpecs(false), 2000);
              };

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-orange-600" />
                      <span>Ficha Técnica & Dimensiones ({specs.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleCopySpecs}
                      className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors border border-slate-200"
                      title="Copiar especificaciones al portapapeles"
                    >
                      {copiedSpecs ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Ficha</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200 shadow-2xs">
                    <table className="w-full text-xs text-left">
                      <tbody>
                        {specs.map((spec, i) => (
                          <tr
                            key={i}
                            className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}
                          >
                            <td className="px-4 py-2.5 font-bold text-slate-700 w-2/5 border-b border-slate-100">
                              {spec.key}
                            </td>
                            <td className="px-4 py-2.5 text-slate-900 font-semibold border-b border-slate-100">
                              {spec.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Etiquetas / Categorización
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                    >
                      <Tag className="w-3 h-3 text-slate-400" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex items-center gap-2 justify-between sm:justify-start">
              <button
                type="button"
                onClick={() => onOpenQR(product)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-white text-xs transition-colors cursor-pointer active:bg-slate-100"
              >
                <QrCode className="w-4 h-4 text-orange-600" />
                <span>QR Catálogo</span>
              </button>
              <button
                type="button"
                onClick={() => openWhatsAppProductInquiry(product, company, 'retail')}
                title="Consultar por este producto en WhatsApp o compartir ficha técnica oficial"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                <span className="hidden sm:inline">WhatsApp</span>
                <span className="sm:hidden">WApp</span>
              </button>
              {canModifyProduct && onDuplicateProduct && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDuplicateProduct(product);
                  }}
                  title="Crear variante a partir de este artículo"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-orange-600" />
                  <span className="hidden sm:inline">Duplicar Variante</span>
                  <span className="sm:hidden">Duplicar</span>
                </button>
              )}
              {canModifyProduct && onDeleteProduct && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDeleteProduct(product);
                  }}
                  title="Eliminar este artículo del catálogo"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50/60 font-semibold text-red-700 hover:bg-red-100/70 text-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onAddToCart(product, 'wholesale');
                  onClose();
                }}
                disabled={product.stock <= 0}
                className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-100 text-xs transition-colors disabled:opacity-50 cursor-pointer text-center whitespace-nowrap min-h-[42px]"
              >
                Cargar x Mayor
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddToCart(product, 'retail');
                  onClose();
                }}
                disabled={product.stock <= 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 cursor-pointer min-h-[42px]"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isStaffMode ? 'Añadir a Terminal POS' : 'Añadir al Carrito'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL FOR HIGH-RESOLUTION ZOOM & PAN */}
      {isFullscreenZoom && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/95 backdrop-blur-md flex flex-col p-3 sm:p-6 select-none animate-in fade-in duration-200"
          onWheel={handleFsWheel}
          onMouseDown={handleFsMouseDown}
          onMouseMove={handleFsMouseMove}
          onMouseUp={handleFsMouseUp}
          onMouseLeave={handleFsMouseUp}
        >
          {/* Lightbox Top Header */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold bg-orange-600 px-2.5 py-1 rounded-md text-white">
                {product.sku}
              </span>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">{product.name}</h3>
                <p className="text-[11px] text-slate-400">
                  Inspección de alta resolución • Foto {safeIdx + 1} de {Math.max(1, currentImages.length)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreenZoom(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <X className="w-5 h-5" />
                <span className="hidden sm:inline">Cerrar inspección (ESC)</span>
              </button>
            </div>
          </div>

          {/* Lightbox Viewport */}
          <div
            className={`flex-1 overflow-hidden relative flex items-center justify-center ${
              fsZoom > 1 ? (isFsDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
            }`}
            onClick={() => {
              if (fsHasDraggedRef.current) {
                fsHasDraggedRef.current = false;
                return;
              }
              if (fsZoom <= 1) {
                setFsZoom(2.5);
              } else {
                setFsZoom(1);
                setFsPan({ x: 0, y: 0 });
              }
            }}
          >
            {/* Gallery Navigation in Lightbox */}
            {currentImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevPhoto();
                    setFsZoom(1);
                    setFsPan({ x: 0, y: 0 });
                  }}
                  title="Foto anterior"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center transition-all z-20 cursor-pointer shadow-lg border border-white/20"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextPhoto();
                    setFsZoom(1);
                    setFsPan({ x: 0, y: 0 });
                  }}
                  title="Foto siguiente"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center transition-all z-20 cursor-pointer shadow-lg border border-white/20"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <img
              src={activeImage}
              alt={product.name}
              draggable={false}
              style={{
                transform: `translate(${fsPan.x}px, ${fsPan.y}px) scale(${fsZoom})`,
                transformOrigin: 'center center',
                transition: isFsDragging ? 'none' : 'transform 0.15s ease-out',
                maxWidth: '90vw',
                maxHeight: '75vh',
              }}
              className="object-contain pointer-events-none select-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </div>

          {/* Lightbox Floating Controls Bottom Bar */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-orange-400" />
              <span>Arrastra con el cursor para moverte por la imagen ampliada</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 border border-white/15 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setFsZoom(prev => {
                  const next = Math.max(Number((prev - 0.5).toFixed(1)), 1);
                  if (next === 1) setFsPan({ x: 0, y: 0 });
                  return next;
                })}
                disabled={fsZoom <= 1}
                className="p-2 rounded-xl hover:bg-white/15 text-white disabled:opacity-30 transition-colors cursor-pointer"
                title="Alejar"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      setFsZoom(level);
                      if (level === 1) setFsPan({ x: 0, y: 0 });
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      Math.round(fsZoom) === level
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {level}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setFsZoom(prev => Math.min(Number((prev + 0.5).toFixed(1)), 5))}
                disabled={fsZoom >= 5}
                className="p-2 rounded-xl hover:bg-white/15 text-white disabled:opacity-30 transition-colors cursor-pointer"
                title="Acercar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setFsZoom(1);
                  setFsPan({ x: 0, y: 0 });
                }}
                className="p-2 rounded-xl hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
                title="Restablecer tamaño original"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
