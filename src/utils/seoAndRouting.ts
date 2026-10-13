import { Product, Category, CompanyProfile } from '../types';
import { formatCurrency } from './storage';

/**
 * Convierte un texto en un slug legible y amigable para URLs y motores de búsqueda.
 * Ejemplo: "Góndola Central Doble Reforzada" -> "gondola-central-doble-reforzada"
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD') // Quitar tildes y diacríticos
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/[\s_]+/g, '-') // Reemplazar espacios y guiones bajos por un solo guión
    .replace(/^-+|-+$/g, ''); // Remover guiones iniciales o finales
}

/**
 * Obtiene la URL base canónica actual sin parámetros de consulta o con ellos.
 */
export function getCanonicalBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}${window.location.pathname}`;
  }
  return 'https://titufaris.online';
}

/**
 * Genera un slug altamente descriptivo y legible relativo a las características
 * esenciales del producto (nombre, descripción detallada, medidas y atributos técnicos).
 * Permite que cualquier usuario o motor de búsqueda lea en el propio enlace de qué producto se trata.
 * Ejemplo: "gondola-central-tramo-inicial-de-160-de-alto-12-metros-de-largo-y-4-estantes"
 */
export function generateProductDescriptiveSlug(product: Product): string {
  if (!product) return 'producto';

  const nameSlug = slugify(product.name || '');
  const rawDesc = (product.description || '').trim();

  let descriptivePart = '';

  if (rawDesc) {
    // Tomar la primera oración o los primeros 14 términos significativos de la descripción
    const firstSentence = rawDesc.split(/[.\n\r]/)[0] || rawDesc;
    const descWords = firstSentence.split(/\s+/).filter(Boolean);
    const shortDescText = descWords.slice(0, 14).join(' ');
    const descSlug = slugify(shortDescText);

    // Evaluar si la descripción ya incluye el nombre o las palabras clave principales del nombre
    const nameWords = nameSlug.split('-').filter(w => w.length > 2);
    const descWordsList = descSlug.split('-');
    const overlapCount = nameWords.filter(w => descWordsList.includes(w)).length;

    if (descSlug.startsWith(nameSlug) || (nameWords.length > 0 && overlapCount >= Math.min(2, nameWords.length))) {
      // La descripción ya contiene el nombre de forma fluida y legible: usarla directamente
      descriptivePart = descSlug;
    } else {
      // Concatenar el nombre con la descripción complementaria evitando duplicados inmediatos
      descriptivePart = `${nameSlug}-${descSlug}`;
    }
  } else if (product.dimensions) {
    // Si no tiene descripción larga, complementar el nombre con sus medidas
    const dimSlug = slugify(product.dimensions);
    descriptivePart = `${nameSlug}-${dimSlug}`;
  } else if (Array.isArray(product.specifications) && product.specifications.length > 0) {
    // Usar la primera especificación técnica clave
    const specStr = product.specifications
      .slice(0, 2)
      .map(s => `${s.key}-${s.value}`)
      .join('-');
    descriptivePart = `${nameSlug}-${slugify(specStr)}`;
  } else {
    descriptivePart = nameSlug;
  }

  // Si aún no contiene el SKU y el SKU es descriptivo (ej: no vacío), anexarlo si queda espacio
  if (product.sku) {
    const skuSlug = slugify(product.sku);
    if (skuSlug && !descriptivePart.includes(skuSlug) && descriptivePart.length < 90) {
      descriptivePart = `${descriptivePart}-sku-${skuSlug}`;
    }
  }

  // Normalizar guiones dobles
  let finalSlug = descriptivePart.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  // Limitar a una longitud óptima (máx 115 caracteres) cortando limpiamente en el límite de una palabra
  if (finalSlug.length > 115) {
    const truncated = finalSlug.slice(0, 115);
    const lastDash = truncated.lastIndexOf('-');
    if (lastDash > 35) {
      finalSlug = truncated.slice(0, lastDash);
    } else {
      finalSlug = truncated;
    }
  }

  return finalSlug || nameSlug || 'producto';
}

/**
 * Genera una URL amigable, relativa y descriptiva para acceder a un producto en la tienda.
 * Al ser relativa al producto, se lee en ella una descripción completa de sus características.
 * @param product Producto objetivo
 * @param isDemo Si es modo demo de tienda genérica
 * @param relative Si true (por defecto), devuelve enlace relativo para navegación interna (ej: "/?producto=...&p=...")
 */
export function buildProductUrl(product: Product, isDemo = false, relative = true): string {
  const descriptiveSlug = generateProductDescriptiveSlug(product);
  const base = relative ? '' : getCanonicalBaseUrl();

  const params = new URLSearchParams();
  if (isDemo) params.set('demo', 'generica');
  params.set('producto', descriptiveSlug);
  params.set('p', product.id);

  const query = params.toString();
  return relative ? `/?${query}` : `${base}?${query}`;
}

/**
 * Genera una URL amigable y legible para compartir una categoría específica.
 */
export function buildCategoryUrl(catId: string, categories: Category[], isDemo = false): string {
  const base = getCanonicalBaseUrl();
  const cat = categories.find(c => c.id === catId);
  const catSlug = cat ? slugify(cat.name) : catId;
  const params = new URLSearchParams();
  if (isDemo) params.set('demo', 'generica');
  if (catId !== 'all') {
    params.set('categoria', catSlug);
    params.set('cat', catId);
  }
  const queryString = params.toString();
  return queryString ? `${base}?${queryString}` : base;
}

/**
 * Actualiza dinámicamente los metadatos SEO en el elemento <head> del documento:
 * - document.title
 * - meta[name="description"]
 * - meta[property="og:title"]
 * - meta[property="og:description"]
 * - meta[property="og:url"]
 * - link[rel="canonical"]
 */
export function updateSeoMetadata(options: {
  title: string;
  description: string;
  ogImage?: string;
  canonicalUrl?: string;
}): void {
  if (typeof document === 'undefined') return;

  const { title, description, ogImage, canonicalUrl } = options;

  // 1. Título de página (breve, descriptivo y preciso)
  document.title = title;

  // Helper para crear o actualizar etiquetas meta
  const setMetaTag = (attrName: 'name' | 'property', attrValue: string, content: string) => {
    let element = document.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, attrValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // 2. Meta descripción (120 - 160 caracteres)
  setMetaTag('name', 'description', description);
  setMetaTag('property', 'og:description', description);
  setMetaTag('name', 'twitter:description', description);

  // 3. OpenGraph & Twitter Titles
  setMetaTag('property', 'og:title', title);
  setMetaTag('name', 'twitter:title', title);

  // 4. URL canónica
  const fullUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : 'https://titufaris.online');
  setMetaTag('property', 'og:url', fullUrl);

  let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', fullUrl);

  // 5. Imagen OpenGraph
  if (ogImage) {
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('name', 'twitter:image', ogImage);
    setMetaTag('name', 'twitter:card', 'summary_large_image');
  }
}

/**
 * Genera el XML estándar de sitemap.xml según el protocolo oficial de sitemaps.org
 * para indexación óptima en Google Search Console y motores de búsqueda.
 */
export function generateSitemapXml(
  products: Product[],
  categories: Category[],
  company: CompanyProfile,
  customBaseUrl?: string,
  isDemo = false
): string {
  const baseUrl = (customBaseUrl || getCanonicalBaseUrl()).replace(/\/+$/, '');
  const currentDate = new Date().toISOString().split('T')[0];
  const demoParam = isDemo ? 'demo=generica' : '';

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  lines.push('        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">');

  // 1. Portada / Home Page (Prioridad máxima 1.0)
  lines.push('  <!-- Página Principal / Portada -->');
  lines.push('  <url>');
  lines.push(`    <loc>${baseUrl}/${isDemo ? '?demo=generica' : ''}</loc>`);
  lines.push(`    <lastmod>${currentDate}</lastmod>`);
  lines.push('    <changefreq>daily</changefreq>');
  lines.push('    <priority>1.0</priority>');
  if (company.heroImageUrl) {
    lines.push('    <image:image>');
    lines.push(`      <image:loc>${escapeXml(company.heroImageUrl)}</image:loc>`);
    lines.push(`      <image:title>${escapeXml(company.name)} - Portada</image:title>`);
    lines.push('    </image:image>');
  }
  lines.push('  </url>');

  // 2. Mapa del Sitio Web (Prioridad 0.8)
  lines.push('  <!-- Mapa del Sitio Web -->');
  lines.push('  <url>');
  const sitemapUrl = isDemo ? `${baseUrl}/?demo=generica&amp;vista=mapa-del-sitio` : `${baseUrl}/?vista=mapa-del-sitio`;
  lines.push(`    <loc>${sitemapUrl}</loc>`);
  lines.push(`    <lastmod>${currentDate}</lastmod>`);
  lines.push('    <changefreq>weekly</changefreq>');
  lines.push('    <priority>0.8</priority>');
  lines.push('  </url>');

  // 3. Categorías / Líneas de Producto (Prioridad 0.9)
  lines.push('  <!-- Categorías y Líneas de Producto -->');
  for (const cat of categories) {
    const catSlug = slugify(cat.name);
    const catUrl = isDemo
      ? `${baseUrl}/?demo=generica&amp;categoria=${catSlug}&amp;cat=${cat.id}`
      : `${baseUrl}/?categoria=${catSlug}&amp;cat=${cat.id}`;
    lines.push('  <url>');
    lines.push(`    <loc>${catUrl}</loc>`);
    lines.push(`    <lastmod>${currentDate}</lastmod>`);
    lines.push('    <changefreq>daily</changefreq>');
    lines.push('    <priority>0.9</priority>');
    lines.push('  </url>');
  }

  // 4. Productos individuales del Catálogo (Prioridad 0.85)
  lines.push('  <!-- Artículos y Productos del Catálogo -->');
  for (const prod of products.filter(p => p.active !== false)) {
    const prodSlug = slugify(prod.name);
    const prodLastMod = prod.updatedAt ? prod.updatedAt.split('T')[0] : currentDate;
    const prodImg = (prod.images && prod.images[0]) || prod.imageUrl || prod.publicImageUrl;
    const prodUrl = isDemo
      ? `${baseUrl}/?demo=generica&amp;producto=${prodSlug}&amp;p=${prod.id}`
      : `${baseUrl}/?producto=${prodSlug}&amp;p=${prod.id}`;

    lines.push('  <url>');
    lines.push(`    <loc>${prodUrl}</loc>`);
    lines.push(`    <lastmod>${prodLastMod}</lastmod>`);
    lines.push('    <changefreq>weekly</changefreq>');
    lines.push('    <priority>0.85</priority>');
    if (prodImg) {
      lines.push('    <image:image>');
      lines.push(`      <image:loc>${escapeXml(prodImg)}</image:loc>`);
      lines.push(`      <image:title>${escapeXml(prod.name)}</image:title>`);
      lines.push(`      <image:caption>${escapeXml(prod.description ? prod.description.slice(0, 150) : prod.name)}</image:caption>`);
      lines.push('    </image:image>');
    }
    lines.push('  </url>');
  }

  lines.push('</urlset>');
  return lines.join('\n');
}

/**
 * Escapa caracteres especiales en strings XML
 */
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Inicia la descarga automática del archivo sitemap.xml en el navegador
 */
export function downloadSitemapFile(xmlContent: string, filename = 'sitemap.xml'): void {
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
