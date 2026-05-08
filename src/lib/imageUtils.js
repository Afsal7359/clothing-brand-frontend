/**
 * Compress an image file before upload.
 *
 * Strategy:
 *  - Reject files over maxMB (default 5 MB) before any processing.
 *  - Skip re-encoding for files already under 150 KB (no visible gain).
 *  - Resize so the longest edge is ≤ maxPx (default 1600) keeping aspect ratio.
 *  - Output WebP at quality 0.85 — 25–35 % smaller than JPEG at the same
 *    perceived quality with no visible clarity loss.
 *  - Fall back to JPEG 0.88 if the browser returns an empty WebP blob.
 *  - Always use imageSmoothingQuality:'high' for clean downscaling.
 */
export async function compressImage(file, { maxPx = 1200, quality = 0.80, maxMB = 5 } = {}) {
  if (file.size > maxMB * 1024 * 1024) {
    throw new Error(`Image is larger than ${maxMB} MB. Please use a smaller file.`);
  }

  // Already tiny — skip re-encode to avoid any quality loss from double-compression
  if (file.size < 200 * 1024) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Scale so the longest edge ≤ maxPx, never upscale
      const ratio = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      // Try WebP first
      canvas.toBlob(
        (webpBlob) => {
          if (webpBlob && webpBlob.size > 0) {
            const name = file.name.replace(/\.[^.]+$/, '.webp');
            resolve(new File([webpBlob], name, { type: 'image/webp' }));
          } else {
            // WebP not supported by this browser — fall back to JPEG at slightly
            // higher quality to compensate for JPEG's less-efficient codec
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  const name = file.name.replace(/\.[^.]+$/, '.jpg');
                  resolve(new File([jpegBlob], name, { type: 'image/jpeg' }));
                } else {
                  resolve(file); // last resort: send original
                }
              },
              'image/jpeg',
              0.88,
            );
          }
        },
        'image/webp',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // can't decode — send as-is
    };

    img.src = url;
  });
}
