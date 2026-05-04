// src/shared/config/tables/debtTableColumns.js
// Configuración de columnas para la tabla de deudas

import { formatMoneda } from '../monedas.js';
import '../../components/AppCheckbox.js';

function getTodayYmd() {
    return new Date().toISOString().slice(0, 10);
}

function getMontoEstado(row) {
    if (row?.pagado) {
        return { label: 'Pagado', className: 'text-bg-success' };
    }

    const vencimiento = String(row?.vencimiento ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vencimiento)) {
        return null;
    }

    const today = getTodayYmd();
    if (vencimiento < today) {
        return { label: 'Vencido', className: 'text-bg-danger' };
    }
    if (vencimiento === today) {
        return { label: 'Vence hoy', className: 'text-bg-warning' };
    }
    return null;
}

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

            // Mobile-only: monto, vencimiento y estado de pago
            if (row.monto != null) {
                const montoMobileSpan = document.createElement('span');
                montoMobileSpan.className = 'd-md-none text-nowrap mt-1';
                montoMobileSpan.textContent = formatMoneda(row.monto, row.moneda);
                wrapper.appendChild(montoMobileSpan);
            }

            const venc = String(row.vencimiento ?? '').trim();
            if (venc !== '') {
                const vencSpan = document.createElement('span');
                vencSpan.className = 'text-muted fw-lighter d-md-none text-nowrap';
                vencSpan.textContent = venc;
                wrapper.appendChild(vencSpan);
            }

            const estadoMobileDiv = document.createElement('div');
            estadoMobileDiv.className = 'd-md-none mt-1';
            const renderEstadoPagoMobile = () => {
                estadoMobileDiv.replaceChildren();
                const estado = getMontoEstado(row);
                if (!estado) {
                    estadoMobileDiv.classList.add('d-none');
                    return;
                }
                estadoMobileDiv.classList.remove('d-none');
                const badge = document.createElement('span');
                badge.className = `badge ${estado.className} text-nowrap`;
                badge.textContent = estado.label;
                estadoMobileDiv.appendChild(badge);
            };
            row._renderEstadoPagoMobile = renderEstadoPagoMobile;
            renderEstadoPagoMobile();
            wrapper.appendChild(estadoMobileDiv);

            return wrapper;
        }
    },
    { key: 'tipoDeuda', label: 'Tipo' , opts: { classCss: 'd-none d-md-table-cell' } },
    { key: 'vencimiento', label: 'Vencimiento' , opts: { classCss: 'd-none d-md-table-cell' } },
    {
        key: 'monedaymonto',
        label: 'Monto',
        opts: { classCss: 'd-none d-md-table-cell' },
        render: row => {
            const wrapper = document.createElement('div');
            wrapper.className = 'd-flex flex-column align-items-start';

            const montoSpan = document.createElement('span');
            montoSpan.className = 'text-nowrap';
            montoSpan.textContent = formatMoneda(row.monto, row.moneda);
            wrapper.appendChild(montoSpan);

            const vencimiento = String(row.vencimiento ?? '').trim();
            if (vencimiento !== '') {
                const badge = document.createElement('span');
                badge.className = 'text-muted fw-lighter d-md-none mt-1 text-nowrap';
                badge.textContent = vencimiento;
                wrapper.appendChild(badge);
            }

            const estadoContainer = document.createElement('div');
            estadoContainer.className = 'mt-1';

            const renderEstado = () => {
                estadoContainer.replaceChildren();
                const estado = getMontoEstado(row);
                if (!estado) {
                    estadoContainer.classList.add('d-none');
                    return;
                }
                estadoContainer.classList.remove('d-none');
                const badge = document.createElement('span');
                badge.className = `badge ${estado.className} text-nowrap`;
                badge.textContent = estado.label;
                estadoContainer.appendChild(badge);
            };

            row._renderEstadoPago = renderEstado;
            renderEstado();
            wrapper.appendChild(estadoContainer);

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
                const nextChecked = !!e.detail.checked;
                const previousChecked = !!row.pagado;
                row.pagado = nextChecked;
                if (typeof row._renderEstadoPago === 'function') row._renderEstadoPago();
                if (typeof row._renderEstadoPagoMobile === 'function') row._renderEstadoPagoMobile();

                try {
                    await setPagado(row.id, nextChecked);
                    window.dispatchEvent(new CustomEvent('app:notify', {
                        detail: {
                            message: nextChecked
                                ? '✅ Cuota marcada como pagada.'
                                : '⚠️ Cuota marcada como pendiente.',
                            type: nextChecked ? 'success' : 'warning'
                        }
                    }));
                    if (typeof row._reload === 'function') row._reload();
                } catch {
                    row.pagado = previousChecked;
                    appCheckbox.checked = previousChecked;
                    if (typeof row._renderEstadoPago === 'function') row._renderEstadoPago();
                    if (typeof row._renderEstadoPagoMobile === 'function') row._renderEstadoPagoMobile();
                    window.dispatchEvent(new CustomEvent('app:notify', {
                        detail: {
                            message: '❌ No pudimos actualizar el estado de pago. Intentá de nuevo.',
                            type: 'danger'
                        }
                    }));
                }
            });

            // Contenedor — stopPropagation para no activar el click de fila
            const container = document.createElement('div');
            container.className = 'd-flex flex-column align-items-end gap-1';
            container.addEventListener('click', e => e.stopPropagation());
            container.appendChild(appCheckbox);

            // Mobile-only: botón de detalle cuando la acción está disponible
            if (typeof row._onDetail === 'function') {
                const eyeBtn = document.createElement('button');
                eyeBtn.type = 'button';
                eyeBtn.className = 'btn btn-sm btn-outline-secondary d-md-none';
                eyeBtn.setAttribute('aria-label', `Ver detalle de ${row.acreedor || ''}`);
                eyeBtn.innerHTML = '<i class="bi bi-eye" aria-hidden="true"></i>';
                eyeBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await row._onDetail(row, eyeBtn);
                });
                container.appendChild(eyeBtn);
            }

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
