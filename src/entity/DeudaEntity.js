// DeudaEntity.js
export class DeudaEntity {
    /**
     * @param {Object} params
     * @param {string} params.acreedor
     * @param {string} params.tipoDeuda
     * @param {string} [params.notas]
     */
    constructor({ acreedor, tipoDeuda, notas = '' }) {
        this.acreedor = acreedor;
        this.tipoDeuda = tipoDeuda;
        this.notas = notas;
    }
}
