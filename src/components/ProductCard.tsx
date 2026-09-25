import React from 'react';
import {
  QrCode,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Minus,
  Eye,
  Edit,
  Copy,
  Trash2,
  GripVertical,
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Product, Category, User } from '../types';
import { formatCurrency } from '../utils/storage';
import { playBeep } from '../utils/audio';

interface ProductCardProps {
  product: Product;
  category?: Category;
  currentUser: User;
  onOpenDetail: (product: Product) => void;
  onOpenQR: (product: Product) => void;
  onAddToCart: (product: Product, priceType?: 'retail' | 'wholesale') => void;
  onStockChange: (product: Product, newStock: number) => void;
  onOpenEdit?: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  displayPriceType?: 'retail' | 'wholesale';
  isReorderMode?: boolean;
  orderIndex?: number;
  totalProducts?: number;
  onMove?: (productId: string, direction: 'up' | 'down' | 'first' | 'last') => void;
  onDragStart?: (e: React.DragEvent, productId: string) => void;
  onDragOver?: (e: React.DragEvent, productId: string) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetProductId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
  dropPosition?: 'before' | 'after' | null;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  category,
  currentUser,
  onOpenDetail,
  onOpenQR,
  onAddToCart,
  onStockChange,
  onOpenEdit,
  onDuplicate,
  onDelete,
  displayPriceType = 'retail',
  isReorderMode = false,
  orderIndex,
  totalProducts,
  onMove,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging = false,
  isDropTarget = false,
  dropPosition = null,
}) => {
  const canManageInventory = currentUser.permissions.canManageInventory || currentUser.role === 'admin';
  const canEditPrices = currentUser.permissions.canEditPrices || currentUser.role === 'admin';
  const canViewCost = currentUser.role === 'admin' || currentUser.role === 'supervisor';

  const isLowStock = product.stock <= product.minStock && product.stock > 0;
  const isOutOfStock = product.stock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    playBeep();
    onAddToCart(product, displayPriceType);
  };

  const handleStockInc = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStockChange(product, product.stock + 1);
  };

  const handleStockDec = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock > 0) {
      onStockChange(product, product.stock - 1);
    }
  };

  return (
    <div
      onClick={() => onOpenDetail(product)}
      draggable={canManageInventory}
      onDragStart={(e) => onDragStart?.(e, product.id)}
      onDragOver={(e) => onDragOver?.(e, product.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop?.(e, product.id)}
      onDragEnd={onDragEnd}
      className={`group bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer relative ${
        isDragging
          ? 'opacity-40 scale-[0.97] border-dashed border-2 border-orange-500 shadow-none'
          : isDropTarget
          ? 'border-orange-500 ring-4 ring-orange-400/40 bg-orange-50/20 scale-[1.02] shadow-md z-10'
          : isReorderMode
          ? 'border-orange-300 ring-2 ring-orange-200/50 hover:border-orange-400'
          : 'border-slate-200 hover:border-orange-300'
      }`}
    >
      {/* Drop position visual border indicators */}
      {isDropTarget && dropPosition === 'before' && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-orange-500 z-30 shadow-xs" />
      )}
      {isDropTarget && dropPosition === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-orange-500 z-30 shadow-xs" />
      )}

      {/* REORDER BAR (When Reorder Mode is active) */}
      {isReorderMode && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 text-white px-3 py-2 flex items-center justify-between border-b border-slate-800 select-none z-20"
        >
          <div className="flex items-center gap-1.5">
            <span
              title="Arrastre desde aquí para mover el producto"
              className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-slate-800 rounded text-orange-400"
            >
              <GripVertical className="w-4 h-4" />
            </span>
            <span className="bg-orange-600 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded shadow-2xs">
              #{orderIndex ?? '•'}
            </span>
          </div>

          {/* Quick Step Move Buttons */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              disabled={!orderIndex || orderIndex <= 1}
              onClick={() => onMove?.(product.id, 'first')}
              title="Mover al primer lugar del catálogo"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={!orderIndex || orderIndex <= 1}
              onClick={() => onMove?.(product.id, 'up')}
              title="Mover hacia adelante (1 posición antes)"
              className="px-1.5 py-1 rounded text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[10px]">Antes</span>
            </button>
            <button
              type="button"
              disabled={
                totalProducts !== undefined &&
                orderIndex !== undefined &&
                orderIndex >= totalProducts
              }
              onClick={() => onMove?.(product.id, 'down')}
              title="Mover hacia atrás (1 posición después)"
              className="px-1.5 py-1 rounded text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span className="text-[10px]">Después</span>
              <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
            </button>
            <button
              type="button"
              disabled={
                totalProducts !== undefined &&
                orderIndex !== undefined &&
                orderIndex >= totalProducts
              }
              onClick={() => onMove?.(product.id, 'last')}
              title="Mover al último lugar del catálogo"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Image Container - Adjusted to display the complete product without cutting */}
      <div className="relative w-full aspect-4/3 bg-slate-50 p-2.5 overflow-hidden shrink-0 flex items-center justify-center border-b border-slate-100">
        <img
          src={
            (product.images && product.images.length > 0 && product.images[0] && product.images[0].trim() !== '')
              ? product.images[0]
              : (product.publicImageUrl && product.publicImageUrl.trim() !== '')
              ? product.publicImageUrl
              : (product.imageUrl && product.imageUrl.trim() !== '')
              ? product.imageUrl
              : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80'
          }
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('unsplash.com')) {
              target.src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80';
            }
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1">
            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md pointer-events-auto">
              {product.sku}
            </span>
            {canManageInventory && !isReorderMode && orderIndex !== undefined && (
              <span
                title="Posición en el catálogo. Arrastre para reordenar"
                className="bg-slate-800/75 backdrop-blur-xs text-orange-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md pointer-events-auto flex items-center gap-0.5 cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="w-3 h-3 text-orange-400" />
                #{orderIndex}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {product.featured && (
              <span className="bg-orange-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-xs">
                Destacado
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenQR(product);
              }}
              title="Código QR"
              className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-xs text-slate-700 hover:text-orange-600 hover:bg-white flex items-center justify-center shadow-xs transition-colors pointer-events-auto cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
            </button>
            {onDuplicate && canManageInventory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(product);
                }}
                title="Duplicar para crear variante"
                className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-xs text-slate-700 hover:text-orange-600 hover:bg-white flex items-center justify-center shadow-xs transition-colors pointer-events-auto cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (currentUser.role === 'admin' || currentUser.permissions.canManageInventory) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product);
                }}
                title="Eliminar artículo"
                className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-xs text-slate-700 hover:text-red-600 hover:bg-white flex items-center justify-center shadow-xs transition-colors pointer-events-auto cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Stock & Delivery status overlay pill */}
        <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
          {product.isMadeToOrder ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-700/90 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-md shadow-xs">
              <Clock className="w-3 h-3 text-indigo-200" /> A pedido ({product.leadTimeDays ? `${product.leadTimeDays}d` : 'Demora a coord.'})
            </span>
          ) : isOutOfStock ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-600/90 backdrop-blur-xs text-white px-2 py-0.5 rounded-md">
              Agotado
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/90 backdrop-blur-xs text-white px-2 py-0.5 rounded-md">
              <AlertTriangle className="w-3 h-3" /> Bajo Stock ({product.stock})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-900/75 backdrop-blur-xs text-white px-2 py-0.5 rounded-md">
              Stock: {product.stock} {product.unit}s
            </span>
          )}
        </div>
      </div>

      {/* Product Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Distinct Color Badge */}
          {(() => {
            const catColor = category?.color || '#F97316';
            const catName = category?.name || product.category;
            return (
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase transition-colors shadow-2xs"
                  style={{
                    backgroundColor: `${catColor}14`,
                    color: catColor,
                    border: `1px solid ${catColor}30`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: catColor }}
                  />
                  <span className="truncate max-w-[170px]">
                    {catName}
                  </span>
                </span>
              </div>
            );
          })()}
          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
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

            return (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {specs.slice(0, 3).map((spec, sIdx) => (
                  <span
                    key={sIdx}
                    className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium border border-slate-200 truncate max-w-full"
                    title={`${spec.key}: ${spec.value}`}
                  >
                    <strong className="font-semibold text-slate-900">{spec.key}:</strong> {spec.value}
                  </span>
                ))}
                {specs.length > 3 && (
                  <span className="text-[9.5px] text-orange-600 font-bold self-center">
                    +{specs.length - 3} más
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          {/* Prices */}
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                {displayPriceType === 'wholesale' ? 'Precio Mayorista' : 'Precio Minorista'}
              </span>
              <div className="text-lg font-black text-slate-900 leading-tight">
                {formatCurrency(
                  displayPriceType === 'wholesale' ? product.wholesalePrice : product.retailPrice
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">
                {displayPriceType === 'wholesale' ? 'Minorista:' : 'Mayorista:'}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                {formatCurrency(
                  displayPriceType === 'wholesale' ? product.retailPrice : product.wholesalePrice
                )}
              </span>
            </div>
          </div>

          {/* Action Row - Optimized with 44px+ touch area for tablet operation */}
          <div className="flex items-center gap-2 mt-2">
            {canManageInventory && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200"
              >
                <button
                  onClick={handleStockDec}
                  disabled={isOutOfStock}
                  title="Restar 1 de inventario"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 text-xs font-bold text-slate-800 min-w-5 text-center">
                  {product.stock}
                </span>
                <button
                  onClick={handleStockInc}
                  title="Sumar 1 a inventario"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className="flex-1 h-9 min-h-[44px] sm:min-h-[36px] flex items-center justify-center gap-1.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-40 disabled:hover:bg-orange-600 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Venta POS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
