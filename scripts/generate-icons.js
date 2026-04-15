#!/usr/bin/env node
/**
 * scripts/generate-icons.js
 *
 * Genera src/icons/icon-192.png y src/icons/icon-512.png con la marca Nivva.
 * Usa únicamente módulos built-in de Node.js — sin dependencias adicionales.
 *
 * Diseño: fondo teal Nivva rgb(61,121,130) + letra "N" blanca centrada.
 */

import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'icons');
mkdirSync(OUT_DIR, { recursive: true });

const BG = [61, 121, 130];   // teal Nivva
const FG = [255, 255, 255];  // blanco

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
 * Dibuja una "N" estilizada compuesta por:
 *   • barra vertical izquierda
 *   • barra vertical derecha
 *   • banda diagonal de arriba-izquierda a abajo-derecha
 */
function drawN(rgb, W, H, [r, g, b]) {
    const m   = Math.round(W * 0.15);   // margen lateral
    const bw  = Math.round(W * 0.14);   // ancho de barra
    const top = Math.round(H * 0.14);
    const bot = Math.round(H * 0.86);

    // Barras verticales
    fillRect(rgb, W, m,           top, m + bw,       bot, r, g, b);
    fillRect(rgb, W, W - m - bw, top, W - m,         bot, r, g, b);

    // Diagonal: de (m, top) a (W-m-bw, bot)
    const dx = (W - m - bw) - m, dy = bot - top;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len, uy = dy / len;
    const halfBand = bw * 0.72;

    for (let py = top; py < bot; py++) {
        for (let px = m; px < W - m; px++) {
            const ex = px - m, ey = py - top;
            const cross = Math.abs(ex * uy - ey * ux);
            const dot   = ex * ux + ey * uy;
            if (cross < halfBand && dot >= 0 && dot <= len)
                setPixel(rgb, W, px, py, r, g, b);
        }
    }
}

// ── Generar ícono ────────────────────────────────────────────────────────────
function generateIcon(size) {
    const rgb = new Uint8Array(size * size * 3);
    fillRect(rgb, size, 0, 0, size, size, ...BG);
    drawN(rgb, size, size, FG);
    const png = encodePNG(size, size, rgb);
    const outPath = join(OUT_DIR, `icon-${size}.png`);
    writeFileSync(outPath, png);
    process.stdout.write(`✔  icon-${size}.png  (${png.length} bytes)\n`);
}

generateIcon(192);
generateIcon(512);
process.stdout.write('Íconos generados en src/icons/\n');
