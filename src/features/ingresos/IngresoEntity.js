// src/entity/IngresoEntity.js
export class IngresoEntity {
    /**
     * @param {Object} params
     * @param {string} params.fecha
     * @param {string} params.descripcion
     * @param {number} params.monto
     * @param {string} params.moneda
     * @param {string} [params.periodo]
     */
    constructor({ fecha, descripcion, monto, moneda, periodo } = {}) {
        this.fecha = fecha;
        this.descripcion = descripcion || '';
        this.monto = monto;
        this.moneda = moneda || 'ARS';
        this.periodo = periodo || (fecha ? fecha.slice(0, 7) : '');
    }
}
