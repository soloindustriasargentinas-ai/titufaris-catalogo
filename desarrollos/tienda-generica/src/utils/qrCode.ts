import QRCode from 'qrcode';
import { Product } from '../types';

export function getPublicStoreBaseUrl(baseUrl?: string): string {
  if (baseUrl && baseUrl !== 'https://titufaris.com.ar' && baseUrl.startsWith('http')) {
    return baseUrl;
  }
  if (typeof window !== 'undefined') {
    let origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-');
    }
    return origin;
  }
  return 'https://ais-pre-ubpus5y27jwtduyfizubux-418899072866.us-east1.run.app';
}

export async function generateProductQRCode(product: Product, baseUrl?: string): Promise<string> {
  const origin = getPublicStoreBaseUrl(baseUrl);
  const targetUrl = `${origin}?view=product&id=${encodeURIComponent(product.id)}&sku=${encodeURIComponent(product.sku)}&from=qr`;

  try {
    const dataUrl = await QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

export function getProductPublicUrl(product: Product, baseUrl?: string): string {
  const origin = getPublicStoreBaseUrl(baseUrl);
  return `${origin}?view=product&id=${encodeURIComponent(product.id)}&sku=${encodeURIComponent(product.sku)}&from=qr`;
}

export function normalizeMercadoPagoUrl(rawLink?: string): string {
  if (!rawLink || !rawLink.trim()) {
    return 'https://link.mercadopago.com.ar/titufaris';
  }
  let trimmed = rawLink.trim();
  // Check if it already has protocol
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    // If it doesn't contain a dot or domain, treat as handle/alias for link.mercadopago.com.ar
    if (!trimmed.includes('.')) {
      trimmed = `https://link.mercadopago.com.ar/${trimmed.replace(/^@/, '')}`;
    } else {
      trimmed = `https://${trimmed}`;
    }
  }
  return trimmed;
}
