// src/features/deudas/components/DebtDetailModal.js
// Web Component <debt-detail-modal> - Modal para ver el detalle de una deuda

import '../../../shared/components/UiModal.js';
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

        const closeButton = el('button', {
            className: 'btn btn-secondary',
            text: 'Cerrar',
            attrs: { type: 'button' }
        });
        closeButton.addEventListener('click', () => this.close());

        const actions = [closeButton];
        const editButton = el('button', {
            className: 'btn btn-primary',
            text: 'Editar',
            attrs: { type: 'button' }
        });
        editButton.addEventListener('click', () => {
            this.close();
            window.dispatchEvent(new CustomEvent('deuda:edit', { detail: this.deuda }));
        });
        actions.unshift(editButton);

        const content = el('div', {
            children: [
                headerSection,
                infoSection,
                montosSection,
                el('div', {
                    className: 'd-flex justify-content-end gap-2 mt-3',
                    children: actions
                })
            ]
        });
        this.ui.appendChild(content);
    }

    _renderMontosSection(montos) {
        const thead = el('thead', {
            children: [el('tr', {
                children: [
                    el('th', { text: 'Monto' }),
                    el('th', { text: 'Moneda' }),
                    el('th', { text: 'Vencimiento' })
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
        return el('tr', {
            children: [
                el('td', { text: formatMoneda(monto.monto, monto.moneda) }),
                el('td', { text: monto.moneda }),
                el('td', { text: monto.vencimiento || '—' })
            ]
        });
    }

    render() {
        this.innerHTML = `<ui-modal></ui-modal>`;
    }
}

customElements.define('debt-detail-modal', DebtDetailModal);

