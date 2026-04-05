// src/config/tables/debtTableColumns.js
// Configuración de columnas para la tabla de deudas

import { formatMoneda } from '../monedas.js';

export const debtTableColumns = [
    {
        key: 'acreedor',
        label: 'Acreedor',
        render: row => {
            const wrapper = document.createElement('div');
            wrapper.className = 'd-flex flex-column';

            const acreedorSpan = document.createElement('span');
            acreedorSpan.className = 'fw-semibold';
            acreedorSpan.textContent = row.acreedor ?? '';

            const badge = document.createElement('span');
            badge.className = 'badge rounded-pill text-bg-light d-md-none mt-1';
            badge.textContent = row.tipoDeuda ?? '';

            wrapper.appendChild(acreedorSpan);
            wrapper.appendChild(badge);
            return wrapper;
        }
    },
    { key: 'tipoDeuda', label: 'Tipo' , opts: { classCss: 'd-none d-md-table-cell' } },
    { key: 'vencimiento', label: 'Vencimiento' , opts: { classCss: 'd-none d-md-table-cell' } },
    { key: 'monedaymonto', label: 'Moneda/Monto', render: row => formatMoneda(row.monto, row.moneda) },
    {
        key: 'acciones',
        label: 'Acciones',
        render: row => {
            // Contenedor dropdown
            const wrapper = document.createElement('div');
            wrapper.className = 'dropdown d-flex justify-content-end';

            // Botón trigger ⋮
            const toggle = document.createElement('button');
            toggle.className = 'btn btn-light btn-sm';
            toggle.type = 'button';
            toggle.setAttribute('data-bs-toggle', 'dropdown');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Acciones');
            toggle.textContent = '⋮';

            // Menú desplegable
            const menu = document.createElement('ul');
            menu.className = 'dropdown-menu dropdown-menu-end';

            // Ver detalle
            const liDetalle = document.createElement('li');
            const aDetalle = document.createElement('a');
            aDetalle.className = 'dropdown-item';
            aDetalle.href = '#';
            aDetalle.textContent = 'Ver detalle';
            aDetalle.addEventListener('click', (e) => {
                e.preventDefault();
                row._onDetail(row, toggle);
            });
            liDetalle.appendChild(aDetalle);

            // Editar
            const liEditar = document.createElement('li');
            const aEditar = document.createElement('a');
            aEditar.className = 'dropdown-item';
            aEditar.href = '#';
            aEditar.textContent = 'Editar';
            aEditar.addEventListener('click', (e) => {
                e.preventDefault();
                row._onEdit(row);
            });
            liEditar.appendChild(aEditar);

            // Marcar pagado
            const liPagado = document.createElement('li');
            const aPagado = document.createElement('a');
            aPagado.className = 'dropdown-item';
            aPagado.href = '#';
            aPagado.textContent = 'Marcar pagado';
            aPagado.addEventListener('click', async (e) => {
                e.preventDefault();
                const { setPagado } = await import('../../../features/montos/montoRepository.js');
                await setPagado(row.id, !row.pagado);
                if (typeof row._reload === 'function') row._reload();
            });
            liPagado.appendChild(aPagado);

            menu.appendChild(liDetalle);
            menu.appendChild(liEditar);
            menu.appendChild(liPagado);

            wrapper.appendChild(toggle);
            wrapper.appendChild(menu);
            return wrapper;
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
