// src/config/tables/inversionTableColumns.js
// Configuración de columnas para la tabla de inversiones

import { formatMoneda } from "../monedas.js";

export const inversionTableColumns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'valorInicial', label: 'Valor inicial', render: row => formatMoneda(row.valorInicial, row.moneda) },
    {
        key: 'variacion', label: 'Variación', render: row => {
            if (row.historialValores.length === 0) return formatMoneda(0, row.moneda);
            const lastValor = row.historialValores[row.historialValores.length - 1].valor;
            return formatMoneda(lastValor - row.valorInicial, row.moneda);
        }
    },
    { key: 'fechaCompra', label: 'Fecha compra' },
    { key: 'acciones', label: '', render: row => row._acciones && row._acciones(row) }
];
