// Shared utility for formatting currency values in stats indicators
import CURRENCIES from '../../../shared/config/monedas.js';

const format = n => n == null ? '-' : Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/**
 * Given a { ARS: number, USD: number } object, returns an array of display strings
 * for every currency in CURRENCIES. Missing or zero values render as "-".
 * @param {Object|null} obj
 * @returns {string[]}
 */
export function addValue(obj) {
    return CURRENCIES.map(moneda => {
        const monto = obj ? obj[moneda] : undefined;
        const val = (monto == null || monto === 0) ? '-' : `$ ${format(monto)}`;
        return `${moneda}: ${val}`;
    });
}
