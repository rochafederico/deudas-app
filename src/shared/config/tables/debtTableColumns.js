// src/shared/config/tables/debtTableColumns.js
// Configuración de columnas para la tabla de deudas

import { formatMoneda } from '../monedas.js';
import '../../components/AppCheckbox.js';

export const debtTableColumns = [
    {
        key: 'acreedor',
        label: 'Acreedor',
        render: row => {
            const wrapper = document.createElement('div');
            wrapper.className = 'd-flex flex-column align-items-start';

            const acreedorSpan = document.createElement('span');
            acreedorSpan.className = 'fw-semibold';
            acreedorSpan.textContent = row.acreedor ?? '';

            wrapper.appendChild(acreedorSpan);

            const tipoDeuda = String(row.tipoDeuda ?? '').trim();
            if (tipoDeuda !== '') {
                const badge = document.createElement('span');
                badge.className = 'badge rounded-pill text-bg-light d-md-none mt-1';
                badge.textContent = tipoDeuda;
                wrapper.appendChild(badge);
            }

            return wrapper;
        }
    },
    { key: 'tipoDeuda', label: 'Tipo' , opts: { classCss: 'd-none d-md-table-cell' } },
    { key: 'vencimiento', label: 'Vencimiento' , opts: { classCss: 'd-none d-md-table-cell' } },
    {
        key: 'monedaymonto',
        label: 'Monto',
        render: row => {
            const wrapper = document.createElement('div');
            wrapper.className = 'd-flex flex-column align-items-start';

            const montoSpan = document.createElement('span');
            montoSpan.textContent = formatMoneda(row.monto, row.moneda);
            wrapper.appendChild(montoSpan);

            const vencimiento = String(row.vencimiento ?? '').trim();
            if (vencimiento !== '') {
                const badge = document.createElement('span');
                badge.className = 'text-muted d-md-none mt-1';
                badge.textContent = vencimiento;
                wrapper.appendChild(badge);
            }

            return wrapper;
        }
    },
    {
        key: 'acciones',
        label: 'Pagado',
        render: row => {
            // Checkbox pagado
            const id = `app-checkbox-${row.id != null ? row.id : 'row'}`;
            const appCheckbox = document.createElement('app-checkbox');
            appCheckbox.inputId = id;
            appCheckbox.checked = !!row.pagado;
            appCheckbox.title = 'Marcar como pagado';
            appCheckbox.addEventListener('checkbox-change', async (e) => {
                const { setPagado } = await import('../../../features/montos/montoRepository.js');
                await setPagado(row.id, e.detail.checked);
                if (typeof row._reload === 'function') row._reload();
            });

            // Contenedor — stopPropagation para no activar el click de fila
            const container = document.createElement('div');
            container.className = 'd-flex align-items-center justify-content-end';
            container.addEventListener('click', e => e.stopPropagation());
            container.appendChild(appCheckbox);
            return container;
        }
    }
];

export const ingresosColumns = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'monto', label: 'Monto', align: 'right', render: (row) => {
        return formatMoneda(row.monto, row.moneda);
    } },
];
