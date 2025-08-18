// MontoModel.js
export class MontoModel {
    /**
     * @param {Object} params
     * @param {number} [params.id]
     * @param {number} params.monto
     * @param {string} params.moneda
     * @param {string} params.vencimiento
     * @param {string} [params.periodo]
     * @param {number} [params.deudaId]
     */
    constructor({ id, monto, moneda, vencimiento, periodo, deudaId }) {
        this.id = id;
        this.monto = Number(monto);
        this.moneda = moneda || 'ARS';
        this.vencimiento = vencimiento;
        this.periodo = periodo || (vencimiento ? vencimiento.slice(0, 7) : '');
        this.deudaId = deudaId;
    }
}
