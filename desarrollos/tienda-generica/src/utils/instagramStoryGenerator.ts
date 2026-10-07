import QRCode from 'qrcode';
import { Product, CompanyProfile } from '../types';
import { formatCurrency } from './storage';
import { getProductShareUrl } from './productShare';

/**
 * Loads an image safely with crossOrigin anonymous to allow canvas export.
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Retry once without crossOrigin in case it's local
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = () => resolve(null);
      fallbackImg.src = src;
    };
    img.src = src;
  });
}

/**
 * Draws wrapped text on a canvas context.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3
): number {
  const words = text.split(' ');
  let line = '';
  let linesCount = 0;
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      linesCount++;
      if (linesCount >= maxLines) {
        ctx.fillText(line.trim() + '...', x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
}

/**
 * Generates a high-resolution 1080x1920 Instagram Story Card for a product.
 * Returns a Blob containing the PNG image.
 */
export async function generateInstagramStoryCard(
  product: Product,
  company: CompanyProfile,
  baseUrl?: string
): Promise<Blob> {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  const shareUrl = getProductShareUrl(product, baseUrl);
  const companyName = company.name || 'Titufaris';

  // 1. Background: Modern luxury dark gradient with warm radial amber glows
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#090D16');
  bgGradient.addColorStop(0.35, '#0F172A');
  bgGradient.addColorStop(0.7, '#1E293B');
  bgGradient.addColorStop(1, '#0B0F19');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Decorative top radial glow (Orange/Amber)
  const topGlow = ctx.createRadialGradient(width * 0.5, 300, 50, width * 0.5, 300, 600);
  topGlow.addColorStop(0, 'rgba(234, 88, 12, 0.28)');
  topGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
  topGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, width, 900);

  // Decorative bottom radial glow
  const bottomGlow = ctx.createRadialGradient(width * 0.8, height - 300, 40, width * 0.8, height - 300, 500);
  bottomGlow.addColorStop(0, 'rgba(234, 88, 12, 0.18)');
  bottomGlow.addColorStop(1, 'rgba(11, 15, 25, 0)');
  ctx.fillStyle = bottomGlow;
  ctx.fillRect(0, height - 700, width, 700);

  // 2. Header: Brand Bar
  // Brand Pill
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  const pillWidth = 440;
  const pillHeight = 64;
  const pillX = (width - pillWidth) / 2;
  const pillY = 110;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 32);
  ctx.fill();
  ctx.stroke();

  // Brand Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText(companyName.toUpperCase(), width / 2, pillY + 42);

  // Subtitle
  ctx.fillStyle = '#FB923C'; // Light orange
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('CATÁLOGO OFICIAL & TIENDA ONLINE', width / 2, pillY + 105);

  // 3. Product Image Container (White Card with soft shadow)
  const cardWidth = 920;
  const cardHeight = 780;
  const cardX = (width - cardWidth) / 2;
  const cardY = 280;

  // Card Outer Shadow / Glow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 45;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 25;

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 36);
  ctx.fill();

  // Reset shadow for inner elements
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Category & SKU Badges on the Image Card
  ctx.fillStyle = '#F1F5F9';
  ctx.beginPath();
  ctx.roundRect(cardX + 36, cardY + 36, 220, 44, 12);
  ctx.fill();

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.letterSpacing = '1px';
  ctx.fillText(`SKU: ${product.sku || 'N/A'}`, cardX + 54, cardY + 65);

  if (product.featured) {
    const featGrad = ctx.createLinearGradient(cardX + cardWidth - 210, 0, cardX + cardWidth - 36, 0);
    featGrad.addColorStop(0, '#EA580C');
    featGrad.addColorStop(1, '#F59E0B');
    ctx.fillStyle = featGrad;
    ctx.beginPath();
    ctx.roundRect(cardX + cardWidth - 216, cardY + 36, 180, 44, 12);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⭐ DESTACADO', cardX + cardWidth - 126, cardY + 65);
  }

  // Draw Product Image inside the Card
  const imageUrl =
    product.images && product.images.length > 0 && product.images[0]
      ? product.images[0]
      : product.imageUrl;

  if (imageUrl) {
    try {
      const img = await loadImage(imageUrl);
      if (img) {
        const padding = 110;
        const maxImgW = cardWidth - padding * 2;
        const maxImgH = cardHeight - padding * 2 - 30;
        const imgRatio = img.width / img.height;
        let drawW = maxImgW;
        let drawH = drawW / imgRatio;
        if (drawH > maxImgH) {
          drawH = maxImgH;
          drawW = drawH * imgRatio;
        }
        const imgX = cardX + (cardWidth - drawW) / 2;
        const imgY = cardY + 90 + (maxImgH - drawH) / 2;
        ctx.drawImage(img, imgX, imgY, drawW, drawH);
      }
    } catch (e) {
      console.warn('Could not draw product image to story card:', e);
    }
  }

  // 4. Product Details (Title, Specifications, Price)
  const infoStartY = cardY + cardHeight + 65;

  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '-0.5px';
  const afterTitleY = wrapText(ctx, product.name, width / 2, infoStartY, 920, 54, 2);

  // Specifications snippet (dimensions or specs)
  let specText = '';
  if (Array.isArray(product.specifications) && product.specifications.length > 0) {
    specText = product.specifications
      .slice(0, 2)
      .map((s) => `${s.key}: ${s.value}`)
      .join('  •  ');
  } else if (product.dimensions) {
    specText = `Medidas: ${product.dimensions}`;
  }

  let priceBadgeY = afterTitleY + 25;
  if (specText) {
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(specText, width / 2, afterTitleY + 10);
    priceBadgeY = afterTitleY + 45;
  }

  // 5. Giant Impact Price Badge
  const priceW = 540;
  const priceH = 110;
  const priceX = (width - priceW) / 2;

  // Gradient Price Pill
  const priceGradient = ctx.createLinearGradient(priceX, 0, priceX + priceW, 0);
  priceGradient.addColorStop(0, '#EA580C');
  priceGradient.addColorStop(0.5, '#F97316');
  priceGradient.addColorStop(1, '#F59E0B');

  ctx.shadowColor = 'rgba(234, 88, 12, 0.45)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 12;

  ctx.fillStyle = priceGradient;
  ctx.beginPath();
  ctx.roundRect(priceX, priceBadgeY, priceW, priceH, 28);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Price Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 58px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '-1px';
  ctx.fillText(formatCurrency(product.retailPrice), width / 2, priceBadgeY + 74);

  // Wholesale subtitle if applicable
  if (product.wholesalePrice > 0) {
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Mayorista: ${formatCurrency(product.wholesalePrice)} (+10 u.)`, width / 2, priceBadgeY + priceH + 34);
  }

  // 6. Bottom Banner with QR Code & Link Callout
  const bottomBoxY = height - 320;
  const bottomBoxH = 220;
  const bottomBoxW = 920;
  const bottomBoxX = (width - bottomBoxW) / 2;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(bottomBoxX, bottomBoxY, bottomBoxW, bottomBoxH, 28);
  ctx.fill();
  ctx.stroke();

  // Generate QR Code data URL and draw it
  try {
    const qrDataUrl = await QRCode.toDataURL(shareUrl, {
      width: 170,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
    const qrImg = await loadImage(qrDataUrl);
    if (qrImg) {
      // Rounded white frame for QR
      const qrFrameX = bottomBoxX + 30;
      const qrFrameY = bottomBoxY + 25;
      const qrFrameSize = 170;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(qrFrameX, qrFrameY, qrFrameSize, qrFrameSize, 18);
      ctx.fill();

      ctx.drawImage(qrImg, qrFrameX + 8, qrFrameY + 8, qrFrameSize - 16, qrFrameSize - 16);
    }
  } catch (err) {
    console.warn('QR code generation error for story card:', err);
  }

  // Call To Action Text next to QR
  const ctaX = bottomBoxX + 230;
  ctx.textAlign = 'left';

  // Sticker Hint Pill
  ctx.fillStyle = '#FEF3C7';
  ctx.beginPath();
  ctx.roundRect(ctaX, bottomBoxY + 36, 320, 36, 18);
  ctx.fill();

  ctx.fillStyle = '#92400E';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('🔗 STICKER DE ENLACE', ctaX + 22, bottomBoxY + 60);

  // Main CTA
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.letterSpacing = '0px';
  ctx.fillText('¡Tocá el enlace o escaneá el QR!', ctaX, bottomBoxY + 118);

  // Web Domain
  ctx.fillStyle = '#F97316';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('titufaris.online', ctaX, bottomBoxY + 158);

  // Return as Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create Blob from canvas'));
      }
    }, 'image/png', 0.95);
  });
}
