import { Product, Category, CompanyProfile } from '../types';
import { getProductPublicUrl } from './qrCode';

export interface GoogleMerchantExportOptions {
  priceType?: 'retail' | 'wholesale';
  selectedCategories?: string[];
  onlyActive?: boolean;
  currency?: string;
  brand?: string;
}

/**
 * Sanitizes plain text for XML CDATA or TSV fields
 */
function cleanText(text?: string): string {
  if (!text) return '';
  return text.replace(/\r\n/g, ' ').replace(/[\r\n\t]/g, ' ').trim();
}

/**
 * Formats a description for Google Merchant Center
 */
function formatDescriptionForGoogle(product: Product, categoryName?: string): string {
  const parts: string[] = [];
  if (product.description && product.description.trim()) {
    parts.push(product.description.trim());
  }

  if (categoryName) {
    parts.push(`Categoría: ${categoryName}.`);
  }

  if (product.isMadeToOrder) {
    parts.push(`Fabricación a pedido (plazo estimado ${product.leadTimeDays || 15} días hábiles).`);
  } else {
    parts.push('Disponible para entrega inmediata.');
  }

  const specs = Array.isArray(product.specifications)
    ? product.specifications.filter(s => s && s.key && s.value)
    : [];

  if (specs.length > 0) {
    const specsStr = specs.map(s => `${s.key}: ${s.value}`).join(' | ');
    parts.push(`Especificaciones técnicas: ${specsStr}.`);
  }

  return parts.join(' ');
}

/**
 * Generates an official Google Merchant Center Feed in RSS 2.0 XML format
 * Specification: https://support.google.com/merchants/answer/160589
 */
export function generateGoogleMerchantXML(
  products: Product[],
  categories: Category[],
  company: CompanyProfile,
  options: GoogleMerchantExportOptions = {}
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

  const filtered = products.filter(p => {
    if (onlyActive && p.active === false) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
    return true;
  });

  const itemsXml = filtered.map(p => {
    const catName = categoryMap.get(p.category) || p.category;
    const desc = formatDescriptionForGoogle(p, catName);
    const priceVal = priceType === 'wholesale' ? p.wholesalePrice : p.retailPrice;
    const availability = (p.stock > 0 || p.isMadeToOrder) ? 'in_stock' : 'out_of_stock';
    const link = getProductPublicUrl(p);
    const id = p.sku || p.id;
    const imageUrl = p.imageUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80';

    return `    <item>
      <g:id><![CDATA[${id}]]></g:id>
      <g:title><![CDATA[${cleanText(p.name).slice(0, 150)}]]></g:title>
      <g:description><![CDATA[${cleanText(desc).slice(0, 5000)}]]></g:description>
      <g:link><![CDATA[${link}]]></g:link>
      <g:image_link><![CDATA[${imageUrl}]]></g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${priceVal.toFixed(2)} ${currency}</g:price>
      <g:brand><![CDATA[${brand}]]></g:brand>
      <g:google_product_category><![CDATA[Business & Industrial > Retail]]></g:google_product_category>
      <g:product_type><![CDATA[${catName}]]></g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
      <g:mpn><![CDATA[${p.sku || p.id}]]></g:mpn>
      <g:custom_label_0><![CDATA[${catName}]]></g:custom_label_0>
      <g:custom_label_1><![CDATA[${p.isMadeToOrder ? 'Fabricación a pedido' : 'Entrega inmediata'}]]></g:custom_label_1>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title><![CDATA[Catálogo de Productos Titufaris - Google Merchant Center]]></title>
    <link><![CDATA[${company.website || 'https://titufaris.com.ar'}]]></link>
    <description><![CDATA[Feed oficial de Google Shopping y fichas de producto de equipamiento comercial Titufaris]]></description>
${itemsXml}
  </channel>
</rss>`;
}

/**
 * Downloads the Google Merchant XML Feed file (.xml)
 */
export function downloadGoogleMerchantXML(
  products: Product[],
  categories: Category[],
  company: CompanyProfile,
  options: GoogleMerchantExportOptions = {}
): void {
  const xmlContent = generateGoogleMerchantXML(products, categories, company, options);
  const blob = new Blob([xmlContent], { type: 'application/rss+xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `Google_Merchant_Feed_${company.name || 'Titufaris'}_${dateStr}.xml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a TSV (Tab-separated values) feed preferred by Google Merchant Center for direct file upload
 */
export function generateGoogleMerchantTSV(
  products: Product[],
  categories: Category[],
  company: CompanyProfile,
  options: GoogleMerchantExportOptions = {}
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

  const filtered = products.filter(p => {
    if (onlyActive && p.active === false) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
    return true;
  });

  const headers = [
    'id',
    'title',
    'description',
    'link',
    'image_link',
    'availability',
    'price',
    'google_product_category',
    'brand',
    'condition',
    'identifier_exists',
    'product_type'
  ];

  const rows = filtered.map(p => {
    const catName = categoryMap.get(p.category) || p.category;
    const desc = formatDescriptionForGoogle(p, catName);
    const priceVal = priceType === 'wholesale' ? p.wholesalePrice : p.retailPrice;
    const availability = (p.stock > 0 || p.isMadeToOrder) ? 'in_stock' : 'out_of_stock';
    const link = getProductPublicUrl(p);
    const id = p.sku || p.id;
    const imageUrl = p.imageUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80';

    return [
      cleanText(id),
      cleanText(p.name).slice(0, 150),
      cleanText(desc).slice(0, 5000),
      link,
      imageUrl,
      availability,
      `${priceVal.toFixed(2)} ${currency}`,
      'Business & Industrial > Retail',
      cleanText(brand),
      'new',
      'no',
      cleanText(catName)
    ].join('\t');
  });

  return '\uFEFF' + [headers.join('\t'), ...rows].join('\r\n');
}

/**
 * Downloads the Google Merchant TSV file
 */
export function downloadGoogleMerchantTSV(
  products: Product[],
  categories: Category[],
  company: CompanyProfile,
  options: GoogleMerchantExportOptions = {}
): void {
  const tsvContent = generateGoogleMerchantTSV(products, categories, company, options);
  const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `Google_Shopping_Feed_${company.name || 'Titufaris'}_${dateStr}.tsv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates Schema.org JSON-LD structured data for Google Search rich snippets
 */
export function generateProductJsonLd(product: Product, company: CompanyProfile): Record<string, any> {
  const url = getProductPublicUrl(product);
  const isAvailable = product.stock > 0 || product.isMadeToOrder;

  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: [product.imageUrl],
    description: product.description || `${product.name} - Equipamiento comercial de fabricación directa.`,
    sku: product.sku,
    mpn: product.sku,
    brand: {
      '@type': 'Brand',
      name: company.name || 'Titufaris',
    },
    offers: {
      '@type': 'Offer',
      url: url,
      priceCurrency: company.currency || 'ARS',
      price: product.retailPrice,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      itemCondition: 'https://schema.org/NewCondition',
      availability: isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: company.name || 'Titufaris',
      },
    },
  };
}

/**
 * Generates Schema.org WebSite & Organization structured data for the public store
 */
export function generateStoreJsonLd(company: CompanyProfile, productsCount: number): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${company.website || 'https://titufaris.com.ar'}#organization`,
        name: company.name,
        legalName: company.legalName,
        url: company.website,
        logo: company.logoUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: company.phone,
          contactType: 'customer service',
          areaServed: 'AR',
          availableLanguage: 'Spanish',
        },
      },
      {
        '@type': 'Store',
        name: `${company.name} - Equipamiento Comercial`,
        description: company.tagline || 'Fabricación directa de góndolas, estanterías metálicas, racks y lockers comerciales.',
        url: company.website,
        telephone: company.phone,
        address: {
          '@type': 'PostalAddress',
          streetAddress: company.address,
          addressLocality: company.city,
          addressCountry: 'AR',
        },
      }
    ]
  };
}
