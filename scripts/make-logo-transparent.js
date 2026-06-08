// One-off: remove the solid black background from public/logo.png -> transparent PNG.
// Pure Node (zlib only). Flood-fills near-black from the image borders so dark
// outlines *inside* the chrome letters are preserved, then feathers the edge.
const fs = require('fs');
const zlib = require('zlib');

const SRC = process.argv[2] || 'public/logo.png';
const OUT = process.argv[3] || 'public/logo-trans.png';

const buf = fs.readFileSync(SRC);
const W = buf.readUInt32BE(16);
const H = buf.readUInt32BE(20);

// --- collect IDAT ---
let p = 8;
const idat = [];
while (p < buf.length) {
  const len = buf.readUInt32BE(p);
  const type = buf.toString('ascii', p + 4, p + 8);
  if (type === 'IDAT') idat.push(buf.subarray(p + 8, p + 8 + len));
  p += 12 + len;
  if (type === 'IEND') break;
}
const raw = zlib.inflateSync(Buffer.concat(idat));

// --- unfilter RGB scanlines ---
const bpp = 3;
const stride = W * bpp;
const rgb = Buffer.alloc(H * stride);
const paeth = (a, b, c) => {
  const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};
let q = 0;
for (let y = 0; y < H; y++) {
  const f = raw[q++];
  for (let x = 0; x < stride; x++) {
    const v = raw[q++];
    const a = x >= bpp ? rgb[y * stride + x - bpp] : 0;
    const b = y > 0 ? rgb[(y - 1) * stride + x] : 0;
    const c = x >= bpp && y > 0 ? rgb[(y - 1) * stride + x - bpp] : 0;
    let r;
    if (f === 0) r = v;
    else if (f === 1) r = v + a;
    else if (f === 2) r = v + b;
    else if (f === 3) r = v + ((a + b) >> 1);
    else r = v + paeth(a, b, c);
    rgb[y * stride + x] = r & 0xff;
  }
}

const lum = (i) => 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2];

// --- flood fill background from borders over near-black pixels ---
const BG_T = 95;          // treat as possible background if luminance below this
const isBg = new Uint8Array(W * H);
const stack = [];
const push = (i) => { if (!isBg[i] && lum(i) < BG_T) { isBg[i] = 1; stack.push(i); } };
for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
while (stack.length) {
  const i = stack.pop();
  const x = i % W, y = (i / W) | 0;
  if (x > 0) push(i - 1);
  if (x < W - 1) push(i + 1);
  if (y > 0) push(i - W);
  if (y < H - 1) push(i + W);
}

// --- full-res RGBA with feathered alpha on the flood-filled background ---
const srcA = Buffer.alloc(W * H * 4); // premultiplied-friendly source
for (let i = 0; i < W * H; i++) {
  let a = 255;
  if (isBg[i]) {
    const l = lum(i);
    a = Math.max(0, Math.min(255, Math.round(((l - 10) / 80) * 255)));
  }
  srcA[i * 4] = rgb[i * 3];
  srcA[i * 4 + 1] = rgb[i * 3 + 1];
  srcA[i * 4 + 2] = rgb[i * 3 + 2];
  srcA[i * 4 + 3] = a;
}

// --- box-filter downscale to target width (premultiplied alpha for clean edges) ---
const TW = Math.min(parseInt(process.argv[4] || '800', 10), W);
const TH = Math.round((H / W) * TW);
const out = Buffer.alloc(TH * (TW * 4 + 1));
let o = 0;
for (let ty = 0; ty < TH; ty++) {
  out[o++] = 0; // filter: none
  const y0 = Math.floor((ty * H) / TH), y1 = Math.max(y0 + 1, Math.floor(((ty + 1) * H) / TH));
  for (let tx = 0; tx < TW; tx++) {
    const x0 = Math.floor((tx * W) / TW), x1 = Math.max(x0 + 1, Math.floor(((tx + 1) * W) / TW));
    let R = 0, G = 0, B = 0, A = 0, n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = (y * W + x) * 4, a = srcA[i + 3] / 255;
      R += srcA[i] * a; G += srcA[i + 1] * a; B += srcA[i + 2] * a; A += srcA[i + 3]; n++;
    }
    const af = A / n;
    const inv = af > 0 ? 255 / A : 0; // un-premultiply
    out[o++] = Math.round(R * inv);
    out[o++] = Math.round(G * inv);
    out[o++] = Math.round(B * inv);
    out[o++] = Math.round(af);
  }
}
const W2 = TW, H2 = TH;

// --- re-encode PNG (colorType 6 RGBA) ---
const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
})();
const crc32 = (b) => { let c = ~0; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8); return ~c >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W2, 0); ihdr.writeUInt32BE(H2, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(out, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
fs.writeFileSync(OUT, png);
console.log('wrote', OUT, png.length, 'bytes', W2 + 'x' + H2);
