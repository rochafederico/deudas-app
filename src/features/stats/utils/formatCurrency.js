// Shared utility for formatting currency values in stats indicators
import CURRENCIES from '../../../shared/config/monedas.js';

/**
 * Formats a number using full Argentina locale notation (es-AR).
 * Example: 2310000 → "2.310.000"
 * Null/undefined values return '-'.
 * @param {number|null|undefined} n
 * @returns {string}
 */
function compactFormat(n) {
    if (n == null) return '-';
    return new Intl.NumberFormat('es-AR').format(n);
}

/**
 * Given a { ARS: number, USD: number } object, returns an array of
 * { currency, value } objects for every currency in CURRENCIES.
 * Missing or zero values render value as "-".
 * Amounts are shown in compact Spanish format (mil / M). No currency sign is included.
 * @param {Object|null} obj
 * @returns {{ currency: string, value: string }[]}
 */
export function addValue(obj) {
    return CURRENCIES.map(moneda => {
        const monto = obj ? obj[moneda] : undefined;
        const value = (monto == null || monto === 0) ? '-' : compactFormat(monto);
        return { currency: moneda, value };
    });
}

export { compactFormat };
