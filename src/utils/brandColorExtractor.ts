/**
 * Brand Color Extractor & Typography Presets
 * Allows extracting vibrant palette directly from any uploaded brand logo image
 * and provides curated typography choices for storefronts.
 */

export interface ExtractedPalette {
  primary: string;
  secondary: string;
  accent: string;
  topBarBg?: string;
  headerBg?: string;
  heroBg?: string;
}

export function isColorDark(hexColor?: string): boolean {
  if (!hexColor) return false;
  const hex = hexColor.replace('#', '').trim();
  if (hex.length < 3) return false;
  let r = 0, g = 0, b = 0;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16) || 0;
    g = parseInt(hex.substring(2, 4), 16) || 0;
    b = parseInt(hex.substring(4, 6), 16) || 0;
  }
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

export interface BrandPalettePreset {
  id: string;
  name: string;
  category: string;
  primary: string;
  secondary: string;
  accent: string;
  topBarBg?: string;
  headerBg?: string;
  heroBg?: string;
}

export interface BrandFontOption {
  id: string;
  name: string;
  fontFamily: string;
  category: string;
  description: string;
}

export const BRAND_FONT_OPTIONS: BrandFontOption[] = [
  {
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    category: 'Solemne & Tecnológica',
    description: 'Moderna, equilibrada y ultra legible en pantallas móviles y desktop.'
  },
  {
    id: 'inter',
    name: 'Inter',
    fontFamily: "'Inter', system-ui, sans-serif",
    category: 'Corporativa & Limpia',
    description: 'Estándar suizo mundial de interfaz y alta seriedad comercial.'
  },
  {
    id: 'outfit',
    name: 'Outfit',
    fontFamily: "'Outfit', system-ui, sans-serif",
    category: 'Vanguardista & Minimalista',
    description: 'Geometría pulida, ideal para marcas jóvenes, moda y diseño de autor.'
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    fontFamily: "'Montserrat', system-ui, sans-serif",
    category: 'Solemne & Robusta',
    description: 'Gran presencia de marca, mayúsculas con porte industrial y retail.'
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    fontFamily: "'Playfair Display', Georgia, serif",
    category: 'Clásica & Editorial',
    description: 'Sofisticada con serifa de lujo, ideal para joyería, vinos, alta costura.'
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    fontFamily: "'Space Grotesk', monospace, sans-serif",
    category: 'Industrial & Arquitectura',
    description: 'Aspecto técnico, ferretero, automotriz y de equipamiento pesado.'
  },
  {
    id: 'poppins',
    name: 'Poppins',
    fontFamily: "'Poppins', system-ui, sans-serif",
    category: 'Geométrica & Retail',
    description: 'Cálida, amigable y sumamente popular en tiendas de calzado y deporte.'
  },
  {
    id: 'oswald',
    name: 'Oswald',
    fontFamily: "'Oswald', Impact, sans-serif",
    category: 'Impacto & Deporte',
    description: 'Condensada de gran fuerza visual, excelente para zapatillas y sneakers.'
  },
  {
    id: 'roboto',
    name: 'Roboto',
    fontFamily: "'Roboto', system-ui, sans-serif",
    category: 'Estándar Comercial',
    description: 'Neutral, confiable y de lectura ágil en catálogos extensos.'
  }
];

export const BRAND_PALETTE_PRESETS: BrandPalettePreset[] = [
  {
    id: 'titufaris-industrial',
    name: 'Titufaris Naranja Industrial',
    category: 'Industria & Fábrica',
    primary: '#EA580C',
    secondary: '#0F172A',
    accent: '#F97316'
  },
  {
    id: 'zapas-sneakers',
    name: 'Zapas Sneaker & Streetwear',
    category: 'Calzado & Moda Urbana',
    primary: '#E11D48',
    secondary: '#09090B',
    accent: '#BE123C'
  },
  {
    id: 'tech-corporate',
    name: 'Azul Corporativo Pro',
    category: 'Tecnología & Mayorista',
    primary: '#2563EB',
    secondary: '#0F172A',
    accent: '#3B82F6'
  },
  {
    id: 'emerald-wellness',
    name: 'Verde Botánico & Farmacia',
    category: 'Salud, Orgánicos & Farmacia',
    primary: '#059669',
    secondary: '#064E3B',
    accent: '#10B981'
  },
  {
    id: 'luxury-boutique',
    name: 'Púrpura & Joyería',
    category: 'Boutique & Cosmética',
    primary: '#7C3AED',
    secondary: '#18181B',
    accent: '#A855F7'
  },
  {
    id: 'amber-hardware',
    name: 'Ámbar Ferretero & Taller',
    category: 'Ferretería & Construcción',
    primary: '#D97706',
    secondary: '#1E293B',
    accent: '#F59E0B'
  },
  {
    id: 'black-minimal',
    name: 'Monocromo Noir',
    category: 'Minimalismo & Lujo',
    primary: '#18181B',
    secondary: '#27272A',
    accent: '#71717A'
  },
  {
    id: 'gourmet-burgundy',
    name: 'Borgoña Gourmet & Vinos',
    category: 'Gastronomía & Vinería',
    primary: '#991B1B',
    secondary: '#450A0A',
    accent: '#DC2626'
  }
];

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Extracts dominant vibrant colors from any image source (DataURL or URL) using HTML5 Canvas.
 */
export async function extractPaletteFromImage(imageSrc: string): Promise<ExtractedPalette | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          // Sample down to 80x80 for high speed and noise reduction
          const size = 80;
          canvas.width = size;
          canvas.height = size;
          ctx.drawImage(img, 0, 0, size, size);

          const imageData = ctx.getImageData(0, 0, size, size);
          const data = imageData.data;

          const colorCounts: Record<string, { r: number; g: number; b: number; count: number; sat: number }> = {};

          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            if (a < 128) continue; // Skip transparency

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Filter out pure whites, very light greys, and pure black
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            if (brightness > 240 || brightness < 15) continue;

            // Calculate saturation (distance from grey)
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const sat = max === 0 ? 0 : (max - min) / max;

            // Quantize to 16 buckets
            const qr = Math.round(r / 24) * 24;
            const qg = Math.round(g / 24) * 24;
            const qb = Math.round(b / 24) * 24;
            const key = `${qr},${qg},${qb}`;

            if (!colorCounts[key]) {
              colorCounts[key] = { r: qr, g: qg, b: qb, count: 0, sat };
            }
            colorCounts[key].count += 1 + sat * 2; // boost vibrant colors
          }

          const sorted = Object.values(colorCounts).sort((a, b) => b.count - a.count);

          if (sorted.length === 0) {
            // Fallback to neutral dark if image was mostly monochrome
            resolve({
              primary: '#0F172A',
              secondary: '#1E293B',
              accent: '#3B82F6'
            });
            return;
          }

          // Primary: the most frequent vibrant color
          const primaryItem = sorted.find(c => c.sat > 0.25) || sorted[0];
          const primaryHex = rgbToHex(primaryItem.r, primaryItem.g, primaryItem.b);

          // Secondary: find another contrasting color
          const secondaryItem = sorted.find(c => {
            const diff = Math.abs(c.r - primaryItem.r) + Math.abs(c.g - primaryItem.g) + Math.abs(c.b - primaryItem.b);
            return diff > 80;
          });

          const secondaryHex = secondaryItem
            ? rgbToHex(secondaryItem.r, secondaryItem.g, secondaryItem.b)
            : '#0F172A';

          // Accent: another vibrant accent
          const accentItem = sorted.find(c => {
            const diffPrimary = Math.abs(c.r - primaryItem.r) + Math.abs(c.g - primaryItem.g) + Math.abs(c.b - primaryItem.b);
            const diffSec = secondaryItem ? (Math.abs(c.r - secondaryItem.r) + Math.abs(c.g - secondaryItem.g) + Math.abs(c.b - secondaryItem.b)) : 100;
            return diffPrimary > 100 && diffSec > 80 && c.sat > 0.3;
          });

          const accentHex = accentItem
            ? rgbToHex(accentItem.r, accentItem.g, accentItem.b)
            : primaryHex;

          resolve({
            primary: primaryHex,
            secondary: secondaryHex,
            accent: accentHex,
            topBarBg: secondaryHex,
            heroBg: secondaryHex,
            headerBg: '#ffffff',
          });
        } catch {
          resolve(null);
        }
      };

      img.onerror = () => {
        resolve(null);
      };

      img.src = imageSrc;
    } catch {
      resolve(null);
    }
  });
}
