import { Product, Category, CompanyProfile } from '../types';
import { getProductPublicUrl } from './qrCode';
import cachedProductImageUrls from '../data/productImageUrls.json';

/**
 * Uploads a base64 image data URL to the free high-speed Cloudflare-backed image CDN.
 * Returns the permanent public HTTPS URL or null on failure.
 */
export async function uploadBase64ImageToCdn(b64Str: string): Promise<string | null> {
  try {
    let cleanB64 = b64Str;
    if (cleanB64.includes(',')) {
      cleanB64 = cleanB64.split(',')[1];
    }
    const params = new URLSearchParams();
    params.append('key', '6d207e02198a847aa98d0a2a901485a5');
    params.append('action', 'upload');
    params.append('source', cleanB64);
    params.append('format', 'json');

    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: params,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await res.json();
    if (data.status_code === 200 && data.image?.url) {
      return data.image.url;
    }
  } catch (err) {
    console.warn('Could not upload image to CDN:', err);
  }
  return null;
}

/**
 * Returns a guaranteed public HTTPS URL for a product's authentic photo.
 * Prioritizes:
 * 1. Explicit publicImageUrl on product
 * 2. Already full http(s) URL in p.imageUrl
 * 3. Pre-mapped high-speed Cloudflare CDN photo by SKU/ID
 * 4. Fallback to official titufaris.online product asset URL
 */
export function getProductPublicImageUrl(p: Product): string {
  const key = p.sku || p.id;
  const mapped = (cachedProductImageUrls as Record<string, string>)[key];
  if (mapped && mapped.startsWith('http')) {
    return mapped;
  }
  if (p.publicImageUrl && p.publicImageUrl.startsWith('http') && !p.publicImageUrl.includes('unsplash.com')) {
    return p.publicImageUrl;
  }
  if (p.imageUrl && p.imageUrl.startsWith('http') && !p.imageUrl.includes('unsplash.com')) {
    return p.imageUrl;
  }
  if (p.sku) {
    return `https://titufaris.online/product-images/${encodeURIComponent(p.sku)}.jpg`;
  }
  return 'https://titufaris.online/images/logo.png';
}

export interface MetaConnectionResult {
  ok: boolean;
  catalogId?: string;
  catalogName?: string;
  productCount?: number;
  error?: string;
}

export interface MetaSyncResult {
  ok: boolean;
  totalProducts: number;
  syncedCount: number;
  batchesCount: number;
  errors: string[];
  details?: string;
  timestamp: string;
}

/**
 * Validates connection with Meta Graph API using the Catalog ID and Access Token
 */
export async function validateMetaCatalogConnection(
  catalogId: string,
  accessToken: string
): Promise<MetaConnectionResult> {
  const cleanCatalogId = catalogId.trim();
  const cleanToken = accessToken.trim();

  if (!cleanCatalogId || !cleanToken) {
    return { ok: false, error: 'Debe ingresar el Catalog ID y el Access Token de Meta.' };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(cleanCatalogId)}?fields=id,name,product_count,vertical&access_token=${encodeURIComponent(cleanToken)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const errMsg = data.error?.message || `Error HTTP ${res.status}: No se pudo verificar el catálogo.`;
      const errType = data.error?.type || '';
      const errCode = data.error?.code || '';
      
      let humanMsg = errMsg;
      if (errCode === 190 || errType === 'OAuthException') {
        humanMsg = 'El Access Token es inválido, ha caducado o no tiene permiso "catalog_management". Genere un Token de Usuario del Sistema permanente en Meta Business Suite.';
      } else if (errCode === 100 || errMsg.includes('Unsupported get request')) {
        humanMsg = `El Catalog ID "${cleanCatalogId}" no existe o el token no tiene acceso a este catálogo en Meta Commerce Manager.`;
      }

      return { ok: false, error: humanMsg };
    }

    return {
      ok: true,
      catalogId: data.id,
      catalogName: data.name || 'Catálogo de Productos',
      productCount: typeof data.product_count === 'number' ? data.product_count : 0,
    };
  } catch (err) {
    console.error('Error validating Meta Catalog connection:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Error de conexión de red al contactar graph.facebook.com.',
    };
  }
}

/**
 * Queries existing product retailer_ids and their Graph API node IDs from the Meta Catalog
 */
export async function getExistingCatalogItemMap(
  catalogId: string,
  accessToken: string
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(catalogId)}/products?fields=retailer_id,id&limit=1000&access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.data)) {
        for (const item of data.data) {
          if (item.retailer_id && item.id) {
            map.set(String(item.retailer_id).trim(), String(item.id).trim());
          }
        }
      }
    }
  } catch (err) {
    console.warn('No se pudieron consultar los productos existentes en Meta previa sincronización:', err);
  }
  return map;
}

export async function getExistingCatalogItemIds(
  catalogId: string,
  accessToken: string
): Promise<Set<string>> {
  const map = await getExistingCatalogItemMap(catalogId, accessToken);
  return new Set(map.keys());
}

/**
 * Builds Meta items_batch request item according to Meta Commerce & Marketplace specifications
 */
function buildMetaBatchItem(
  p: Product,
  method: 'CREATE' | 'UPDATE',
  categoryMap: Map<string, string>,
  company: CompanyProfile,
  priceType: 'retail' | 'wholesale'
) {
  const priceVal = priceType === 'wholesale' ? p.wholesalePrice : p.retailPrice;
  const currency = company.currency || 'ARS';
  const priceFormatted = `${priceVal.toFixed(2)} ${currency}`;
  const catName = categoryMap.get(p.category) || p.category;

  const specsSummary = Array.isArray(p.specifications) && p.specifications.length > 0
    ? ` | Especificaciones: ${p.specifications.map(s => `${s.key}: ${s.value}`).join(' • ')}`
    : '';

  const availability = (p.stock > 0 || p.isMadeToOrder) ? 'in stock' : 'out of stock';
  const retailerId = p.sku || p.id;
  const productUrl = getProductPublicUrl(p);
  const imageUrl = getProductPublicImageUrl(p);

  return {
    method: method,
    retailer_id: retailerId,
    data: {
      id: retailerId,
      title: p.name.slice(0, 150),
      description: `${(p.description || '').trim()}${specsSummary}`.slice(0, 5000) || p.name,
      availability: availability,
      condition: 'new',
      price: priceFormatted,
      link: productUrl,
      image_link: imageUrl,
      brand: company.name || 'Titufaris',
      custom_label_0: catName,
      custom_label_1: p.isMadeToOrder ? 'Fabricación a pedido' : 'Entrega inmediata',
    },
  };
}

/**
 * Syncs the catalog products directly to Meta Commerce / WhatsApp Catalog via Meta Graph API items_batch
 */
export async function syncProductsToMetaCatalog(params: {
  catalogId: string;
  accessToken: string;
  products: Product[];
  categories: Category[];
  company: CompanyProfile;
  priceType?: 'retail' | 'wholesale';
  onProgress?: (processed: number, total: number) => void;
}): Promise<MetaSyncResult> {
  const {
    catalogId,
    accessToken,
    products,
    categories,
    company,
    priceType = 'retail',
    onProgress,
  } = params;

  const cleanCatalogId = catalogId.trim();
  const cleanToken = accessToken.trim();

  const activeProducts = products.filter(p => p.active !== false);
  const total = activeProducts.length;

  if (!cleanCatalogId || !cleanToken) {
    return {
      ok: false,
      totalProducts: total,
      syncedCount: 0,
      batchesCount: 0,
      errors: ['Catalog ID y Access Token son requeridos.'],
      timestamp: new Date().toISOString(),
    };
  }

  // Pre-fetch existing products in the Meta catalog to decide between CREATE and UPDATE
  const existingMap = await getExistingCatalogItemMap(cleanCatalogId, cleanToken);
  const existingIds = new Set(existingMap.keys());

  const categoryMap = new Map<string, string>();
  categories.forEach(c => categoryMap.set(c.id, c.name));

  // Build items list with appropriate method
  const items = activeProducts.map(p => {
    const retailerId = p.sku || p.id;
    const method = existingIds.has(retailerId) ? 'UPDATE' : 'CREATE';
    return buildMetaBatchItem(p, method, categoryMap, company, priceType);
  });

  // Batch into chunks of 50 items (Meta supports up to 300 per items_batch request)
  const chunkSize = 50;
  const chunks: (typeof items)[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  let totalSynced = 0;
  const errors: string[] = [];

  for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
    const chunk = chunks[chunkIdx];
    try {
      const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(cleanCatalogId)}/items_batch?access_token=${encodeURIComponent(cleanToken)}`;
      
      const payload = {
        item_type: 'PRODUCT_ITEM',
        allow_upsert: true,
        requests: chunk,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const errorMsg = data.error?.message || `Error HTTP ${res.status}`;
        
        // If it failed because items already existed or didn't exist, attempt retry with opposite method
        if (errorMsg.includes('does not exist') || errorMsg.includes('already exist')) {
          const alternateChunk = chunk.map(item => ({
            ...item,
            method: item.method === 'CREATE' ? 'UPDATE' : 'CREATE',
          }));

          const retryRes = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              item_type: 'PRODUCT_ITEM',
              allow_upsert: true,
              requests: alternateChunk,
            }),
          });

          const retryData = await retryRes.json();
          if (retryRes.ok && !retryData.error) {
            totalSynced += chunk.length;
            continue;
          }
        }

        errors.push(`Lote ${chunkIdx + 1}: ${errorMsg}`);
      } else {
        // Meta returns { handles: [...] } on successful batch submission
        totalSynced += chunk.length;
      }
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      errors.push(`Lote ${chunkIdx + 1}: ${rawMsg}`);
    }

    onProgress?.(totalSynced, total);
  }

  return {
    ok: errors.length === 0,
    totalProducts: total,
    syncedCount: totalSynced,
    batchesCount: chunks.length,
    errors,
    details: errors.length === 0
      ? `Se enviaron exitosamente ${totalSynced} artículos a Meta Commerce Manager (WhatsApp y Facebook).`
      : totalSynced > 0
        ? `Sincronización parcial: ${totalSynced} de ${total} artículos procesados. Revise los detalles abajo.`
        : `No se pudieron enviar los artículos por la API directa (${errors.length} error(es)).`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Automatically syncs a single product when it is created or updated in the catalog
 */
export async function syncSingleProductToMetaCatalog(params: {
  catalogId: string;
  accessToken: string;
  product: Product;
  categories: Category[];
  company: CompanyProfile;
  priceType?: 'retail' | 'wholesale';
}): Promise<{ ok: boolean; error?: string }> {
  const { catalogId, accessToken, product, categories, company, priceType = 'retail' } = params;
  const cleanCatalogId = catalogId.trim();
  const cleanToken = accessToken.trim();
  if (!cleanCatalogId || !cleanToken) return { ok: false, error: 'Credenciales incompletas' };

  try {
    const categoryMap = new Map<string, string>();
    categories.forEach(c => categoryMap.set(c.id, c.name));
    const item = buildMetaBatchItem(product, 'UPDATE', categoryMap, company, priceType);

    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(cleanCatalogId)}/items_batch?access_token=${encodeURIComponent(cleanToken)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        item_type: 'PRODUCT_ITEM',
        allow_upsert: true,
        requests: [item],
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      // Retry with CREATE if update failed
      const createItem = buildMetaBatchItem(product, 'CREATE', categoryMap, company, priceType);
      const retryRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          item_type: 'PRODUCT_ITEM',
          allow_upsert: true,
          requests: [createItem],
        }),
      });
      const retryData = await retryRes.json();
      if (!retryRes.ok || retryData.error) {
        return { ok: false, error: retryData.error?.message || data.error?.message || `HTTP ${res.status}` };
      }
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Automatically removes a product from Meta Catalog when deleted from the app
 */
export async function deleteProductFromMetaCatalog(params: {
  catalogId: string;
  accessToken: string;
  retailerId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { catalogId, accessToken, retailerId } = params;
  const cleanCatalogId = catalogId.trim();
  const cleanToken = accessToken.trim();
  if (!cleanCatalogId || !cleanToken || !retailerId) return { ok: false, error: 'Parámetros incompletos' };

  try {
    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(cleanCatalogId)}/items_batch?access_token=${encodeURIComponent(cleanToken)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        item_type: 'PRODUCT_ITEM',
        requests: [{
          method: 'DELETE',
          retailer_id: retailerId,
          data: { id: retailerId },
        }],
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      return { ok: false, error: data.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
