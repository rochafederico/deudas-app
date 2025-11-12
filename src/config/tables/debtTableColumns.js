// src/config/tables/debtTableColumns.js
// Configuración de columnas para la tabla de deudas

import { el } from '../../utils/dom.js';

export const debtTableColumns = [
    { key: 'acreedor', label: 'Acreedor' },
    { key: 'tipoDeuda', label: 'Tipo' },
    { key: 'vencimiento', label: 'Vencimiento' },
    { key: 'monedaymonto', label: 'Moneda/Monto', render: row => {
        const monedaLabel = row.moneda || '';
        const monto = row._fmtMoneda ? row._fmtMoneda(row.moneda, row.monto) : row.monto;
        return `${monedaLabel} ${monto}`;
    } },
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
            // Checkbox pagado
            const id = `app-checkbox-${row.id}`;
            const appCheckbox = document.createElement('app-checkbox');
            appCheckbox.inputId = id;
            appCheckbox.checked = !!row.pagado;
            appCheckbox.title = 'Marcar como pagado';
            appCheckbox.addEventListener('checkbox-change', async (e) => {
                const { setPagado } = await import('../../repository/montoRepository.js');
                await setPagado(row.id, e.detail.checked);
                if (typeof row._reload === 'function') row._reload();
            });
            // Contenedor flex
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'flex-end';
            container.style.gap = '12px';
            container.appendChild(btn);
            container.appendChild(appCheckbox);
            return container;
        }
    }
];

export const ingresosColumns = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'monto', label: 'Monto' },
];