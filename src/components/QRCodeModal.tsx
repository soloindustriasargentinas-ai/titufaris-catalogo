import React, { useEffect, useState } from 'react';
import { X, Download, Copy, Check, ExternalLink, Printer, QrCode } from 'lucide-react';
import { Product, CompanyProfile } from '../types';
import { generateProductQRCode, getProductPublicUrl } from '../utils/qrCode';
import { formatCurrency } from '../utils/storage';

interface QRCodeModalProps {
  product: Product | null;
  company: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenProductDetail?: (product: Product) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  product,
  company,
  isOpen,
  onClose,
  onOpenProductDetail,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (product && isOpen) {
      generateProductQRCode(product, company.website).then(setQrDataUrl);
    }
  }, [product, isOpen, company.website]);

  if (!isOpen || !product) return null;

  const publicUrl = getProductPublicUrl(product, company.website);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_${product.sku}_${product.name.replace(/\s+/g, '_').substring(0, 20)}.png`;
    link.click();
  };

  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta Góndola - ${product.sku}</title>
          <style>
            @page { size: 90mm 60mm; margin: 0; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 12px;
              box-sizing: border-box;
              width: 90mm;
              height: 60mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              border: 1px solid #e2e8f0;
            }
            .notice {
              background-color: #ecfdf5;
              color: #065f46;
              font-size: 8px;
              font-weight: 800;
              text-align: center;
              padding: 2.5px 4px;
              border-radius: 4px;
              border: 1px solid #a7f3d0;
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .header {
              border-bottom: 2px solid #f97316;
              padding-bottom: 4px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .company { font-weight: 800; font-size: 13px; color: #0f172a; }
            .sku { font-size: 10px; color: #64748b; font-weight: bold; }
            .body { display: flex; gap: 10px; align-items: center; margin-top: 6px; }
            .info { flex: 1; }
            .title { font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.2; }
            .price { font-size: 22px; font-weight: 800; color: #ea580c; margin-top: 6px; }
            .wholesale { font-size: 10px; color: #475569; }
            .qr { width: 75px; height: 75px; }
            .footer { font-size: 8px; color: #64748b; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="notice">TIENDA ONLINE OFICIAL • Escanee para comprar o ver medidas</div>
          <div class="header">
            <span class="company">${company.name.toUpperCase()}</span>
            <span class="sku">${product.sku}</span>
          </div>
          <div class="body">
            <div class="info">
              <div class="title">${product.name}</div>
              <div class="price">${formatCurrency(product.retailPrice)}</div>
              <div class="wholesale">Mayorista x10+: ${formatCurrency(product.wholesalePrice)}</div>
            </div>
            <img class="qr" src="${qrDataUrl}" alt="QR" />
          </div>
          <div class="footer">Escanee para catálogo digital • Consultas: ${company.phone}</div>
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Código QR Dinámico</h2>
              <p className="text-xs text-slate-400">Enlace directo a producto en catálogo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Product Pill Info */}
          <div className="mb-4 text-left p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-orange-600 uppercase bg-orange-100 px-2 py-0.5 rounded-sm">
                SKU: {product.sku}
              </span>
              <span className="text-xs font-bold text-slate-900">
                {formatCurrency(product.retailPrice)}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">
              {product.name}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              Mayorista x10+: {formatCurrency(product.wholesalePrice)} • Stock: {product.stock} {product.unit}
            </p>
          </div>

          {/* Live store scan notice */}
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs flex items-center justify-center gap-2 font-medium">
            <span className="text-base">📱</span>
            <span>Al escanear con la cámara del celular, abre directamente la <strong>ficha oficial del producto con fotos, medidas y compra directa</strong></span>
          </div>

          {/* QR Code Container */}
          <div className="inline-block p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm mb-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Código QR para ${product.name}`}
                className="w-52 h-52 mx-auto rounded-lg"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-400">
                Generando QR...
              </div>
            )}
            <p className="text-[11px] text-slate-500 font-medium mt-2">
              Escanear con cámara de tablet o celular
            </p>
          </div>

          {/* Share link input */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs mb-5">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 bg-transparent px-2.5 py-1 text-slate-700 outline-none select-all truncate text-[11px]"
            />
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer shrink-0 text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownloadQR}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 text-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              Descargar Imagen QR
            </button>

            <button
              onClick={handlePrintLabel}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir Etiqueta
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Compatible con lectores láser y cámaras móviles</span>
          <button
            onClick={() => {
              onClose();
              onOpenProductDetail?.(product);
            }}
            className="text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            Ver ficha completa
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
