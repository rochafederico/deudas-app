// src/config/tables/debtTableColumns.js
// Configuración de columnas para la tabla de deudas

import { el } from '../../utils/dom.js';

export const debtTableColumns = [
    { key: 'acreedor', label: 'Acreedor' },
    { key: 'tipoDeuda', label: 'Tipo' },
    { key: 'moneda', label: 'Moneda' },
    { key: 'monto', label: 'Monto', render: row => {
        // El formateo de moneda se debe pasar como función desde el componente
        return row._fmtMoneda ? row._fmtMoneda(row.moneda, row.monto) : row.monto;
    } },
    { key: 'vencimiento', label: 'Vencimiento' },
    {
        key: 'acciones',
        label: 'Acciones',
        render: row => {
            // Botón editar
            const btn = el('app-button', {
                text: '✎',
                attrs: { title: 'Editar deuda' },
                on: {
                    click: () => row._onEdit(row)
                }
            });
            // Ejemplo: podrías agregar más elementos aquí si lo necesitas
            return btn;
        }
    }
];
