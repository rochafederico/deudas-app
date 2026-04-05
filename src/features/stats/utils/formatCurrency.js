// Shared utility for formatting currency values in stats indicators
import CURRENCIES from '../../../shared/config/monedas.js';

/**
 * Formats a number in compact Spanish notation:
 *   >= 1,000,000 → "X,XX Millones"
 *   >= 1,000     → "XXX mil"
 *   otherwise    → full number with 2 decimal places (es-AR)
 * Null/undefined values return '-'.
 * @param {number|null|undefined} n
 * @returns {string}
 */
function compactFormat(n) {
    if (n == null) return '-';
    const abs = Math.abs(n);
    if (abs >= 1_000_000) {
        const millones = n / 1_000_000;
        return Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(millones) + ' Millones';
    }
    if (abs >= 1_000) {
        const miles = n / 1_000;
        return Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(miles) + ' mil';
    }
    return Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

/**
 * Given a { ARS: number, USD: number } object, returns an array of display strings
 * for every currency in CURRENCIES. Missing or zero values render as "-".
 * Amounts are shown in compact Spanish format (mil / Millones).
 * @param {Object|null} obj
 * @returns {string[]}
 */
export function addValue(obj) {
    return CURRENCIES.map(moneda => {
        const monto = obj ? obj[moneda] : undefined;
        const val = (monto == null || monto === 0) ? '-' : `$ ${compactFormat(monto)}`;
        return `${moneda}: ${val}`;
    });
}

export { compactFormat };
