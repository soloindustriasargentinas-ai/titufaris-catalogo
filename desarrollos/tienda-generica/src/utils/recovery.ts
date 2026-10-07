import { Product, Sale, ActivityLog } from '../types';
import { initialProducts } from '../data/initialData';
import { getDeletedProductIds, FAKE_ITEMS_TO_PURGE } from './storage';

export interface RecoveredItemSource {
  product: Product;
  source: 'localStorage_key' | 'activity_log' | 'sales_history' | 'sessionStorage';
  originalKeyOrId: string;
}

/**
 * Deep scans browser storage, activity logs, and sales history for any
 * products that may have existed locally before the cloud sync.
 */
export function scanBrowserForLostProducts(
  currentProducts: Product[]
): RecoveredItemSource[] {
  if (typeof window === 'undefined') return [];

  const deletedIds = getDeletedProductIds();
  const existingIds = new Set(currentProducts.map(p => p.id));
  const existingSkus = new Set(currentProducts.map(p => p.sku?.toLowerCase().trim()).filter(Boolean));
  const recovered: RecoveredItemSource[] = [];
  const recoveredIds = new Set<string>();

  // 1. Scan ALL localStorage keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      try {
        const rawValue = localStorage.getItem(key);
        if (!rawValue || rawValue.length < 10) continue;

        // Try parsing JSON
        if (rawValue.startsWith('[') || rawValue.startsWith('{')) {
          const parsed = JSON.parse(rawValue);

          // If it's an array of products
          const candidateArray: unknown[] = Array.isArray(parsed)
            ? parsed
            : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).products)
            ? ((parsed as Record<string, unknown>).products as unknown[])
            : [];

          for (const item of candidateArray) {
            if (
              item &&
              typeof item === 'object' &&
              'id' in item &&
              'name' in item &&
              'retailPrice' in item
            ) {
              const p = item as Product;
              if (deletedIds.has(p.id) || FAKE_ITEMS_TO_PURGE.has(p.id) || FAKE_ITEMS_TO_PURGE.has(p.sku)) {
                continue;
              }
              const skuNorm = (p.sku || '').toLowerCase().trim();
              if (!existingIds.has(p.id) && (!skuNorm || !existingSkus.has(skuNorm)) && !recoveredIds.has(p.id)) {
                recovered.push({
                  product: sanitizeProduct(p),
                  source: 'localStorage_key',
                  originalKeyOrId: key,
                });
                recoveredIds.add(p.id);
                if (skuNorm) existingSkus.add(skuNorm);
              }
            }
          }
        }
      } catch {
        // Skip unparseable key
      }
    }
  } catch (err) {
    console.warn('Storage scanner warning:', err);
  }

  // 2. Scan sessionStorage keys
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;

      try {
        const rawValue = sessionStorage.getItem(key);
        if (!rawValue || rawValue.length < 10) continue;

        if (rawValue.startsWith('[') || rawValue.startsWith('{')) {
          const parsed = JSON.parse(rawValue);
          const candidateArray: unknown[] = Array.isArray(parsed)
            ? parsed
            : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).products)
            ? ((parsed as Record<string, unknown>).products as unknown[])
            : [];

          for (const item of candidateArray) {
            if (
              item &&
              typeof item === 'object' &&
              'id' in item &&
              'name' in item
            ) {
              const p = item as Product;
              const skuNorm = (p.sku || '').toLowerCase().trim();
              if (!existingIds.has(p.id) && (!skuNorm || !existingSkus.has(skuNorm)) && !recoveredIds.has(p.id)) {
                recovered.push({
                  product: sanitizeProduct(p),
                  source: 'sessionStorage',
                  originalKeyOrId: key,
                });
                recoveredIds.add(p.id);
                if (skuNorm) existingSkus.add(skuNorm);
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  // 3. Scan Sales History (products that were sold previously)
  try {
    const rawSales = localStorage.getItem('titufaris_sales_v1');
    if (rawSales) {
      const sales = JSON.parse(rawSales) as Sale[];
      if (Array.isArray(sales)) {
        for (const sale of sales) {
          if (Array.isArray(sale.items)) {
            for (const item of sale.items) {
              const itemId = item.productId || 'recov-sale-' + item.sku;
              const itemSku = (item.sku || '').toLowerCase().trim();
              if (!existingIds.has(itemId) && (!itemSku || !existingSkus.has(itemSku)) && !recoveredIds.has(itemId)) {
                const recoveredProduct: Product = {
                  id: itemId,
                  sku: item.sku || `REC-${Date.now().toString().slice(-4)}`,
                  name: item.name || 'Artículo Recuperado de Ventas',
                  category: 'gondolas',
                  description: 'Artículo recuperado automáticamente desde el historial de ventas registradas.',
                  costPrice: Math.round(item.unitPrice * 0.65),
                  wholesalePrice: Math.round(item.unitPrice * 0.85),
                  retailPrice: item.unitPrice,
                  stock: 10,
                  minStock: 2,
                  unit: 'unidad',
                  barcode: (item.sku || itemId).replace(/[^0-9]/g, '').padEnd(12, '0').slice(0, 13) || '7791234567890',
                  imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
                  tags: ['Recuperado'],
                  specifications: [],
                  featured: false,
                  active: true,
                  updatedAt: sale.createdAt || new Date().toISOString(),
                  updatedBy: 'Recuperador Automático',
                };
                recovered.push({
                  product: recoveredProduct,
                  source: 'sales_history',
                  originalKeyOrId: sale.receiptNumber || sale.id,
                });
                recoveredIds.add(itemId);
                if (itemSku) existingSkus.add(itemSku);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Sales recovery scan error:', err);
  }

  // 4. Scan Activity Logs (logs of created or edited products)
  try {
    const rawLogs = localStorage.getItem('titufaris_activity_logs_v1');
    if (rawLogs) {
      const logs = JSON.parse(rawLogs) as ActivityLog[];
      if (Array.isArray(logs)) {
        for (const log of logs) {
          if (
            (log.action === 'product_created' || log.action === 'product_updated') &&
            log.title
          ) {
            // Title format: "Nuevo artículo incorporado: [Name]" or "Artículo modificado: [Name]"
            const nameMatch = log.title.match(/(?:Nuevo artículo incorporado:|Artículo modificado:|Fotos actualizadas:)\s*(.*)/i);
            const name = nameMatch ? nameMatch[1].trim() : '';
            if (name) {
              const logProdId = log.productId || 'recov-log-' + Math.abs(hashCode(name));
              const existingByName = currentProducts.some(
                p => p.name.toLowerCase().trim() === name.toLowerCase().trim()
              );
              if (!existingIds.has(logProdId) && !existingByName && !recoveredIds.has(logProdId)) {
                // Extract SKU, category, price from details if present
                // Details format: "SKU: XYZ | Categoría: gondolas | PVP: $ 120.000"
                let sku = `REC-${Math.abs(hashCode(name)).toString().slice(0, 6)}`;
                let category = 'gondolas';
                let price = 50000;

                if (log.details) {
                  const skuMatch = log.details.match(/SKU:\s*([^|]+)/i);
                  if (skuMatch) sku = skuMatch[1].trim();

                  const catMatch = log.details.match(/Categoría:\s*([^|]+)/i);
                  if (catMatch) category = catMatch[1].trim().toLowerCase();

                  const priceMatch = log.details.match(/(?:PVP|Precio Min):\s*\$?\s*([\d.,]+)/i);
                  if (priceMatch) {
                    const cleanNum = Number(priceMatch[1].replace(/\./g, '').replace(',', '.'));
                    if (!isNaN(cleanNum) && cleanNum > 0) price = cleanNum;
                  }
                }

                const recoveredProduct: Product = {
                  id: logProdId,
                  sku,
                  name,
                  category,
                  description: `Artículo recuperado desde el registro de auditoría (${log.title}).`,
                  costPrice: Math.round(price * 0.65),
                  wholesalePrice: Math.round(price * 0.85),
                  retailPrice: price,
                  stock: 10,
                  minStock: 2,
                  unit: 'unidad',
                  barcode: (sku || logProdId).replace(/[^0-9]/g, '').padEnd(12, '0').slice(0, 13) || '7791234567890',
                  imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
                  tags: ['Recuperado'],
                  specifications: [],
                  featured: false,
                  active: true,
                  updatedAt: log.timestamp || new Date().toISOString(),
                  updatedBy: 'Auditoría Local',
                };

                recovered.push({
                  product: recoveredProduct,
                  source: 'activity_log',
                  originalKeyOrId: log.id,
                });
                recoveredIds.add(logProdId);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Activity log recovery scan error:', err);
  }

  return recovered;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

function sanitizeProduct(p: Partial<Product>): Product {
  const retailPrice = Number(p.retailPrice) || 10000;
  return {
    id: p.id || 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    sku: p.sku || `SKU-${Date.now().toString().slice(-4)}`,
    name: p.name || 'Artículo sin nombre',
    category: p.category || 'gondolas',
    description: p.description || '',
    costPrice: Number(p.costPrice) || Math.round(retailPrice * 0.65),
    wholesalePrice: Number(p.wholesalePrice) || Math.round(retailPrice * 0.85),
    retailPrice,
    stock: Number(p.stock) ?? 10,
    minStock: Number(p.minStock) ?? 2,
    unit: p.unit || 'unidad',
    imageUrl: (p.images && p.images.length > 0 && p.images[0]) || p.imageUrl || '',
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.imageUrl ? [p.imageUrl] : []),
    barcode: p.barcode,
    tags: Array.isArray(p.tags) ? p.tags : ['General'],
    specifications: Array.isArray(p.specifications) ? p.specifications : [],
    featured: Boolean(p.featured),
    active: p.active !== false,
    updatedAt: p.updatedAt || new Date().toISOString(),
    updatedBy: p.updatedBy || 'Sistema',
  };
}

/**
 * Parses raw text, CSV, tab-separated or JSON list of articles
 * to quickly mass-load products if the user has a spreadsheet or text list.
 */
export function parseRawProductText(text: string): Product[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Try JSON first
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && Array.isArray(parsed.products)
        ? parsed.products
        : [];
      if (list.length > 0) {
        return list.map(sanitizeProduct);
      }
    } catch {
      // Continue to CSV/line parser
    }
  }

  // Parse line by line (CSV or Tab or Semicolon or simple lines)
  const lines = trimmed.split(/\r?\n/).filter(l => l.trim().length > 0);
  const results: Product[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect delimiter
    const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
    const parts = line.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));

    // If header line like "nombre, sku, precio", skip
    if (i === 0 && (parts[0].toLowerCase().includes('nombre') || parts[0].toLowerCase().includes('sku') || parts[0].toLowerCase().includes('name'))) {
      continue;
    }

    if (parts.length >= 1) {
      const name = parts[0] || `Artículo ${i + 1}`;
      const sku = parts[1] || `ART-${Date.now().toString().slice(-4)}-${i + 1}`;
      const priceRaw = parts[2] ? Number(parts[2].replace(/[^\d.]/g, '')) : 50000;
      const price = !isNaN(priceRaw) && priceRaw > 0 ? priceRaw : 50000;
      const stockRaw = parts[3] ? Number(parts[3].replace(/[^\d]/g, '')) : 15;
      const stock = !isNaN(stockRaw) ? stockRaw : 15;
      const category = parts[4] || 'gondolas';

      results.push({
        id: `import-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        sku,
        name,
        category,
        description: `Artículo importado: ${name}`,
        costPrice: Math.round(price * 0.65),
        wholesalePrice: Math.round(price * 0.85),
        retailPrice: price,
        stock,
        minStock: 3,
        unit: 'unidad',
        barcode: (sku || '').replace(/[^0-9]/g, '').padEnd(12, '0').slice(0, 13) || '7791234567890',
        imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
        images: [],
        tags: ['Importado'],
        specifications: [],
        featured: false,
        active: true,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Carga Masiva',
      });
    }
  }

  return results;
}
