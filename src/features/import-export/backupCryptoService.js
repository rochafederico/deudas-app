// src/features/import-export/backupCryptoService.js
// Cifrado y descifrado de backups usando WebCrypto API (AES-GCM + PBKDF2).
// El archivo cifrado no es legible sin la clave del usuario.
//
// Formato del archivo cifrado (JSON):
// {
//   v: 1,                    — versión del esquema
//   salt: "<hex>",           — salt para PBKDF2 (16 bytes aleatorios)
//   iv:   "<hex>",           — IV para AES-GCM  (12 bytes aleatorios)
//   data: "<base64>",        — ciphertext AES-GCM
// }

const ALGO      = 'AES-GCM';
const KEY_LEN   = 256;
const PBKDF2_IT = 200_000;
const HASH      = 'SHA-256';
const SCHEMA_V  = 1;

function _getCrypto() {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
        return globalThis.crypto;
    }
    throw new Error('WebCrypto API no está disponible en este entorno.');
}

function _hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

function _bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function _bytesToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function _base64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function _deriveKey(password, salt) {
    const subtle = _getCrypto().subtle;
    const enc = new TextEncoder();
    const keyMaterial = await subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: PBKDF2_IT, hash: HASH },
        keyMaterial,
        { name: ALGO, length: KEY_LEN },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Cifra un string JSON con la contraseña del usuario.
 * @param {string} plaintext  — JSON serializado del backup
 * @param {string} password   — clave ingresada por el usuario
 * @returns {Promise<string>} — JSON string del sobre cifrado listo para guardar
 */
export async function encryptBackup(plaintext, password) {
    const crypto = _getCrypto();
    const enc    = new TextEncoder();

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv   = crypto.getRandomValues(new Uint8Array(12));
    const key  = await _deriveKey(password, salt);

    const cipherBuf = await crypto.subtle.encrypt(
        { name: ALGO, iv },
        key,
        enc.encode(plaintext)
    );

    return JSON.stringify({
        v:    SCHEMA_V,
        salt: _bytesToHex(salt),
        iv:   _bytesToHex(iv),
        data: _bytesToBase64(new Uint8Array(cipherBuf)),
    });
}

/**
 * Descifra un sobre producido por encryptBackup.
 * @param {string} encryptedJson — JSON string del sobre cifrado
 * @param {string} password      — clave del usuario
 * @returns {Promise<string>}    — plaintext original
 * @throws si la clave es incorrecta o el archivo está corrupto
 */
export async function decryptBackup(encryptedJson, password) {
    let envelope;
    try {
        envelope = JSON.parse(encryptedJson);
    } catch {
        throw new Error('El archivo de backup está corrupto o no es válido.');
    }

    if (envelope.v !== SCHEMA_V) {
        throw new Error(`Versión de backup no compatible: ${envelope.v}`);
    }

    const salt      = _hexToBytes(envelope.salt);
    const iv        = _hexToBytes(envelope.iv);
    const cipherBuf = _base64ToBytes(envelope.data);

    const key = await _deriveKey(password, salt);

    let plainBuf;
    try {
        plainBuf = await _getCrypto().subtle.decrypt(
            { name: ALGO, iv },
            key,
            cipherBuf
        );
    } catch {
        throw new Error('Clave incorrecta o archivo corrupto. No se pudo descifrar el backup.');
    }

    return new TextDecoder().decode(plainBuf);
}

/**
 * Devuelve el schema version actual para compatibilidad/documentación.
 */
export function getBackupSchemaVersion() {
    return SCHEMA_V;
}
