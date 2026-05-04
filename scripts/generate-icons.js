#!/usr/bin/env node
/**
 * scripts/generate-icons.js
 *
 * Genera src/icons/icon-192.png y src/icons/icon-512.png
 * extrayendo el isotipo directamente del favicon.ico existente,
 * para garantizar consistencia visual en todas las superficies.
 * Usa únicamente módulos built-in de Node.js — sin dependencias adicionales.
 */

import { inflateSync, deflateSync } from 'zlib';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'src', 'icons');
mkdirSync(OUT_DIR, { recursive: true });

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

// ── PNG encoder (RGBA, color type 6) ─────────────────────────────────────────
function pngChunk(type, data) {
    const len     = Buffer.allocUnsafe(4);
    len.writeUInt32BE(data.length);
    const typeBytes = Buffer.from(type, 'ascii');
    const crcBuf    = Buffer.allocUnsafe(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
    return Buffer.concat([len, typeBytes, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
    const bpp = 4;
    const raw = Buffer.allocUnsafe(height * (1 + width * bpp));
    for (let y = 0; y < height; y++) {
        raw[y * (1 + width * bpp)] = 0; // filter: None
        for (let x = 0; x < width; x++) {
            const s = (y * width + x) * bpp;
            const d = y * (1 + width * bpp) + 1 + x * bpp;
            raw[d] = rgba[s]; raw[d+1] = rgba[s+1]; raw[d+2] = rgba[s+2]; raw[d+3] = rgba[s+3];
        }
    }
    const ihdr = Buffer.allocUnsafe(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGBA
    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        pngChunk('IHDR', ihdr),
        pngChunk('IDAT', deflateSync(raw, { level: 9 })),
        pngChunk('IEND', Buffer.alloc(0)),
    ]);
}

// ── PNG decoder (soporta todos los tipos de color de 8 bits) ─────────────────
function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return (pa <= pb && pa <= pc) ? a : pb <= pc ? b : c;
}

function decodePNG(buf) {
    let pos = 8; // saltar firma PNG (8 bytes)
    let width = 0, height = 0, channels = 4;
    const idatBufs = [];

    while (pos + 12 <= buf.length) {
        const length = buf.readUInt32BE(pos); pos += 4;
        const type   = buf.slice(pos, pos + 4).toString('ascii'); pos += 4;
        const data   = buf.slice(pos, pos + length); pos += length + 4; // +4 para CRC

        if (type === 'IHDR') {
            width  = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
            const ct = data[9]; // color type (PNG spec §11.2.2)
            // 0=grayscale, 2=RGB, 3=indexed, 4=grayscale+alpha, 6=RGBA
            const CHANNELS_BY_COLOR_TYPE = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
            channels = CHANNELS_BY_COLOR_TYPE[ct] ?? 4;
        } else if (type === 'IDAT') {
            idatBufs.push(data);
        } else if (type === 'IEND') {
            break;
        }
    }

    const bpp      = channels;
    const stride   = width * bpp;
    const inflated = inflateSync(Buffer.concat(idatBufs));
    const rgba     = new Uint8Array(width * height * 4);
    let prevRow    = new Uint8Array(stride);

    for (let y = 0; y < height; y++) {
        const base   = y * (stride + 1);
        const filter = inflated[base];
        const curRow = new Uint8Array(stride);

        for (let x = 0; x < stride; x++) {
            const raw = inflated[base + 1 + x];
            const a   = x >= bpp ? curRow[x - bpp] : 0;
            const b   = prevRow[x];
            const c   = x >= bpp ? prevRow[x - bpp] : 0;
            curRow[x] = filter === 0 ? raw
                      : filter === 1 ? (raw + a) & 0xFF
                      : filter === 2 ? (raw + b) & 0xFF
                      : filter === 3 ? (raw + ((a + b) >> 1)) & 0xFF
                      :                (raw + paeth(a, b, c)) & 0xFF; // filter 4
        }

        for (let x = 0; x < width; x++) {
            const si = x * bpp, di = (y * width + x) * 4;
            if (channels === 1) {
                // grayscale → replicate into R, G, B
                rgba[di] = rgba[di+1] = rgba[di+2] = curRow[si];
                rgba[di+3] = 255;
            } else if (channels === 2) {
                // grayscale + alpha
                rgba[di] = rgba[di+1] = rgba[di+2] = curRow[si];
                rgba[di+3] = curRow[si+1];
            } else if (channels === 3) {
                // RGB
                rgba[di] = curRow[si]; rgba[di+1] = curRow[si+1]; rgba[di+2] = curRow[si+2];
                rgba[di+3] = 255;
            } else {
                // RGBA
                rgba[di] = curRow[si]; rgba[di+1] = curRow[si+1]; rgba[di+2] = curRow[si+2];
                rgba[di+3] = curRow[si+3];
            }
        }

        prevRow = curRow;
    }

    return { width, height, rgba };
}

// ── ICO: extrae el PNG embebido de mayor resolución ───────────────────────────
function extractLargestPNG(icoBuf) {
    const count = icoBuf.readUInt16LE(4);
    let bestPng = null, bestPixels = 0;

    for (let i = 0; i < count; i++) {
        const e         = 6 + i * 16;
        const w         = icoBuf[e]     || 256; // 0 en ICO significa 256 px
        const h         = icoBuf[e + 1] || 256;
        const imgSize   = icoBuf.readUInt32LE(e + 8);
        const imgOffset = icoBuf.readUInt32LE(e + 12);
        const imgData   = icoBuf.slice(imgOffset, imgOffset + imgSize);
        // PNG magic bytes: 0x89 'P' 'N' 'G'
        const isPng     = imgData[0] === 0x89 && imgData[1] === 0x50 &&
                          imgData[2] === 0x4E && imgData[3] === 0x47;
        if (isPng && w * h > bestPixels) { bestPixels = w * h; bestPng = imgData; }
    }

    return bestPng;
}

// ── Escalar con bilineal y centrar en canvas cuadrado con fondo crema ─────────
const BG = [242, 237, 232]; // crema Nivva #F2EDE8 — mismo fondo que el favicon

function resizeAndCenter(src, outSize) {
    const { width: sw, height: sh, rgba: srcRgba } = src;
    const pad    = Math.round(outSize * 0.04);
    const maxDim = outSize - pad * 2;
    const scale  = Math.min(maxDim / sw, maxDim / sh);
    const dw     = Math.round(sw * scale);
    const dh     = Math.round(sh * scale);
    const ox     = Math.round((outSize - dw) / 2);
    const oy     = Math.round((outSize - dh) / 2);

    const out = new Uint8Array(outSize * outSize * 4);
    // fondo crema opaco
    for (let i = 0; i < out.length; i += 4) {
        out[i] = BG[0]; out[i+1] = BG[1]; out[i+2] = BG[2]; out[i+3] = 255;
    }

    // interpolación bilineal + alpha composite sobre crema
    for (let dy = 0; dy < dh; dy++) {
        for (let dx = 0; dx < dw; dx++) {
            const sx = (dx / Math.max(dw - 1, 1)) * (sw - 1);
            const sy = (dy / Math.max(dh - 1, 1)) * (sh - 1);
            const x0 = Math.floor(sx), x1 = Math.min(x0 + 1, sw - 1);
            const y0 = Math.floor(sy), y1 = Math.min(y0 + 1, sh - 1);
            const fx = sx - x0, fy = sy - y0;

            const s = (ch) =>
                srcRgba[(y0 * sw + x0) * 4 + ch] * (1 - fx) * (1 - fy) +
                srcRgba[(y0 * sw + x1) * 4 + ch] *      fx  * (1 - fy) +
                srcRgba[(y1 * sw + x0) * 4 + ch] * (1 - fx) *      fy  +
                srcRgba[(y1 * sw + x1) * 4 + ch] *      fx  *      fy;

            const alpha = s(3) / 255;
            const di    = ((oy + dy) * outSize + (ox + dx)) * 4;
            out[di]   = Math.round(s(0) * alpha + BG[0] * (1 - alpha));
            out[di+1] = Math.round(s(1) * alpha + BG[1] * (1 - alpha));
            out[di+2] = Math.round(s(2) * alpha + BG[2] * (1 - alpha));
            out[di+3] = 255;
        }
    }

    return out;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const icoBuf = readFileSync(join(ROOT, 'favicon.ico'));
const pngBuf = extractLargestPNG(icoBuf);
if (!pngBuf) throw new Error('favicon.ico no contiene imágenes PNG embebidas');

const srcImg = decodePNG(pngBuf);
process.stdout.write(`Isotipo extraído del favicon: ${srcImg.width}×${srcImg.height}px\n`);

for (const size of [192, 512]) {
    const rgba    = resizeAndCenter(srcImg, size);
    const pngData = encodePNG(size, size, rgba);
    const outPath = join(OUT_DIR, `icon-${size}.png`);
    writeFileSync(outPath, pngData);
    process.stdout.write(`✔  icon-${size}.png  (${pngData.length} bytes)\n`);
}
process.stdout.write('Íconos generados en src/icons/\n');
