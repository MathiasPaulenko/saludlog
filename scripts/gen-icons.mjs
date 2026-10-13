// Genera los íconos PNG de la PWA (cuadrado oscuro + check blanco).
// Corre una vez con: node scripts/gen-icons.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { join } from "node:path";

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function png(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const distToSegment = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(
    0,
    Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)),
  );
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
};

function render(size) {
  const px = Buffer.alloc(size * size * 4);
  const corner = size * 0.22;
  const stroke = size * 0.075;
  const [bx1, by1, bx2, by2] = [
    0.3 * size,
    0.55 * size,
    0.45 * size,
    0.68 * size,
  ];
  const [cx1, cy1, cx2, cy2] = [
    0.45 * size,
    0.68 * size,
    0.72 * size,
    0.36 * size,
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // fondo redondeado
      const inX = Math.max(0, corner - x, x - (size - corner));
      const inY = Math.max(0, corner - y, y - (size - corner));
      const inside = inX * inX + inY * inY <= corner * corner;
      if (!inside) continue;
      px[i] = 0x0c;
      px[i + 1] = 0x11;
      px[i + 2] = 0x0c;
      px[i + 3] = 255;
      // check lima
      const d = Math.min(
        distToSegment(x, y, bx1, by1, bx2, by2),
        distToSegment(x, y, cx1, cy1, cx2, cy2),
      );
      if (d <= stroke / 2) {
        px[i] = 0xa3;
        px[i + 1] = 0xe6;
        px[i + 2] = 0x35;
      }
    }
  }
  return png(size, px);
}

mkdirSync("public", { recursive: true });
writeFileSync(join("public", "icon-192.png"), render(192));
writeFileSync(join("public", "icon-512.png"), render(512));
console.log("icons: public/icon-192.png, public/icon-512.png");
