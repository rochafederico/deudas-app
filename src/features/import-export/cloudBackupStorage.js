// src/features/import-export/cloudBackupStorage.js
// Persiste metadatos del último backup exitoso en localStorage.
// No almacena claves ni datos sensibles.

const KEY_LAST_BACKUP = 'nivva:cloudBackup:lastSuccess';

/**
 * Guarda la marca de tiempo del último backup exitoso.
 * @param {string} isoString — fecha en formato ISO 8601
 */
export function setLastCloudBackupTimestamp(isoString) {
    try {
        localStorage.setItem(KEY_LAST_BACKUP, isoString);
    } catch {
        // Entorno sin localStorage (p.ej. tests) — ignorar silenciosamente
    }
}

/**
 * Retorna la marca de tiempo del último backup exitoso, o null si no hay ninguno.
 * @returns {string|null}
 */
export function getLastCloudBackupTimestamp() {
    try {
        return localStorage.getItem(KEY_LAST_BACKUP) ?? null;
    } catch {
        return null;
    }
}

/**
 * Formatea una marca de tiempo ISO para mostrar en la UI.
 * @param {string|null} isoString
 * @returns {string} — fecha y hora en formato local
 */
export function formatBackupTimestamp(isoString) {
    if (!isoString) return null;
    try {
        const d = new Date(isoString);
        return d.toLocaleString('es-AR', {
            day:    '2-digit',
            month:  '2-digit',
            year:   'numeric',
            hour:   '2-digit',
            minute: '2-digit',
        });
    } catch {
        return isoString;
    }
}
