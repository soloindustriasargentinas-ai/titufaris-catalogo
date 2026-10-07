/**
 * Utility for client-side image compression & optimization.
 * Prevents localStorage/IndexedDB quota overflow by downsizing massive phone/camera photos
 * (e.g. 5MB-10MB 4000x3000) down to web-optimized dimensions (~1200px max, ~80-140KB).
 */

export async function compressImageFile(
  file: File,
  maxDimension = 900,
  quality = 0.76
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate downscaled dimensions
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Use high-quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG data URL
        const mimeType = file.type === 'image/png' && hasTransparency(ctx, width, height)
          ? 'image/png'
          : 'image/jpeg';

        try {
          let compressedDataUrl = canvas.toDataURL(mimeType, quality);
          // If still over 150KB and larger than 700px, do a quick secondary reduction
          if (compressedDataUrl.length > 150000 && (width > 700 || height > 700)) {
            const secondCanvas = document.createElement('canvas');
            const targetDim = 700;
            const sWidth = width > height ? targetDim : Math.round((width * targetDim) / height);
            const sHeight = height > width ? targetDim : Math.round((height * targetDim) / width);
            secondCanvas.width = sWidth;
            secondCanvas.height = sHeight;
            const sCtx = secondCanvas.getContext('2d');
            if (sCtx) {
              sCtx.imageSmoothingEnabled = true;
              sCtx.imageSmoothingQuality = 'medium';
              sCtx.drawImage(canvas, 0, 0, sWidth, sHeight);
              compressedDataUrl = secondCanvas.toDataURL('image/jpeg', 0.68);
            }
          }
          resolve(compressedDataUrl);
        } catch {
          // Fallback to original
          resolve(e.target?.result as string);
        }
      };

      img.onerror = () => {
        resolve(e.target?.result as string);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const imgData = ctx.getImageData(0, 0, Math.min(width, 50), Math.min(height, 50)).data;
    for (let i = 3; i < imgData.length; i += 4) {
      if (imgData[i] < 255) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function compressDataUrl(
  dataUrl: string,
  maxDimension = 900,
  quality = 0.76
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width <= maxDimension && height <= maxDimension && dataUrl.length < 120000) {
        // Already small enough
        resolve(dataUrl);
        return;
      }

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Optimizes an array of product image URLs/data-URLs to ensure total payload
 * remains safely below Firestore's 1MB limit and browser memory constraints.
 */
export async function optimizeProductImages(
  images: string[],
  maxDimension = 850,
  quality = 0.74
): Promise<string[]> {
  if (!images || images.length === 0) return [];
  // Limit to 4 images max per product
  const targetImages = images.slice(0, 4);
  const results: string[] = [];
  for (const img of targetImages) {
    if (img && img.startsWith('data:image/')) {
      const comp = await compressDataUrl(img, maxDimension, quality);
      results.push(comp);
    } else if (img) {
      results.push(img);
    }
  }
  return results;
}
