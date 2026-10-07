import { Product, Category, CompanyProfile } from '../types';
import { getProductPublicUrl } from './qrCode';
import { formatCurrency } from './storage';
import { getProductPublicImageUrl } from './metaCatalogApi';

export interface WhatsAppExportOptions {
  priceType?: 'retail' | 'wholesale';
  selectedCategories?: string[];
  onlyActive?: boolean;
  currency?: string;
  brand?: string;
}

/**
 * Returns a clean phone number suitable for WhatsApp links (only digits)
 */
export function getCleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Returns the official WhatsApp Business Catalog URL (wa.me/c/<PHONE>)
 * or custom configured URL.
 */
export function getWhatsAppBusinessCatalogUrl(company: CompanyProfile): string {
  if (company.whatsappCatalogUrl && company.whatsappCatalogUrl.trim()) {
    let url = company.whatsappCatalogUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url;
  }
  const cleanPhone = getCleanPhoneNumber(company.phone);
  if (cleanPhone) {
    return `https://wa.me/c/${cleanPhone}`;
  }
  return 'https://wa.me';
}

/**
 * Strips HTML and quotes, sanitizes text for CSV
 */
function sanitizeCsvField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val)
    .replace(/\r\n/g, ' ')
    .replace(/[\r\n]/g, ' ')
    .replace(/"/g, '""')
    .trim();
  return `"${str}"`;
}

/**
 * Generates an informative, clean description for Meta Commerce WhatsApp catalog
 */
function formatProductDescriptionForMeta(product: Product, categoryName?: string): string {
  const parts: string[] = [];
  if (product.description && product.description.trim()) {
    parts.push(product.description.trim());
  }

  if (categoryName) {
    parts.push(`Categoría: ${categoryName}.`);
  }

  if (product.isMadeToOrder) {
    parts.push(`Fabricación a pedido (demora aprox. ${product.leadTimeDays || 15} días hábiles).`);
  } else {
    parts.push('Disponible para entrega inmediata.');
  }

  // Append key technical specifications
  const specs = Array.isArray(product.specifications)
    ? product.specifications.filter(s => s && s.key && s.value)
    : [];

  if (specs.length > 0) {
    const specsStr = specs.map(s => `${s.key}: ${s.value}`).join(' | ');
    parts.push(`Especificaciones: ${specsStr}`);
  }

  if (product.tags && product.tags.length > 0) {
    parts.push(`Tags: ${product.tags.join(', ')}`);
  }

  return parts.join(' ');
}

/**
 * Formats a single product row according to the Meta Commerce Manager Catalog CSV specification.
 * Meta Standard columns:
 * id, title, description, availability, condition, price, link, image_link, brand,
 * google_product_category, fb_product_category, sale_price, inventory, custom_label_0, custom_label_1
 */
export function generateWhatsAppCatalogCSV(
  products: Product[],
  categories: Category[],
  company: CompanyProfile,
  options: WhatsAppExportOptions = {}
): string {
  const {
    priceType = 'retail',
    selectedCategories = [],
    onlyActive = true,
    currency = company.currency || 'ARS',
    brand = company.name || 'Titufaris',
  } = options;

  const categoryMap = new Map<string, string>();
  categories.forEach(c => categoryMap.set(c.id, c.name));

  // Filter products
  const filtered = products.filter(p => {
    if (onlyActive && p.active === false) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
    return true;
  });

  // Meta Commerce Manager Standard Header
  const headers = [
    'id',
    'title',
    'description',
    'availability',
    'condition',
    'price',
    'link',
    'image_link',
    'brand',
    'google_product_category',
    'fb_product_category',
    'sale_price',
    'inventory',
    'custom_label_0',
    'custom_label_1'
  ];

  const rows = filtered.map(p => {
    const id = p.sku || p.id;
    const title = p.name.slice(0, 150); // Meta maximum is 150 chars for title
    const catName = categoryMap.get(p.category) || p.category;
    const description = formatProductDescriptionForMeta(p, catName).slice(0, 5000);
    
    // In Meta catalog, availability must be 'in stock' or 'out of stock' (or 'preorder' / 'available for order')
    const availability = (p.stock > 0 || p.isMadeToOrder) ? 'in stock' : 'out of stock';
    const condition = 'new';
    
    const priceVal = priceType === 'wholesale' ? p.wholesalePrice : p.retailPrice;
    const formattedPrice = `${priceVal.toFixed(2)} ${currency}`;
    
    // Optional sale price if wholesale is used as discounted tier
    const salePrice = priceType === 'retail' && p.wholesalePrice > 0 && p.wholesalePrice < p.retailPrice
      ? `${p.wholesalePrice.toFixed(2)} ${currency}`
      : '';

    const productUrl = getProductPublicUrl(p);
    const imageUrl = getProductPublicImageUrl(p);
    const googleCategory = 'Business & Industrial > Retail';
    const fbCategory = 'furniture_retail';
    const inventory = Math.max(0, p.stock);
    const customLabel0 = catName;
    const customLabel1 = p.isMadeToOrder ? 'Fabricación a Pedido' : 'Entrega Inmediata';

    return [
      sanitizeCsvField(id),
      sanitizeCsvField(title),
      sanitizeCsvField(description),
      sanitizeCsvField(availability),
      sanitizeCsvField(condition),
      sanitizeCsvField(formattedPrice),
      sanitizeCsvField(productUrl),
      sanitizeCsvField(imageUrl),
      sanitizeCsvField(brand),
      sanitizeCsvField(googleCategory),
      sanitizeCsvField(fbCategory),
      salePrice ? sanitizeCsvField(salePrice) : '""',
      inventory,
      sanitizeCsvField(customLabel0),
      sanitizeCsvField(customLabel1)
    ].join(',');
  });

  // UTF-8 BOM prefix (\uFEFF) ensures Excel and Meta Commerce Manager parse accented letters properly
  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
}

/**
 * Triggers a direct browser file download for the WhatsApp Catalog CSV
 */
export function downloadWhatsAppCatalogCSV(
  products: Product[],
  categories: Category[],
  company: CompanyProfile,
  options: WhatsAppExportOptions = {}
): void {
  const csvContent = generateWhatsAppCatalogCSV(products, categories, company, options);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  const priceSuffix = options.priceType === 'wholesale' ? '_Mayorista' : '_Minorista';
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Catalogo_WhatsApp_Meta_${company.name || 'Titufaris'}${priceSuffix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an XML Data Feed (Google / Meta Merchant standard RSS 2.0)
 * which can be used for automatic scheduled daily/hourly synchronization in Meta Commerce Manager.
 */
export function generateWhatsAppCatalogFeedXML(
  products: Product[],
  categories: Category[],
  company: CompanyProfile,
  options: WhatsAppExportOptions = {}
): string {
  const {
    priceType = 'retail',
    currency = company.currency || 'ARS',
    brand = company.name || 'Titufaris',
  } = options;

  const categoryMap = new Map<string, string>();
  categories.forEach(c => categoryMap.set(c.id, c.name));

  const itemsXml = products
    .filter(p => p.active !== false)
    .map(p => {
      const catName = categoryMap.get(p.category) || p.category;
      const desc = formatProductDescriptionForMeta(p, catName);
      const priceVal = priceType === 'wholesale' ? p.wholesalePrice : p.retailPrice;
      const availability = (p.stock > 0 || p.isMadeToOrder) ? 'in stock' : 'out of stock';
      const link = getProductPublicUrl(p);

      return `    <item>
      <g:id><![CDATA[${p.sku || p.id}]]></g:id>
      <g:title><![CDATA[${p.name.slice(0, 150)}]]></g:title>
      <g:description><![CDATA[${desc.slice(0, 5000)}]]></g:description>
      <g:link><![CDATA[${link}]]></g:link>
      <g:image_link><![CDATA[${getProductPublicImageUrl(p)}]]></g:image_link>
      <g:brand><![CDATA[${brand}]]></g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${priceVal.toFixed(2)} ${currency}</g:price>
      <g:google_product_category><![CDATA[Business & Industrial > Retail]]></g:google_product_category>
      <g:product_type><![CDATA[${catName}]]></g:product_type>
      <g:custom_label_0><![CDATA[${p.isMadeToOrder ? 'Fabricación a Pedido' : 'Entrega Inmediata'}]]></g:custom_label_0>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title><![CDATA[Catálogo de Productos Titufaris - WhatsApp & Meta Commerce Feed]]></title>
    <link><![CDATA[${company.website || 'https://titufaris.com.ar'}]]></link>
    <description><![CDATA[Feed oficial de catálogo de equipamiento comercial Titufaris para WhatsApp Business y Meta Commerce Manager]]></description>
${itemsXml}
  </channel>
</rss>`;
}

/**
 * Generates an elegant, highly structured WhatsApp product card message ready to send to a customer
 */
export function getWhatsAppProductShareText(
  product: Product,
  company: CompanyProfile,
  priceType: 'retail' | 'wholesale' = 'retail'
): string {
  const price = priceType === 'wholesale' ? product.wholesalePrice : product.retailPrice;
  const isWholesale = priceType === 'wholesale';
  const url = getProductPublicUrl(product);

  const specs = Array.isArray(product.specifications)
    ? product.specifications.filter(s => s && s.key && s.value)
    : [];

  let msg = `*${company.name.toUpperCase()} — EQUIPAMIENTO COMERCIAL*\n`;
  msg += `-------------------------------------------\n`;
  msg += `📦 *Producto:* ${product.name}\n`;
  msg += `🔢 *Código / SKU:* ${product.sku}\n`;
  msg += `💰 *Precio ${isWholesale ? 'Mayorista (10+ u.)' : 'Venta Oficial'}:* ${formatCurrency(price)}\n`;
  
  if (!isWholesale && product.wholesalePrice > 0) {
    msg += `🏷️ *Precio Mayorista:* ${formatCurrency(product.wholesalePrice)} (+10 unid.)\n`;
  }

  if (product.isMadeToOrder) {
    msg += `⏱️ *Disponibilidad:* Fabricación a pedido (aprox. ${product.leadTimeDays || 15} días hábiles)\n`;
  } else {
    msg += `✅ *Disponibilidad:* Entrega inmediata (Stock: ${product.stock} ${product.unit || 'unid'})\n`;
  }

  if (specs.length > 0) {
    msg += `\n📐 *Especificaciones Técnicas:*\n`;
    specs.slice(0, 5).forEach(s => {
      msg += ` • *${s.key}:* ${s.value}\n`;
    });
  }

  msg += `-------------------------------------------\n`;
  msg += `🌐 *Ver Ficha con Fotos en Tienda:* \n${url}\n\n`;
  msg += `¿Te gustaría coordinar entrega o presupuesto personalizado? ¡Estamos a tu disposición!`;

  return msg;
}

/**
 * Directly opens WhatsApp Web or mobile app with inquiry for a specific product
 */
export function openWhatsAppProductInquiry(
  product: Product,
  company: CompanyProfile,
  priceType: 'retail' | 'wholesale' = 'retail'
): void {
  const cleanPhone = getCleanPhoneNumber(company.phone);
  const text = getWhatsAppProductShareText(product, company, priceType);
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
