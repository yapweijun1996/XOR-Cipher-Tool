const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT_DIR = path.join(__dirname, "..", "img");

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function setPixel(buffer, width, x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= width) return;
  const offset = (y * width + x) * 4;
  buffer[offset] = color[0];
  buffer[offset + 1] = color[1];
  buffer[offset + 2] = color[2];
  buffer[offset + 3] = color[3];
}

function fillRect(buffer, width, x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      setPixel(buffer, width, xx, yy, color);
    }
  }
}

function drawIcon(size, maskable) {
  const pixels = Buffer.alloc(size * size * 4);
  const bg = [15, 118, 110, 255];
  const panel = [236, 253, 245, 255];
  const accent = [15, 118, 110, 255];
  const dark = [19, 78, 74, 255];

  fillRect(pixels, size, 0, 0, size, size, bg);

  const pad = Math.round(size * (maskable ? 0.22 : 0.14));
  fillRect(pixels, size, pad, pad, size - pad * 2, size - pad * 2, panel);

  const stroke = Math.max(6, Math.round(size * 0.075));
  const left = Math.round(size * 0.30);
  const right = Math.round(size * 0.70);
  const top = Math.round(size * 0.35);
  const mid = Math.round(size * 0.50);
  const bottom = Math.round(size * 0.65);

  drawLine(pixels, size, left, top, Math.round(size * 0.43), mid, stroke, accent);
  drawLine(pixels, size, Math.round(size * 0.43), mid, left, bottom, stroke, accent);
  drawLine(pixels, size, right, top, Math.round(size * 0.57), mid, stroke, accent);
  drawLine(pixels, size, Math.round(size * 0.57), mid, right, bottom, stroke, accent);
  drawLine(pixels, size, Math.round(size * 0.47), bottom, Math.round(size * 0.53), top, stroke, dark);

  return pixels;
}

function drawLine(buffer, width, x0, y0, x1, y1, thickness, color) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const radius = Math.floor(thickness / 2);

  for (let i = 0; i <= steps; i += 1) {
    const x = Math.round(x0 + (dx * i) / steps);
    const y = Math.round(y0 + (dy * i) / steps);
    fillRect(buffer, width, x - radius, y - radius, thickness, thickness, color);
  }
}

function writePng(fileName, size, maskable = false) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const pixels = drawIcon(size, maskable);

  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  fs.writeFileSync(path.join(OUT_DIR, fileName), png);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
writePng("icon-192.png", 192);
writePng("icon-512.png", 512);
writePng("icon-maskable-512.png", 512, true);
writePng("apple-touch-icon-180.png", 180);
console.log("Generated PWA icons.");
