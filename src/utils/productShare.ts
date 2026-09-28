import { Product, CompanyProfile } from '../types';
import { getPublicStoreBaseUrl } from './qrCode';
import { formatCurrency } from './storage';

/**
 * Returns the unique, canonical shareable URL for a specific product in the online store.
 * Example: https://titufaris.online/?p=prod_12345
 */
export function getProductShareUrl(product: Product, baseUrl?: string): string {
  const origin = getPublicStoreBaseUrl(baseUrl);
  return `${origin}/?p=${encodeURIComponent(product.id)}`;
}

/**
 * Pre-formatted text for sharing product information via messaging apps or social networks.
 */
export function getProductShareText(product: Product, companyName = 'Titufaris', baseUrl?: string): string {
  const shareUrl = getProductShareUrl(product, baseUrl);
  const priceFormatted = formatCurrency(product.retailPrice);
  const specs = Array.isArray(product.specifications) && product.specifications.length > 0
    ? `\n📐 Medidas: ${product.specifications.slice(0, 2).map(s => `${s.key}: ${s.value}`).join(' | ')}`
    : product.dimensions ? `\n📐 Medidas: ${product.dimensions}` : '';

  return `¡Mirá este producto en ${companyName}! 🛒\n*${product.name}*\n🏷️ SKU: ${product.sku}${specs}\n💵 Precio: ${priceFormatted}\n\n👉 Ver ficha completa y fotos acá:\n${shareUrl}`;
}

/**
 * WhatsApp share link with pre-filled message and direct product URL.
 */
export function getProductWhatsAppShareUrl(product: Product, companyName = 'Titufaris', baseUrl?: string): string {
  const text = getProductShareText(product, companyName, baseUrl);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Direct inquiry WhatsApp link targeting the company phone number with this specific product.
 */
export function getProductDirectInquiryWhatsAppUrl(product: Product, phone: string, baseUrl?: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const shareUrl = getProductShareUrl(product, baseUrl);
  const text = `Hola Titufaris! Me interesa el producto "${product.name}" (SKU: ${product.sku}) por ${formatCurrency(product.retailPrice)}.\nEnlace del producto: ${shareUrl}\n¿Podrían confirmarme disponibilidad y tiempos de entrega?`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Facebook share dialog URL.
 */
export function getProductFacebookShareUrl(product: Product, baseUrl?: string): string {
  const url = getProductShareUrl(product, baseUrl);
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

/**
 * Twitter / X share intent URL.
 */
export function getProductTwitterShareUrl(product: Product, baseUrl?: string): string {
  const url = getProductShareUrl(product, baseUrl);
  const text = `Equipamiento comercial: ${product.name} (${product.sku}) en Titufaris`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

/**
 * Telegram share URL.
 */
export function getProductTelegramShareUrl(product: Product, baseUrl?: string): string {
  const url = getProductShareUrl(product, baseUrl);
  const text = `${product.name} (${product.sku}) - ${formatCurrency(product.retailPrice)}`;
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/**
 * Native Share API with fallback to Clipboard copy.
 */
export async function copyOrShareProduct(
  product: Product,
  companyName = 'Titufaris',
  baseUrl?: string
): Promise<{ success: boolean; method: 'native' | 'clipboard' }> {
  const shareUrl = getProductShareUrl(product, baseUrl);
  const shareText = getProductShareText(product, companyName, baseUrl);

  // Check if Web Share API is available (primarily mobile browsers)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: `${product.name} | ${companyName}`,
        text: shareText,
        url: shareUrl,
      });
      return { success: true, method: 'native' };
    } catch (err: any) {
      // User cancelled share or aborted: if aborted with AbortError, don't fallback to clipboard
      if (err?.name === 'AbortError') {
        return { success: false, method: 'native' };
      }
      // If error was not abort, proceed to clipboard fallback
    }
  }

  // Fallback to Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return { success: true, method: 'clipboard' };
    } catch {
      // Manual textarea fallback for older browsers or restricted iframes
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return { success: true, method: 'clipboard' };
    }
  }

  return { success: false, method: 'clipboard' };
}
