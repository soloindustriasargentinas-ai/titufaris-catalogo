import { useState, useMemo } from 'react';
import { Product } from '../types';

export type StockFilterType = 'all' | 'low_stock' | 'in_stock' | 'out_of_stock';
export type CatalogSortOrder = 'manual' | 'featured_first' | 'name_asc' | 'price_asc' | 'price_desc';

export function useCatalogFilter(products: Product[]) {
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilterType>('all');
  const [displayPriceType, setDisplayPriceType] = useState<'retail' | 'wholesale'>('retail');
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [catalogSortOrder, setCatalogSortOrder] = useState<CatalogSortOrder>('manual');

  // Filtered Products for Staff Catalog View
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        if (!p.active) return false;
        const matchCat = selectedCategory === 'all' || p.category === selectedCategory;

        let matchStock = true;
        if (stockFilter === 'low_stock') {
          matchStock = p.stock <= p.minStock && p.stock > 0;
        } else if (stockFilter === 'out_of_stock') {
          matchStock = p.stock <= 0;
        } else if (stockFilter === 'in_stock') {
          matchStock = p.stock > 0;
        }

        const q = searchQuery.toLowerCase().trim();
        const matchQuery =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
          (p.specifications && p.specifications.some(s => s.key.toLowerCase().includes(q) || s.value.toLowerCase().includes(q)));

        return matchCat && matchStock && matchQuery;
      })
      .sort((a, b) => {
        if (isReorderMode || catalogSortOrder === 'manual') {
          return 0;
        }
        if (catalogSortOrder === 'featured_first') {
          const aFeat = a.featured ? 1 : 0;
          const bFeat = b.featured ? 1 : 0;
          if (aFeat !== bFeat) return bFeat - aFeat;
          return 0;
        }
        if (catalogSortOrder === 'name_asc') {
          return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
        }
        if (catalogSortOrder === 'price_asc') {
          const aPrice = displayPriceType === 'wholesale' ? a.wholesalePrice : a.retailPrice;
          const bPrice = displayPriceType === 'wholesale' ? b.wholesalePrice : b.retailPrice;
          return aPrice - bPrice;
        }
        if (catalogSortOrder === 'price_desc') {
          const aPrice = displayPriceType === 'wholesale' ? a.wholesalePrice : a.retailPrice;
          const bPrice = displayPriceType === 'wholesale' ? b.wholesalePrice : b.retailPrice;
          return bPrice - aPrice;
        }
        return 0;
      });
  }, [products, selectedCategory, stockFilter, searchQuery, isReorderMode, catalogSortOrder, displayPriceType]);

  // Filtered Products for Public Storefront
  const storeFilteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.active) return false;
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
        (p.specifications && p.specifications.some(s => s.key.toLowerCase().includes(q) || s.value.toLowerCase().includes(q)));

      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  return {
    viewLayout,
    setViewLayout,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    stockFilter,
    setStockFilter,
    displayPriceType,
    setDisplayPriceType,
    isReorderMode,
    setIsReorderMode,
    catalogSortOrder,
    setCatalogSortOrder,
    filteredProducts,
    storeFilteredProducts,
  };
}
