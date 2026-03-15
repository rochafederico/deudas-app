// DeudaEntity.js
export class DeudaEntity {
    /**
     * @param {Object} params
     * @param {number} [params.id] - ID de la deuda (solo para updates)
     * @param {string} params.acreedor
     * @param {string} params.tipoDeuda
     * @param {string} [params.notas]
     */
    constructor({ id, acreedor, tipoDeuda, notas = '' }) {
        if (id !== undefined) {
            this.id = id;
        }
        this.acreedor = acreedor;
        this.tipoDeuda = tipoDeuda;
        this.notas = notas;
    }
}
