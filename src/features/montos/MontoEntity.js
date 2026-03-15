// MontoEntity.js
export class MontoEntity {
    /**
     * @param {Object} params
     * @param {number} params.deudaId
     * @param {number} params.monto
     * @param {string} params.moneda
     * @param {string} params.vencimiento
     * @param {string} [params.periodo]
     */
    constructor({ deudaId, monto, moneda, vencimiento, periodo, pagado = false }) {
        this.deudaId = deudaId;
        this.monto = monto;
        this.moneda = moneda;
        this.vencimiento = vencimiento;
        this.periodo = periodo || vencimiento?.slice(0, 7) || '';
        this.pagado = pagado;
    }
}
