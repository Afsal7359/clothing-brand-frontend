/**
 * Compress an image in the browser before upload.
 *
 * The size limit is checked on the COMPRESSED OUTPUT, never on the input.
 * iOS hands `<input type="file">` a JPEG transcoded from the library's HEIC,
 * and HEIC is roughly twice as efficient as JPEG — so a photo the Photos app
 * reports as 3.9 MB arrives here as an 8–10 MB JPEG. Gating on the input size
 * bounced ordinary iPhone photos even though the WebP we actually upload is
 * ~200 KB. Only what we send has to satisfy the server's limit.
 *
 * Pipeline:
 *  - Skip re-encoding files already under 200 KB in a web-safe format.
 *  - Resize so the longest edge is ≤ maxPx (default 1200), never upscale.
 *  - Encode WebP at `quality` (≈25–35 % smaller than JPEG at equal perceived
 *    quality), falling back to JPEG where WebP encoding is unavailable.
 *  - If the result still exceeds the target, step quality down, then
 *    dimensions, until it fits.
 */

/** Server (multer) hard limit — keep in sync with services/underdwag upload.js */
export const SERVER_LIMIT_MB = 5;
/** Aim below the server limit so a borderline file can't 413 in flight. */
const TARGET_MB = 4;
/** Beyond this, canvas decoding risks crashing the tab on a phone. */
const DECODE_LIMIT_MB = 60;

const WEB_SAFE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MB = 1024 * 1024;
const fmtMB = (bytes) => `${(bytes / MB).toFixed(1)} MB`;

/** Decode to an <img>. Resolves null when the browser can't read the format. */
function decode(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.naturalWidth > 0 ? img : null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/** Draw at `px` longest edge and encode. Resolves null if encoding fails. */
function render(img, px, quality, baseName) {
  const ratio = Math.min(1, px / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * ratio));
  const h = Math.max(1, Math.round(img.naturalHeight * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const toBlob = (type, q) => new Promise((res) => canvas.toBlob(res, type, q));

  return (async () => {
    const webp = await toBlob('image/webp', quality);
    if (webp && webp.size > 0) {
      return new File([webp], `${baseName}.webp`, { type: 'image/webp' });
    }
    // WebP encoding unavailable — JPEG needs slightly higher quality to match.
    const jpeg = await toBlob('image/jpeg', Math.min(0.92, quality + 0.08));
    if (jpeg && jpeg.size > 0) {
      return new File([jpeg], `${baseName}.jpg`, { type: 'image/jpeg' });
    }
    return null;
  })();
}

export async function compressImage(file, { maxPx = 1200, quality = 0.8, targetMB = TARGET_MB } = {}) {
  if (!file) throw new Error('No file selected.');
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" is not an image.`);
  }
  // The only input-size rejection: files large enough to break decoding.
  if (file.size > DECODE_LIMIT_MB * MB) {
    throw new Error(
      `"${file.name}" is ${fmtMB(file.size)} — too large to process. Please use an image under ${DECODE_LIMIT_MB} MB.`
    );
  }

  const target = targetMB * MB;

  // Small and already servable — re-encoding would only lose quality.
  if (file.size < 200 * 1024 && WEB_SAFE.includes(file.type)) return file;

  const img = await decode(file);
  if (!img) {
    // Undecodable here (e.g. HEIC on a browser without HEIF support). Pass it
    // through if the server can take it; otherwise say what to do about it.
    if (file.size <= target) return file;
    throw new Error(
      `"${file.name}" (${fmtMB(file.size)}) couldn't be processed by this browser. Please re-save it as JPEG or PNG and try again.`
    );
  }

  const baseName = (file.name || 'image').replace(/\.[^.]+$/, '') || 'image';
  let px = maxPx;
  let q = quality;
  let best = null;

  // Quality first (cheap, near-invisible), then dimensions.
  for (let attempt = 0; attempt < 6; attempt++) {
    const out = await render(img, px, q, baseName);
    if (!out) break;
    best = out;
    if (out.size <= target) return out;
    if (q > 0.5) q = Math.max(0.5, q - 0.12);
    else px = Math.round(px * 0.75);
  }

  if (best) return best;          // encoded, just never got under target
  if (file.size <= target) return file;
  throw new Error(
    `"${file.name}" couldn't be compressed below ${targetMB} MB. Please use a smaller image.`
  );
}
