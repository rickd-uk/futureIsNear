// Generates icon16.png, icon48.png, icon128.png using pure Node.js (no deps)
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Blue #2563eb = rgb(37, 99, 235)
const R = 37, G = 99, B = 235;

function isInRoundedRect(x, y, size, r) {
  const half = (size - 1) / 2;
  const dx = Math.max(0, Math.abs(x - half) - (half - r));
  const dy = Math.max(0, Math.abs(y - half) - (half - r));
  return dx * dx + dy * dy <= r * r;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "ascii");
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcVal]);
}

function buildPNG(size, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA

  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = y * (1 + size * 4) + 1 + x * 4;
      pixels.copy(raw, dst, src, src + 4);
    }
  }

  return Buffer.concat([
    sig,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", zlib.deflateSync(raw)),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

function createIcon(size, outPath) {
  const r = Math.max(2, Math.floor(size * 0.18));
  const pixels = Buffer.alloc(size * size * 4); // transparent by default

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (isInRoundedRect(x, y, size, r)) {
        const off = (y * size + x) * 4;
        pixels[off] = R; pixels[off + 1] = G; pixels[off + 2] = B; pixels[off + 3] = 255;
      }
    }
  }

  fs.writeFileSync(outPath, buildPNG(size, pixels));
  console.log(`Created ${outPath}`);
}

const dir = path.join(__dirname, "icons");
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

createIcon(16,  path.join(dir, "icon16.png"));
createIcon(48,  path.join(dir, "icon48.png"));
createIcon(128, path.join(dir, "icon128.png"));
