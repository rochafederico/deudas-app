// src/features/deudas/components/DebtDetailModal.js
// Web Component <debt-detail-modal> - Modal para ver el detalle de una deuda

import '../../../shared/components/UiModal.js';
import '../../../shared/components/AppButton.js';
import '../../../shared/components/AppCheckbox.js';
import '../../montos/components/MontoForm.js';
import '../../montos/components/DuplicateMontoModal.js';
import { el } from '../../../shared/utils/dom.js';
import { formatMoneda } from '../../../shared/config/monedas.js';

export class DebtDetailModal extends HTMLElement {
    constructor() {
        super();
        this.deuda = null;
    }

    connectedCallback() {
        this.classList.add('d-block');
        this.render();
        this.ui = this.querySelector('ui-modal');
        this.montoEditModal = this.querySelector('#detailMontoEditModal');
        this.duplicateModal = this.querySelector('#detailDuplicateModal');

        // Use larger dialog for detail view
        const dialog = this.ui && this.ui.querySelector('.modal-dialog');
        if (dialog) {
            dialog.classList.add('modal-lg', 'modal-dialog-scrollable');
        }
    }

    async openDetail(deuda) {
        this.deuda = deuda;
        this.ui.setTitle('Detalle de deuda');
        this._renderContent();
        this.ui.open();
    }

    close() {
        this.ui.close();
    }

    attachOpener(el) {
        this.ui.returnFocusTo(el);
    }

    _calcTotalesPendientes() {
        const totales = {};
        (this.deuda?.montos || []).forEach(m => {
            if (!m.pagado) {
                totales[m.moneda] = (totales[m.moneda] || 0) + (Number(m.monto) || 0);
            }
        });
        return totales;
    }

    _nextVencimiento() {
        const today = new Date().toISOString().slice(0, 10);
        const pendientes = (this.deuda?.montos || [])
            .filter(m => !m.pagado && m.vencimiento >= today)
            .sort((a, b) => a.vencimiento.localeCompare(b.vencimiento));
        return pendientes[0]?.vencimiento || '—';
    }

    _renderContent() {
        this.ui.clearBody();
        if (!this.deuda) return;

        const montos = this.deuda.montos || [];
        const totales = this._calcTotalesPendientes();
        const nextVenc = this._nextVencimiento();

        // Total amount — visually prominent at top
        const totalesStr = Object.entries(totales)
            .map(([moneda, monto]) => formatMoneda(monto, moneda))
            .join(' / ') || '—';

        const headerSection = el('div', {
            className: 'text-center mb-4 p-3 rounded',
            style: 'background: var(--bs-primary-bg-subtle, #e7f0f2);',
            children: [
                el('div', { className: 'text-muted small mb-1', text: 'Total pendiente' }),
                el('div', {
                    className: 'fw-bold fs-2',
                    style: 'color: var(--bs-primary, #3d7982);',
                    text: totalesStr
                })
            ]
        });

        // Debt info rows
        const makeRow = (label, value) => el('div', {
            className: 'd-flex justify-content-between py-1 border-bottom',
            children: [
                el('span', { className: 'text-muted', text: label }),
                el('span', { className: 'fw-semibold text-end', text: value || '—' })
            ]
        });

        const monedas = [...new Set(montos.map(m => m.moneda))].join(', ') || '—';

        const infoSection = el('div', {
            className: 'mb-4',
            children: [
                makeRow('Acreedor', this.deuda.acreedor),
                makeRow('Tipo de deuda', this.deuda.tipoDeuda),
                makeRow('Moneda', monedas),
                makeRow('Próximo vencimiento', nextVenc),
                ...(this.deuda.notas ? [makeRow('Notas', this.deuda.notas)] : [])
            ]
        });

        // Montos section — priority visual section
        const montosSection = this._renderMontosSection(montos);

        const content = el('div', {
            children: [headerSection, infoSection, montosSection]
        });
        this.ui.appendChild(content);
    }

    _renderMontosSection(montos) {
        const thead = el('thead', {
            children: [el('tr', {
                children: [
                    el('th', { text: 'Monto' }),
                    el('th', { text: 'Moneda' }),
                    el('th', { text: 'Vencimiento' }),
                    el('th', { text: 'Acciones' })
                ]
            })]
        });

        const tbody = el('tbody', { attrs: { id: 'detail-montos-tbody' } });
        montos
            .slice()
            .sort((a, b) => (a.vencimiento || '').localeCompare(b.vencimiento || ''))
            .forEach(monto => tbody.appendChild(this._renderMontoRow(monto)));

        const table = el('table', {
            className: 'table table-sm w-100',
            children: [thead, tbody]
        });

        return el('div', {
            children: [
                el('strong', { className: 'mb-2 d-block', text: 'Montos' }),
                el('div', {
                    className: 'overflow-auto',
                    style: 'max-height: 260px;',
                    children: [table]
                })
            ]
        });
    }

    _renderMontoRow(monto) {
        const id = `detail-chk-${monto.id}`;
        const appCheckbox = document.createElement('app-checkbox');
        appCheckbox.inputId = id;
        appCheckbox.checked = !!monto.pagado;
        appCheckbox.title = 'Marcar como pagado';
        appCheckbox.addEventListener('checkbox-change', async (e) => {
            const { setPagado } = await import('../../montos/montoRepository.js');
            await setPagado(monto.id, e.detail.checked);
            await this._refreshDeuda();
            window.dispatchEvent(new CustomEvent('deuda:updated', { detail: this.deuda }));
        });

        const actionsDiv = el('div', {
            className: 'd-flex gap-1 align-items-center',
            children: [
                el('app-button', {
                    text: '✎',
                    attrs: { title: 'Editar monto' },
                    on: { click: () => this._openMontoEdit(monto) }
                }),
                el('app-button', {
                    text: '×',
                    attrs: { variant: 'delete', title: 'Eliminar monto' },
                    on: { click: () => this._deleteMonto(monto) }
                }),
                el('app-button', {
                    text: '⧉',
                    attrs: { variant: 'success', title: 'Duplicar monto' },
                    on: { click: () => this._openMontoDuplicate(monto) }
                }),
                appCheckbox
            ]
        });

        return el('tr', {
            children: [
                el('td', { text: formatMoneda(monto.monto, monto.moneda) }),
                el('td', { text: monto.moneda }),
                el('td', { text: monto.vencimiento || '—' }),
                el('td', { children: [actionsDiv] })
            ]
        });
    }

    async _openMontoEdit(monto) {
        this.montoEditModal.setTitle('Editar monto');
        this.montoEditModal.clearBody();
        const montoForm = document.createElement('monto-form');
        montoForm.monto = monto;
        montoForm.addEventListener('monto:save', async (e) => {
            const { getDeuda, updateDeuda } = await import('../deudaRepository.js');
            const deudaFull = await getDeuda(this.deuda.id);
            const idx = deudaFull.montos.findIndex(m => m.id === monto.id);
            if (idx !== -1) {
                deudaFull.montos[idx] = { ...deudaFull.montos[idx], ...e.detail };
            }
            await updateDeuda(deudaFull);
            this.montoEditModal.close();
            await this._refreshDeuda();
            window.dispatchEvent(new CustomEvent('deuda:updated', { detail: this.deuda }));
        }, { once: true });
        montoForm.addEventListener('monto:cancel', () => this.montoEditModal.close(), { once: true });
        this.montoEditModal.appendChild(montoForm);
        this.montoEditModal.open();
    }

    async _openMontoDuplicate(monto) {
        this.duplicateModal.setTitle('Duplicar monto');
        this.duplicateModal.clearBody();
        const duplicateForm = document.createElement('duplicate-monto-modal');
        duplicateForm.monto = monto;
        duplicateForm.addEventListener('duplicate:save', async (e) => {
            const { addMonto } = await import('../../montos/montoRepository.js');
            const nuevaFecha = e.detail.vencimiento;
            const nuevoPeriodo = nuevaFecha ? nuevaFecha.slice(0, 7) : '';
            await addMonto({
                deudaId: monto.deudaId,
                monto: monto.monto,
                moneda: monto.moneda,
                vencimiento: nuevaFecha,
                periodo: nuevoPeriodo,
                pagado: false
            });
            this.duplicateModal.close();
            await this._refreshDeuda();
            window.dispatchEvent(new CustomEvent('deuda:updated', { detail: this.deuda }));
        }, { once: true });
        duplicateForm.addEventListener('duplicate:cancel', () => this.duplicateModal.close(), { once: true });
        this.duplicateModal.appendChild(duplicateForm);
        this.duplicateModal.open();
    }

    async _deleteMonto(monto) {
        if (!confirm(`¿Eliminar el monto de ${formatMoneda(monto.monto, monto.moneda)} con vencimiento ${monto.vencimiento}?`)) return;
        const { deleteMonto } = await import('../../montos/montoRepository.js');
        await deleteMonto(monto.id);
        await this._refreshDeuda();
        window.dispatchEvent(new CustomEvent('deuda:updated', { detail: this.deuda }));
    }

    async _refreshDeuda() {
        const { getDeuda } = await import('../deudaRepository.js');
        this.deuda = await getDeuda(this.deuda.id);
        this._renderContent();
    }

    render() {
        this.innerHTML = `
        <ui-modal></ui-modal>
        <ui-modal id="detailMontoEditModal"></ui-modal>
        <ui-modal id="detailDuplicateModal"></ui-modal>
        `;
    }
}

customElements.define('debt-detail-modal', DebtDetailModal);
