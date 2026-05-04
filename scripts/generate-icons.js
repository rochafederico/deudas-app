#!/usr/bin/env node
/**
 * scripts/generate-icons.js
 *
 * Genera src/icons/icon-192.png y src/icons/icon-512.png con la marca Nivva.
 * Usa únicamente módulos built-in de Node.js — sin dependencias adicionales.
 *
 * Diseño: fondo crema Nivva rgb(242,237,232) + isotipo V/chevron teal rgb(61,121,130),
 * idéntico al estilo del favicon.ico existente.
 */

import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'icons');
mkdirSync(OUT_DIR, { recursive: true });

const BG = [242, 237, 232]; // crema Nivva (#F2EDE8) — mismo fondo que el favicon
const FG = [61, 121, 130];   // teal Nivva (#3d7982)

// ── CRC32 ────────────────────────────────────────────────────────────────────
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    CRC_TABLE[i] = c;
}
function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG encoder ──────────────────────────────────────────────────────────────
function pngChunk(type, data) {
    const len = Buffer.allocUnsafe(4);
    len.writeUInt32BE(data.length);
    const typeBytes = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.allocUnsafe(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
    return Buffer.concat([len, typeBytes, data, crcBuf]);
}

function encodePNG(width, height, rgb) {
    // rgb: Uint8Array de triples RGB, row-major
    const raw = Buffer.allocUnsafe(height * (1 + width * 3));
    for (let y = 0; y < height; y++) {
        raw[y * (1 + width * 3)] = 0; // filtro: None
        for (let x = 0; x < width; x++) {
            const s = (y * width + x) * 3;
            const d = y * (1 + width * 3) + 1 + x * 3;
            raw[d] = rgb[s]; raw[d + 1] = rgb[s + 1]; raw[d + 2] = rgb[s + 2];
        }
    }

    const ihdr = Buffer.allocUnsafe(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        pngChunk('IHDR', ihdr),
        pngChunk('IDAT', deflateSync(raw, { level: 9 })),
        pngChunk('IEND', Buffer.alloc(0)),
    ]);
}

// ── Helpers de dibujo ────────────────────────────────────────────────────────
function setPixel(rgb, W, x, y, r, g, b) {
    if (x < 0 || x >= W || y < 0) return;
    const i = (y * W + x) * 3;
    rgb[i] = r; rgb[i + 1] = g; rgb[i + 2] = b;
}

function fillRect(rgb, W, x0, y0, x1, y1, r, g, b) {
    for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++)
            setPixel(rgb, W, x, y, r, g, b);
}

/**
 * Dibuja el isotipo V/chevron de Nivva: dos brazos triangulares que convergen
 * en un punto central inferior, formando el símbolo de escudo/V de la marca.
 * Mismo diseño que el favicon.ico existente.
 */
function drawV(rgb, W, H, [r, g, b]) {
    const topY   = Math.round(H * 0.08);  // borde superior del isotipo
    const botY   = Math.round(H * 0.92);  // punta inferior
    const tipX   = W >> 1;                // centro horizontal (punta del V)
    const outerL = Math.round(W * 0.06);  // borde izquierdo del brazo izq.
    const outerR = Math.round(W * 0.94);  // borde derecho del brazo der.
    const sw     = Math.round(W * 0.19);  // ancho de cada brazo en la cima

    for (let y = topY; y <= botY; y++) {
        const t = (y - topY) / (botY - topY); // 0 en cima → 1 en la punta

        // Brazo izquierdo: se estrecha linealmente hacia (tipX, botY)
        const lx0 = Math.round(outerL        * (1 - t) + tipX * t);
        const lx1 = Math.round((outerL + sw) * (1 - t) + tipX * t);
        for (let x = lx0; x <= lx1; x++) setPixel(rgb, W, x, y, r, g, b);

        // Brazo derecho: se estrecha linealmente hacia (tipX, botY)
        const rx0 = Math.round((outerR - sw) * (1 - t) + tipX * t);
        const rx1 = Math.round(outerR        * (1 - t) + tipX * t);
        for (let x = rx0; x <= rx1; x++) setPixel(rgb, W, x, y, r, g, b);
    }
}

// ── Generar ícono ────────────────────────────────────────────────────────────
function generateIcon(size) {
    const rgb = new Uint8Array(size * size * 3);
    fillRect(rgb, size, 0, 0, size, size, ...BG);
    drawV(rgb, size, size, FG);
    const png = encodePNG(size, size, rgb);
    const outPath = join(OUT_DIR, `icon-${size}.png`);
    writeFileSync(outPath, png);
    process.stdout.write(`✔  icon-${size}.png  (${png.length} bytes)\n`);
}

generateIcon(192);
generateIcon(512);
process.stdout.write('Íconos generados en src/icons/\n');
