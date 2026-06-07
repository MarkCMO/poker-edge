/**
 * Generates app assets (icon, adaptive icon, splash) as valid PNGs with no
 * third-party dependencies. House brand: navy #0B1120 + gold #C8A84E, with a
 * gold spade mark. Deterministic and instant; replace with final marketing art
 * any time, but these are real, submittable PNGs.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const NAVY = [11, 17, 32, 255];
const NAVY2 = [20, 30, 54, 255];
const GOLD = [200, 168, 78, 255];
const GOLD_DK = [168, 138, 60, 255];
const TRANSPARENT = [0, 0, 0, 0];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePng(width, height, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0;
    for (let x = 0; x < width; x++) {
      const p = pixels(x, y, width, height);
      raw[o++] = p[0]; raw[o++] = p[1]; raw[o++] = p[2]; raw[o++] = p[3];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function inCircle(x, y, cx, cy, r) {
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}
function sign(ax, ay, bx, by, cx, cy) {
  return (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
}
function inTri(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = sign(px, py, ax, ay, bx, by);
  const d2 = sign(px, py, bx, by, cx, cy);
  const d3 = sign(px, py, cx, cy, ax, ay);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

/** Spade mark centered in a w x h canvas, scaled to `scale` of the size. */
function inSpade(x, y, w, h, scale) {
  const cx = w / 2;
  const cy = h / 2 - h * 0.04;
  const s = Math.min(w, h) * scale;
  const apexX = cx, apexY = cy - s * 1.05;
  const baseY = cy + s * 0.28;
  const leftBaseX = cx - s * 0.95, rightBaseX = cx + s * 0.95;
  const body =
    inTri(x, y, apexX, apexY, leftBaseX, baseY, rightBaseX, baseY) ||
    inCircle(x, y, cx - s * 0.48, cy + s * 0.22, s * 0.55) ||
    inCircle(x, y, cx + s * 0.48, cy + s * 0.22, s * 0.55);
  // stem (points down, wider at the bottom)
  const stem = inTri(
    x, y,
    cx, cy + s * 0.2,
    cx - s * 0.42, cy + s * 1.0,
    cx + s * 0.42, cy + s * 1.0
  );
  return body || stem;
}

function iconPixels(x, y, w, h) {
  // diagonal navy gradient background
  const t = (x + y) / (w + h);
  const bg = [
    Math.round(NAVY[0] + (NAVY2[0] - NAVY[0]) * t),
    Math.round(NAVY[1] + (NAVY2[1] - NAVY[1]) * t),
    Math.round(NAVY[2] + (NAVY2[2] - NAVY[2]) * t),
    255,
  ];
  // thin gold frame
  const m = w * 0.055;
  const onFrame =
    (x > m && x < w - m && y > m && y < h - m) &&
    !(x > m + 8 && x < w - m - 8 && y > m + 8 && y < h - m - 8);
  if (onFrame) return GOLD_DK;
  if (inSpade(x, y, w, h, 0.3)) return GOLD;
  return bg;
}
function adaptivePixels(x, y, w, h) {
  return inSpade(x, y, w, h, 0.26) ? GOLD : TRANSPARENT;
}
function splashPixels(x, y, w, h) {
  return inSpade(x, y, w, h, 0.16) ? GOLD : TRANSPARENT;
}

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });
const jobs = [
  ['icon.png', 1024, 1024, iconPixels],
  ['adaptive-icon.png', 1024, 1024, adaptivePixels],
  ['splash.png', 1024, 1024, splashPixels],
];
for (const [name, w, h, fn] of jobs) {
  const png = encodePng(w, h, fn);
  fs.writeFileSync(path.join(assetsDir, name), png);
  console.log(`wrote assets/${name} (${png.length} bytes)`);
}
