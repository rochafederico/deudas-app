// src/models/DeudaModel.js
import { MontoModel } from './MontoModel.js';

export class DeudaModel {
    /**
     * @param {Object} params
     * @param {number} [params.id]
     * @param {string} params.acreedor
     * @param {string} params.tipoDeuda
     * @param {string} [params.notas]
     * @param {Array<Object>|MontoModel[]} [params.montos]
     */
    constructor({ id, acreedor, tipoDeuda, notas = '', montos = [] }) {
        this.id = id;
        this.acreedor = acreedor;
        this.tipoDeuda = tipoDeuda;
        this.notas = notas;
        // Asegura que todos los montos sean instancias de MontoModel
        this.montos = montos.map(m => m instanceof MontoModel ? m : new MontoModel(m));
    }
}
