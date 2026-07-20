/**
 * Real EAN-13 encoding + SVG rendering.
 * ---------------------------------------------------------------------------
 * Produces a genuinely scannable barcode (correct L/G/R symbol tables, parity
 * pattern chosen by the first digit, and proper start/centre/end guard bars).
 *
 * Structure — 95 modules total:
 *   start guard 101 | 6 left digits (7 modules each) | centre guard 01010
 *                   | 6 right digits (7 modules each) | end guard 101
 */

// Left-hand odd parity
const L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
// Left-hand even parity
const G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
// Right-hand
const R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];

// Which of L/G encodes each of digits 2-7, selected by the first digit.
const PARITY = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];

export function ean13CheckDigit(first12) {
  const s = String(first12).replace(/\D/g, '');
  if (s.length !== 12) return null;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  return String((10 - (sum % 10)) % 10);
}

export function isValidEan13(code) {
  const s = String(code || '').replace(/\D/g, '');
  return s.length === 13 && ean13CheckDigit(s.slice(0, 12)) === s[12];
}

/** Encode a 13-digit code into a 95-character module string ("1" = bar). */
export function encodeEan13(code) {
  const s = String(code || '').replace(/\D/g, '');
  if (s.length !== 13) return null;
  const parity = PARITY[Number(s[0])];
  let out = '101'; // start guard
  for (let i = 1; i <= 6; i++) {
    out += (parity[i - 1] === 'L' ? L : G)[Number(s[i])];
  }
  out += '01010'; // centre guard
  for (let i = 7; i <= 12; i++) out += R[Number(s[i])];
  out += '101'; // end guard
  return out;
}

/**
 * Render a scannable EAN-13 as an SVG string.
 * Guard bars run slightly longer than data bars, as on a real barcode, and the
 * human-readable digits sit in the standard 1 / 6 / 6 grouping.
 */
export function ean13SVG(code, { width = 240, height = 70, showText = true, color = '#000', bg = '#fff' } = {}) {
  const s = String(code || '').replace(/\D/g, '');
  const modules = encodeEan13(s);
  if (!modules) return '';

  const QUIET = 11;                    // mandatory quiet zone, in modules
  const totalModules = 95 + QUIET * 2;
  const textH = showText ? 10 : 0;
  const barH = 100 - textH;            // in viewBox units
  const guardH = barH + (showText ? 5 : 0);

  // Guard positions get the taller bars.
  const isGuard = (i) =>
    (i >= 0 && i < 3) || (i >= 45 && i < 50) || (i >= 92 && i < 95);

  let rects = '';
  for (let i = 0; i < 95; i++) {
    if (modules[i] !== '1') continue;
    rects += `<rect x="${QUIET + i}" y="0" width="1" height="${isGuard(i) ? guardH : barH}" fill="${color}"/>`;
  }

  let text = '';
  if (showText) {
    const fs = 9;
    const y = 100;
    // 1 digit outside-left, 6 under the left half, 6 under the right half.
    text += `<text x="${QUIET - 8}" y="${y}" font-size="${fs}" font-family="monospace" fill="${color}">${s[0]}</text>`;
    text += `<text x="${QUIET + 3 + 21}" y="${y}" font-size="${fs}" font-family="monospace" fill="${color}" text-anchor="middle" letter-spacing="1.5">${s.slice(1, 7)}</text>`;
    text += `<text x="${QUIET + 50 + 21}" y="${y}" font-size="${fs}" font-family="monospace" fill="${color}" text-anchor="middle" letter-spacing="1.5">${s.slice(7)}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} 105" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"><rect x="0" y="0" width="${totalModules}" height="105" fill="${bg}"/>${rects}${text}</svg>`;
}
