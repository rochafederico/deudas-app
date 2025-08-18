// src/utils.js
export function yymm(fecha) {
    const date = new Date(fecha);
    return date.toISOString().slice(0, 7); // 'YYYY-MM'
}

export function todayISO() {
    return new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

export function fmtMoneda(moneda, n) {
    const options = { style: 'currency', currency: moneda };
    return new Intl.NumberFormat('es-AR', options).format(n);
}