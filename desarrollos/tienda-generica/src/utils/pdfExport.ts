import jsPDF from 'jspdf';
import { Product, Category, CompanyProfile } from '../types';
import { generateProductQRCode } from './qrCode';

export interface PDFExportOptions {
  type: 'catalog_visual' | 'price_list' | 'qr_labels';
  title?: string;
  includeWholesale: boolean;
  includeRetail: boolean;
  includeCost: boolean;
  includeStock: boolean;
  includeSpecs: boolean;
  includeImages: boolean;
  includeQRCodes: boolean;
  selectedCategories: string[];
}

// In-memory cache for converted base64 thumbnails
const imageCache = new Map<string, string | null>();

/**
 * Loads an image from URL and converts it into a scaled base64 JPEG data URL for jsPDF.
 */
export async function loadImageAsDataUrl(url: string): Promise<string | null> {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:image/')) return trimmed;
  if (imageCache.has(trimmed)) return imageCache.get(trimmed) || null;

  try {
    const dataUrl = await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      let finished = false;

      const done = (val: string | null) => {
        if (!finished) {
          finished = true;
          resolve(val);
        }
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 280; // High quality miniature for 36x36mm PDF print
          let w = img.naturalWidth || img.width || 120;
          let h = img.naturalHeight || img.height || 120;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            done(null);
            return;
          }
          // White background padding
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          const result = canvas.toDataURL('image/jpeg', 0.85);
          done(result);
        } catch {
          done(null);
        }
      };

      img.onerror = () => done(null);
      setTimeout(() => done(null), 2500); // 2.5s safe timeout
      img.src = trimmed;
    });

    imageCache.set(trimmed, dataUrl);
    return dataUrl;
  } catch {
    imageCache.set(trimmed, null);
    return null;
  }
}

export async function exportCatalogToPDF(
  products: Product[],
  categories: Category[],
  company: CompanyProfile,
  options: PDFExportOptions
): Promise<void> {
  const filteredProducts = products
    .filter(
      p => p.active && (options.selectedCategories.length === 0 || options.selectedCategories.includes(p.category))
    )
    .sort((a, b) => {
      const aOrder = a.sortOrder ?? 999999;
      const bOrder = b.sortOrder ?? 999999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      const aFeat = a.featured ? 1 : 0;
      const bFeat = b.featured ? 1 : 0;
      if (aFeat !== bFeat) return bFeat - aFeat;
      return 0;
    });

  // Pre-load miniature images in parallel if images are enabled
  const imageMap = new Map<string, string | null>();
  if (options.includeImages) {
    const loadPromises = filteredProducts.map(async (p) => {
      const imgUrl = p.imageUrl || (p.images && p.images[0]) || '';
      if (imgUrl) {
        const data = await loadImageAsDataUrl(imgUrl);
        if (data) imageMap.set(p.id, data);
      }
    });
    await Promise.all(loadPromises);
  }

  const doc = new jsPDF({
    orientation: options.type === 'price_list' ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  const categoryMap = new Map<string, string>(categories.map(c => [c.id, c.name]));

  // Helper: Draw header
  const drawHeader = (title: string) => {
    // Brand Top Bar
    doc.setFillColor(249, 115, 22); // #F97316 Orange
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Company Brand Name & Subtitle
    doc.setTextColor(15, 23, 42); // Navy / Deep Slate
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(company.name.toUpperCase(), margin, 16);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(249, 115, 22);
    doc.text(company.tagline || 'EQUIPAMIENTO COMERCIAL & LAYOUT', margin, 21);

    // Document Type & Date
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(title, pageWidth - margin, 16, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const dateStr = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    doc.text(`Fecha de emisión: ${dateStr}`, pageWidth - margin, 21, { align: 'right' });

    // Contact info bar
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const contactLine = `CUIT: ${company.taxId} | Tel: ${company.phone} | Email: ${company.email} | ${company.address}, ${company.city}`;
    doc.text(contactLine, margin, 26);

    // Subtle divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, 29, pageWidth - margin, 29);

    currentY = 34;
  };

  // Helper: Draw footer
  const totalPagesExp = '{total_pages_count_string}';
  const drawFooter = (pageNum: number) => {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${company.name} - Catálogo & Lista Oficial de Precios - ${company.website || 'titufaris.com.ar'}`,
      margin,
      pageHeight - 7
    );
    doc.text(`Página ${pageNum}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  // 1. VISUAL CATALOG
  if (options.type === 'catalog_visual') {
    let pageNum = 1;
    drawHeader(options.title || 'CATÁLOGO DE PRODUCTOS');

    for (let i = 0; i < filteredProducts.length; i++) {
      const p = filteredProducts[i];
      const cardHeight = 46;

      // Check page break
      if (currentY + cardHeight > pageHeight - 16) {
        drawFooter(pageNum);
        doc.addPage();
        pageNum++;
        drawHeader(options.title || 'CATÁLOGO DE PRODUCTOS');
      }

      // Card Background
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, cardHeight, 2, 2, 'FD');

      // Accent pill on left
      doc.setFillColor(249, 115, 22);
      doc.rect(margin, currentY, 2.5, cardHeight, 'F');

      // Product Thumbnail / Miniatura (36x36 mm)
      const thumbW = 36;
      const thumbH = 36;
      const thumbX = margin + 5;
      const thumbY = currentY + 5;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(thumbX, thumbY, thumbW, thumbH, 1.5, 1.5, 'FD');

      const imgData = imageMap.get(p.id);
      if (imgData) {
        try {
          doc.addImage(imgData, 'JPEG', thumbX + 0.8, thumbY + 0.8, thumbW - 1.6, thumbH - 1.6, undefined, 'FAST');
        } catch {
          // Fallback box
          doc.setFillColor(241, 245, 249);
          doc.roundedRect(thumbX + 0.8, thumbY + 0.8, thumbW - 1.6, thumbH - 1.6, 1, 1, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.text('FOTO', thumbX + thumbW / 2, thumbY + thumbH / 2 - 1, { align: 'center' });
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'normal');
          doc.text(p.sku, thumbX + thumbW / 2, thumbY + thumbH / 2 + 3.5, { align: 'center' });
        }
      } else {
        // Fallback placeholder
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(thumbX + 0.8, thumbY + 0.8, thumbW - 1.6, thumbH - 1.6, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('FOTO', thumbX + thumbW / 2, thumbY + thumbH / 2 - 1, { align: 'center' });
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'normal');
        doc.text(p.sku, thumbX + thumbW / 2, thumbY + thumbH / 2 + 3.5, { align: 'center' });
      }

      // Middle Content Details (Title, SKU, Description, Specs)
      const contentStartX = thumbX + thumbW + 4;
      const priceBoxX = options.includeQRCodes ? pageWidth - margin - 64 : pageWidth - margin - 48;
      const textWidth = priceBoxX - 4 - contentStartX;

      // Product Title
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const titleLines = doc.splitTextToSize(p.name, textWidth);
      doc.text(titleLines.slice(0, 2), contentStartX, currentY + 6.5);

      // SKU & Category Badge
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const catName = categoryMap.get(p.category) || p.category;
      const skuY = currentY + (titleLines.length > 1 ? 15.5 : 12);
      doc.text(`SKU: ${p.sku}  |  ${catName}  |  ${p.unit || 'unidad'}`, contentStartX, skuY);

      // Description
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      const descLines = doc.splitTextToSize(p.description || '', textWidth);
      const descY = skuY + 4.5;
      doc.text(descLines.slice(0, 2), contentStartX, descY);

      // Specs summary
      if (options.includeSpecs && p.specifications && p.specifications.length > 0) {
        doc.setFontSize(6.2);
        doc.setTextColor(100, 116, 139);
        const specSummary = p.specifications.slice(0, 3).map(s => `${s.key}: ${s.value}`).join('  •  ');
        const specLines = doc.splitTextToSize(specSummary, textWidth);
        doc.text(specLines[0], contentStartX, currentY + cardHeight - 4);
      }

      // Price & Stock block on the right
      doc.setFont('helvetica', 'bold');

      if (options.includeRetail) {
        doc.setFontSize(11.5);
        doc.setTextColor(234, 88, 12); // Orange dark
        doc.text(`$ ${p.retailPrice.toLocaleString('es-AR')}`, priceBoxX, currentY + 9);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('Precio Minorista (IVA inc.)', priceBoxX, currentY + 13);
      }

      if (options.includeWholesale) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`Mayorista: $ ${p.wholesalePrice.toLocaleString('es-AR')}`, priceBoxX, currentY + 20);
      }

      if (options.includeCost) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(220, 38, 38);
        doc.text(`Costo: $ ${p.costPrice.toLocaleString('es-AR')}`, priceBoxX, currentY + 26);
      }

      if (options.includeStock) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        const stockY = options.includeCost
          ? currentY + 31
          : options.includeWholesale
          ? currentY + 26
          : currentY + 20;

        if (p.isMadeToOrder) {
          doc.setTextColor(79, 70, 229); // Indigo
          doc.text(`• A pedido (Demora ${p.leadTimeDays || 15}d)`, priceBoxX, stockY);
        } else if (p.stock <= 0) {
          doc.setTextColor(220, 38, 38);
          doc.text('• Sin Stock disponible', priceBoxX, stockY);
        } else if (p.stock <= p.minStock) {
          doc.setTextColor(217, 119, 6);
          doc.text(`• Stock bajo: ${p.stock} disp.`, priceBoxX, stockY);
        } else {
          doc.setTextColor(16, 185, 129);
          doc.text(`• Entrega inm. (${p.stock} disp.)`, priceBoxX, stockY);
        }
      }

      // Dynamic QR Code embed (if selected)
      if (options.includeQRCodes) {
        try {
          const qrDataUrl = await generateProductQRCode(p, company.website);
          if (qrDataUrl) {
            const qrSize = 18;
            const qrX = pageWidth - margin - 22;
            const qrY = currentY + 13;
            doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
            doc.setFontSize(5.5);
            doc.setTextColor(148, 163, 184);
            doc.text('Escanear QR', qrX + qrSize / 2, qrY + qrSize + 2.5, { align: 'center' });
          }
        } catch {
          // QR generation fallback
        }
      }

      currentY += cardHeight + 4;
    }

    // Add company notes if space permits or on new page
    if (company.catalogNotes || company.termsAndConditions) {
      if (currentY + 30 > pageHeight - 16) {
        drawFooter(pageNum);
        doc.addPage();
        pageNum++;
        drawHeader('CONDICIONES & NOTAS COMERCIALES');
      }

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('CONDICIONES COMERCIALES & GARANTÍA', margin + 4, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const notesText = doc.splitTextToSize(
        `${company.catalogNotes} ${company.termsAndConditions}`,
        pageWidth - margin * 2 - 8
      );
      doc.text(notesText.slice(0, 3), margin + 4, currentY + 11);
    }

    drawFooter(pageNum);
  }

  // 2. TABULAR PRICE LIST (B2B Landscape)
  else if (options.type === 'price_list') {
    let pageNum = 1;
    drawHeader(options.title || 'LISTA OFICIAL DE PRECIOS MAYORISTA Y MINORISTA');

    // Table Header
    const colX = {
      thumb: margin,
      sku: margin + 14,
      name: margin + 38,
      category: margin + 125,
      stock: margin + 172,
      cost: margin + 192,
      wholesale: margin + 215,
      retail: margin + 242,
    };

    const rowHeight = 10;

    const drawTableHeader = () => {
      doc.setFillColor(15, 23, 42); // Dark Slate
      doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);

      doc.text('FOTO', colX.thumb + 1.5, currentY + 5);
      doc.text('CÓDIGO / SKU', colX.sku + 1, currentY + 5);
      doc.text('DESCRIPCIÓN DEL ARTÍCULO', colX.name, currentY + 5);
      doc.text('CATEGORÍA', colX.category, currentY + 5);
      doc.text('STOCK', colX.stock, currentY + 5);
      if (options.includeCost) doc.text('COSTO', colX.cost, currentY + 5);
      if (options.includeWholesale) doc.text('P. MAYORISTA', colX.wholesale, currentY + 5);
      if (options.includeRetail) doc.text('P. MINORISTA', colX.retail, currentY + 5);

      currentY += 8;
    };

    drawTableHeader();

    filteredProducts.forEach((p, idx) => {
      if (currentY + rowHeight > pageHeight - 16) {
        drawFooter(pageNum);
        doc.addPage();
        pageNum++;
        drawHeader(options.title || 'LISTA OFICIAL DE PRECIOS');
        drawTableHeader();
      }

      // Zebra striping
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY - 1, pageWidth - margin * 2, rowHeight, 'F');
      }

      // Thumbnail in table
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(colX.thumb, currentY - 0.5, 11, 8.5, 1, 1, 'FD');
      const imgData = imageMap.get(p.id);
      if (imgData) {
        try {
          doc.addImage(imgData, 'JPEG', colX.thumb + 0.5, currentY, 10, 7.5, undefined, 'FAST');
        } catch {
          // fallback
        }
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);

      // SKU
      doc.setFont('helvetica', 'bold');
      doc.text(p.sku, colX.sku + 1, currentY + 5);

      // Name
      doc.setFont('helvetica', 'normal');
      const cleanName = p.name.length > 50 ? p.name.substring(0, 48) + '...' : p.name;
      doc.text(cleanName, colX.name, currentY + 5);

      // Category
      doc.setTextColor(100, 116, 139);
      doc.text(categoryMap.get(p.category) || p.category, colX.category, currentY + 5);

      // Stock
      if (p.isMadeToOrder) {
        doc.setTextColor(79, 70, 229);
        doc.text(`A pedido (${p.leadTimeDays || 15}d)`, colX.stock, currentY + 5);
      } else if (p.stock <= p.minStock) {
        doc.setTextColor(220, 38, 38);
        doc.text(`${p.stock} ${p.unit || ''}`, colX.stock, currentY + 5);
      } else {
        doc.setTextColor(16, 185, 129);
        doc.text(`${p.stock} ${p.unit || ''}`, colX.stock, currentY + 5);
      }

      // Cost
      if (options.includeCost) {
        doc.setTextColor(100, 116, 139);
        doc.text(`$ ${p.costPrice.toLocaleString('es-AR')}`, colX.cost, currentY + 5);
      }

      // Wholesale
      if (options.includeWholesale) {
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(`$ ${p.wholesalePrice.toLocaleString('es-AR')}`, colX.wholesale, currentY + 5);
      }

      // Retail
      if (options.includeRetail) {
        doc.setTextColor(234, 88, 12);
        doc.setFont('helvetica', 'bold');
        doc.text(`$ ${p.retailPrice.toLocaleString('es-AR')}`, colX.retail, currentY + 5);
      }

      currentY += rowHeight;
    });

    drawFooter(pageNum);
  }

  // 3. QR GONDOLA LABELS (Printable Tag Grid)
  else if (options.type === 'qr_labels') {
    let pageNum = 1;
    drawHeader('ETIQUETAS DE GÓNDOLA Y CÓDIGOS QR');

    const labelWidth = (pageWidth - margin * 2 - 8) / 3;
    const labelHeight = 46;
    let col = 0;

    for (let i = 0; i < filteredProducts.length; i++) {
      const p = filteredProducts[i];
      const x = margin + col * (labelWidth + 4);

      if (currentY + labelHeight > pageHeight - 16) {
        drawFooter(pageNum);
        doc.addPage();
        pageNum++;
        drawHeader('ETIQUETAS DE GÓNDOLA Y CÓDIGOS QR');
        col = 0;
      }

      // Border box
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(x, currentY, labelWidth, labelHeight, 2, 2, 'FD');

      // Top brand accent
      doc.setFillColor(249, 115, 22);
      doc.rect(x, currentY, labelWidth, 3, 'F');

      // Brand small label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text(company.name.toUpperCase(), x + 4, currentY + 7);

      // SKU
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(`SKU: ${p.sku}`, x + labelWidth - 4, currentY + 7, { align: 'right' });

      // Product Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      const nameLines = doc.splitTextToSize(p.name, labelWidth - 8);
      doc.text(nameLines.slice(0, 2), x + 4, currentY + 12);

      // Big Price
      doc.setFontSize(13);
      doc.setTextColor(234, 88, 12);
      doc.text(`$ ${p.retailPrice.toLocaleString('es-AR')}`, x + 4, currentY + 23);

      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text(`Mayorista: $ ${p.wholesalePrice.toLocaleString('es-AR')}`, x + 4, currentY + 28);
      doc.text(`Barras: ${p.barcode}`, x + 4, currentY + 33);

      // QR Code on right side of label
      try {
        const qrDataUrl = await generateProductQRCode(p, company.website);
        if (qrDataUrl) {
          const qrSize = 20;
          doc.addImage(qrDataUrl, 'PNG', x + labelWidth - qrSize - 4, currentY + 18, qrSize, qrSize);
          doc.setFontSize(5);
          doc.setTextColor(148, 163, 184);
          doc.text('Escanear Info', x + labelWidth - qrSize / 2 - 4, currentY + 41, { align: 'center' });
        }
      } catch {
        // Safe catch
      }

      col++;
      if (col >= 3) {
        col = 0;
        currentY += labelHeight + 4;
      }
    }

    drawFooter(pageNum);
  }

  // Save PDF file
  const fileName = `Titufaris_${options.type}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

// CSV Export for Excel & ERP integration
export function exportToCSV(products: Product[], categories: Category[]): void {
  const categoryMap = new Map<string, string>(categories.map(c => [c.id, c.name]));
  
  const headers = [
    'ID',
    'SKU',
    'Nombre',
    'Categoría',
    'Precio Costo',
    'Precio Mayorista',
    'Precio Minorista',
    'Margen (%)',
    'Stock Actual',
    'Stock Mínimo',
    'Unidad',
    'Código de Barras',
    'Descripción',
    'Última Modificación'
  ];

  const rows = products.map(p => {
    const marginPct = p.costPrice > 0 ? (((p.retailPrice - p.costPrice) / p.costPrice) * 100).toFixed(1) : '0';
    return [
      `"${p.id}"`,
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${categoryMap.get(p.category) || p.category}"`,
      p.costPrice,
      p.wholesalePrice,
      p.retailPrice,
      marginPct,
      p.stock,
      p.minStock,
      `"${p.unit || 'unidad'}"`,
      `"${p.barcode}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      `"${p.updatedAt}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Titufaris_Inventario_Precios_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
