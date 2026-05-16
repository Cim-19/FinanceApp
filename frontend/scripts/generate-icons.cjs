/**
 * Genera iconos PNG para la PWA sin dependencias externas.
 * Crea íconos con fondo violeta (#7c3aed) y el texto "FA".
 * Uso: node generate-icons.js
 */
const { deflateSync } = require('zlib');
const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf  = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf  = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePNG(size) {
  // Colores de la app
  const bg = { r: 124, g: 58,  b: 237 }; // #7c3aed (violet-600)
  const fg = { r: 255, g: 255, b: 255 }; // blanco

  // Píxeles: dibujar círculo de fondo y letras "FA" simples
  const pixels = new Uint8Array(size * size * 3);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.44;
  const innerR = size * 0.42;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const off = (y * size + x) * 3;

      // Fondo transparente (blanco)
      pixels[off]     = 255;
      pixels[off + 1] = 255;
      pixels[off + 2] = 255;

      // Rectángulo redondeado violeta
      const rx = size * 0.12; // radio de esquina
      const px = Math.abs(dx) - (size / 2 - rx);
      const py = Math.abs(dy) - (size / 2 - rx);
      const inRoundRect =
        (Math.abs(dx) < size / 2 - rx && Math.abs(dy) < size / 2) ||
        (Math.abs(dx) < size / 2 && Math.abs(dy) < size / 2 - rx) ||
        (px > 0 && py > 0 && Math.sqrt(px * px + py * py) < rx);

      if (inRoundRect) {
        pixels[off]     = bg.r;
        pixels[off + 1] = bg.g;
        pixels[off + 2] = bg.b;
      }

      // Dibujar "🐷" como texto no es posible sin canvas, dibujar "FA" pixel art escalado
      // Usamos una letra simple centrada — pixel art de "F" y "A"
    }
  }

  // Pixel-art de "FA" superpuesto
  const unit = Math.max(1, Math.floor(size / 20));
  const startX = Math.floor(cx - unit * 4.5);
  const startY = Math.floor(cy - unit * 4);

  // Letra F (5x7 pixels escalados)
  const F = [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
  ];
  // Letra A (5x7 pixels escalados)
  const A = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ];

  const drawLetter = (letter, ox, oy) => {
    for (let row = 0; row < letter.length; row++) {
      for (let col = 0; col < letter[row].length; col++) {
        if (letter[row][col]) {
          for (let dy2 = 0; dy2 < unit; dy2++) {
            for (let dx2 = 0; dx2 < unit; dx2++) {
              const px2 = ox + col * unit + dx2;
              const py2 = oy + row * unit + dy2;
              if (px2 >= 0 && px2 < size && py2 >= 0 && py2 < size) {
                const off = (py2 * size + px2) * 3;
                pixels[off]     = fg.r;
                pixels[off + 1] = fg.g;
                pixels[off + 2] = fg.b;
              }
            }
          }
        }
      }
    }
  };

  drawLetter(F, startX,              startY);
  drawLetter(A, startX + unit * 6,   startY);

  // Construir PNG
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Raw image data: filter byte (0) + RGB per row
  const rowLen = size * 3;
  const raw    = Buffer.alloc((1 + rowLen) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (rowLen + 1)] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const srcOff = (y * size + x) * 3;
      const dstOff = y * (rowLen + 1) + 1 + x * 3;
      raw[dstOff]     = pixels[srcOff];
      raw[dstOff + 1] = pixels[srcOff + 1];
      raw[dstOff + 2] = pixels[srcOff + 2];
    }
  }

  const compressed = deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = join(__dirname, 'public', 'icons');
mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const buf  = makePNG(size);
  const file = join(outDir, `icon-${size}x${size}.png`);
  writeFileSync(file, buf);
  console.log(`✓ ${file} (${buf.length} bytes)`);
}

console.log('Íconos generados correctamente.');
