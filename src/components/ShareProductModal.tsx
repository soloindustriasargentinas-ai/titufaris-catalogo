import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  QrCode,
  Sparkles,
  Send,
  CheckCircle2,
  Instagram,
  Download,
  Smartphone,
  Eye,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Product, CompanyProfile } from '../types';
import { formatCurrency } from '../utils/storage';
import {
  getProductShareUrl,
  getProductWhatsAppShareUrl,
  getProductFacebookShareUrl,
  getProductTwitterShareUrl,
  getProductTelegramShareUrl,
} from '../utils/productShare';
import { generateInstagramStoryCard } from '../utils/instagramStoryGenerator';

interface ShareProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  company: CompanyProfile;
  isAdmin?: boolean;
  onOpenQR?: (product: Product) => void;
}

export const ShareProductModal: React.FC<ShareProductModalProps> = ({
  isOpen,
  onClose,
  product,
  company,
  isAdmin = false,
  onOpenQR,
}) => {
  const [activeView, setActiveView] = useState<'options' | 'story'>('options');
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedStickerUrl, setCopiedStickerUrl] = useState(false);

  // Instagram Story Generation State
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [storyBlob, setStoryBlob] = useState<Blob | null>(null);
  const [storyImageUrl, setStoryImageUrl] = useState<string | null>(null);

  // Clean up Object URL on close or unmount
  useEffect(() => {
    return () => {
      if (storyImageUrl) {
        URL.revokeObjectURL(storyImageUrl);
      }
    };
  }, [storyImageUrl]);

  // Reset view when opening for a new product
  useEffect(() => {
    if (isOpen) {
      setActiveView('options');
      setCopied(false);
      setCopiedText(false);
      setCopiedStickerUrl(false);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const shareUrl = getProductShareUrl(product);
  const productImage =
    product.images && product.images.length > 0 && product.images[0]
      ? product.images[0]
      : product.imageUrl ||
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80';

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCopyStickerLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedStickerUrl(true);
      setTimeout(() => setCopiedStickerUrl(false), 2500);
    } catch (err) {
      console.error('Failed to copy sticker link:', err);
    }
  };

  const handleCopyFormattedText = async () => {
    const text = `¡Mirá este producto en ${company.name || 'Titufaris'}!\n*${product.name}* (SKU: ${product.sku})\n💵 Precio: ${formatCurrency(product.retailPrice)}\n👉 ${shareUrl}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${product.name} | ${company.name || 'Titufaris'}`,
          text: `Mirá este producto: ${product.name} (${formatCurrency(product.retailPrice)})`,
          url: shareUrl,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // Generate Instagram Story Card Blob & Data URL
  const prepareInstagramStory = async () => {
    setActiveView('story');
    if (storyBlob && storyImageUrl) return;

    setIsGeneratingStory(true);
    try {
      const blob = await generateInstagramStoryCard(product, company);
      setStoryBlob(blob);
      const url = URL.createObjectURL(blob);
      setStoryImageUrl(url);
    } catch (err) {
      console.error('Failed to generate Instagram Story image:', err);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // Download Story Image PNG
  const handleDownloadStoryImage = () => {
    if (!storyBlob) return;
    const cleanName = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 30);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(storyBlob);
    link.download = `story-titufaris-${cleanName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Share directly to Instagram Stories / Native Share with image file
  const handleShareStoryToInstagram = async () => {
    if (!storyBlob) return;

    const file = new File([storyBlob], `story-${product.sku || 'titufaris'}.png`, {
      type: 'image/png',
    });

    // Check if Web Share API supports file sharing (Mobile devices)
    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: `${product.name} | ${company.name || 'Titufaris'}`,
          text: `Disponible en ${company.name || 'Titufaris'}: ${shareUrl}`,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Fallback: Download image and open Instagram
    handleDownloadStoryImage();
    handleCopyStickerLink();

    // Attempt to open Instagram app or web
    setTimeout(() => {
      window.open('https://www.instagram.com', '_blank');
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 text-white flex items-center justify-between transition-colors ${
            activeView === 'story'
              ? 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-amber-500'
              : 'bg-gradient-to-r from-orange-600 to-amber-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {activeView === 'story' ? (
              <button
                type="button"
                onClick={() => setActiveView('options')}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer mr-0.5"
                title="Volver a opciones de compartir"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs text-white">
                <Share2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {activeView === 'story' ? 'Instagram Story Card' : 'Compartir Producto'}
              </h3>
              <p className="text-xs text-white/90">
                {activeView === 'story'
                  ? 'Tarjeta 9:16 de alta resolución con foto y precio'
                  : 'Enlace propio y directo para enviar a clientes o redes'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View 1: General Share Options */}
        {activeView === 'options' && (
          <div className="p-5 space-y-5">
            {/* Product Mini Preview Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={productImage}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <span className="font-mono text-[10px] font-bold text-slate-400 uppercase block">
                  SKU: {product.sku}
                </span>
                <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                  {product.name}
                </h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-black text-orange-600">
                    {formatCurrency(product.retailPrice)}
                  </span>
                  {product.wholesalePrice > 0 && (
                    <span className="text-[10px] text-slate-500 font-medium">
                      Mayorista: {formatCurrency(product.wholesalePrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Unique Link Input Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>Enlace propio del producto:</span>
                </label>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Probar enlace</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-xs bg-slate-100 border border-slate-300 rounded-xl font-mono text-slate-800 select-all focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Cualquier persona que abra este enlace verá directamente la ficha, fotos y precio de este producto en tu tienda.
              </p>
            </div>

            {/* Social / Direct Share Channels */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Compartir directamente en:
              </span>

              {/* Instagram Stories Highlight Banner Button - Exclusivo para administradores */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={prepareInstagramStory}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-amber-500 hover:from-fuchsia-700 hover:via-pink-700 hover:to-amber-600 text-white shadow-md transition-all cursor-pointer group hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs text-white">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-black tracking-wide flex items-center gap-1.5">
                        <span>Instagram Stories (9:16)</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-white/30 text-[9px] font-extrabold uppercase">
                          Admin Marketing
                        </span>
                      </div>
                      <div className="text-[11px] text-white/90">
                        Crea la imagen vertical lista con foto, precio y QR para tu historia
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs shadow-xs group-hover:bg-amber-100 transition-colors">
                    Crear Story
                  </div>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* WhatsApp Button */}
                <a
                  href={getProductWhatsAppShareUrl(product, company.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>WhatsApp</span>
                </a>

                {/* Native Mobile Share / General Share */}
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Más opciones...</span>
                </button>

                {/* Facebook Button */}
                <a
                  href={getProductFacebookShareUrl(product)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Facebook</span>
                </a>

                {/* Telegram Button */}
                <a
                  href={getProductTelegramShareUrl(product)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram</span>
                </a>
              </div>
            </div>

            {/* Extra Actions: Copy Full Text & Open QR */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={handleCopyFormattedText}
                className="text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1.5 cursor-pointer text-[11px]"
              >
                {copiedText ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">¡Mensaje copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copiar texto con precio y enlace</span>
                  </>
                )}
              </button>

              {onOpenQR && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQR(product);
                  }}
                  className="inline-flex items-center gap-1.5 font-bold text-orange-600 hover:text-orange-700 cursor-pointer text-[11px]"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Ver Código QR</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* View 2: Instagram Story Studio */}
        {activeView === 'story' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Story 9:16 Mockup Frame */}
              <div className="relative w-44 h-78 bg-slate-900 rounded-3xl p-2 shadow-2xl border-4 border-slate-800 shrink-0 flex items-center justify-center overflow-hidden">
                {isGeneratingStory ? (
                  <div className="flex flex-col items-center justify-center text-center p-3 text-white space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
                    <span className="text-[11px] font-semibold text-slate-300">
                      Diseñando Story...
                    </span>
                  </div>
                ) : storyImageUrl ? (
                  <img
                    src={storyImageUrl}
                    alt={`Story de ${product.name}`}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="text-[11px] text-slate-400 text-center p-3">
                    Error al generar imagen
                  </div>
                )}
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-700 rounded-full" />
              </div>

              {/* Story Actions & Sticker Assistant */}
              <div className="flex-1 w-full space-y-3.5">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <span>Publicar en Instagram Stories</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-snug">
                    Diseñada en formato vertical 9:16 (1080×1920) lista con la foto oficial, precio destacado y código QR.
                  </p>
                </div>

                {/* Primary Action: Share directly or Download */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleShareStoryToInstagram}
                    disabled={isGeneratingStory || !storyBlob}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-amber-500 hover:from-fuchsia-700 hover:via-pink-700 hover:to-amber-600 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Compartir en Instagram</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadStoryImage}
                    disabled={isGeneratingStory || !storyBlob}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Descargar Imagen Story (PNG)</span>
                  </button>
                </div>

                {/* Sticker Link Helper */}
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1">
                      <span>🔗 Enlace para el Sticker de Story</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyStickerLink}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedStickerUrl ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10.5px] text-amber-800 leading-tight">
                    En Instagram, agregá el sticker de <strong>"Enlace"</strong> y pegá este link para que tus seguidores compren directo tocando tu historia.
                  </p>
                </div>
              </div>
            </div>

            {/* Back button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setActiveView('options')}
                className="text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a WhatsApp y redes</span>
              </button>

              <span className="text-[10px] text-slate-400 font-mono">
                1080 × 1920 px (9:16)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
