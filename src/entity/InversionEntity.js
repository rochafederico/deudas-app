// Entidad para una inversión y su historial de valores
export class InversionEntity {
    constructor({ id, nombre, fechaCompra, valorInicial, historialValores = [] }) {
        if (id !== undefined)
            this.id = id;
        this.nombre = nombre;
        this.fechaCompra = fechaCompra;
        this.valorInicial = valorInicial;
        this.historialValores = historialValores; // [{fecha, valor}]
    }
}
