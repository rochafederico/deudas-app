// src/features/deudas/components/DebtEntityShell.js
// Web Component <debt-entity-shell> – vista unificada de deudas con toggle cuotas ↔ entidades
// Ruta: /gastos

import '../../../shared/components/AppButton.js';
import '../../../layout/PageSectionLayout.js';
import './DebtModal.js';
import './DebtDetailModal.js';
import './DebtList.js';
import { getSelectedMonth } from '../../../shared/MonthFilter.js';

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export class DebtEntityShell extends HTMLElement {
    constructor() {
        super();
        this.entities = [];
        this.currentView = 'cuotas'; // default: cuotas del mes
    }

    connectedCallback() {
        this.classList.add('d-block');
        this.render();
        this._onRefresh = () => this._refreshCurrentView();
        this._onEdit = (e) => this.editDebt(e.detail);
        window.addEventListener('deuda:saved', this._onRefresh);
        window.addEventListener('deuda:updated', this._onRefresh);
        window.addEventListener('deuda:deleted', this._onRefresh);
        window.addEventListener('data-imported', this._onRefresh);
        window.addEventListener('deuda:edit', this._onEdit);
    }

    disconnectedCallback() {
        window.removeEventListener('deuda:saved', this._onRefresh);
        window.removeEventListener('deuda:updated', this._onRefresh);
        window.removeEventListener('deuda:deleted', this._onRefresh);
        window.removeEventListener('data-imported', this._onRefresh);
        window.removeEventListener('deuda:edit', this._onEdit);
    }

    _refreshCurrentView() {
        if (this.currentView === 'deudas') {
            this.loadEntities();
        } else {
            window.dispatchEvent(new CustomEvent('ui:month', { detail: { mes: getSelectedMonth() } }));
        }
    }

    setView(view) {
        if (this.currentView === view) return;
        this.currentView = view;
        this.render();
        if (this.currentView === 'deudas') this.loadEntities();
    }

    toggleView() {
        this.setView(this.currentView === 'cuotas' ? 'deudas' : 'cuotas');
    }

    async loadEntities() {
        const { listDeudas } = await import('../deudaRepository.js');
        this.entities = await listDeudas();
        this.renderTable();
    }

    fmtMoneda(moneda, n) {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(n);
    }

    computePendiente(montos) {
        const totals = {};
        (montos || []).forEach(m => {
            if (!m.pagado) {
                totals[m.moneda] = (totals[m.moneda] || 0) + Number(m.monto);
            }
        });
        return totals;
    }

    renderTable() {
        const container = this.querySelector('#entity-table-container');
        if (!container) return;

        if (this.entities.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-4">No hay deudas registradas. Usá el botón <strong>Agregar deuda</strong> para comenzar.</p>';
            return;
        }

        const rows = this.entities.map(deuda => {
            const pendiente = this.computePendiente(deuda.montos);
            const montos = deuda.montos || [];
            const total = montos.length;
            const pendientesCount = montos.filter(m => !m.pagado).length;
            const cuotasStr = total > 0 ? `${pendientesCount}/${total}` : '0/0';
            const pendienteStr = Object.keys(pendiente).length
                ? Object.entries(pendiente).map(([moneda, tot]) => this.fmtMoneda(moneda, tot)).join(' | ')
                : '—';
            return `
                <tr>
                    <td>${escapeHtml(deuda.acreedor)}</td>
                    <td>${escapeHtml(deuda.tipoDeuda || '—')}</td>
                    <td class="text-center">${cuotasStr}</td>
                    <td>${escapeHtml(pendienteStr)}</td>
                    <td class="text-end text-nowrap">
                        <button type="button" class="btn btn-sm btn-outline-secondary me-1"
                            data-detail-id="${deuda.id}" aria-label="Ver detalle de ${escapeHtml(deuda.acreedor)}">
                            <i class="bi bi-eye" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary me-1"
                            data-edit-id="${deuda.id}" aria-label="Editar ${escapeHtml(deuda.acreedor)}">
                            <i class="bi bi-pencil" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger"
                            data-delete-id="${deuda.id}" data-acreedor="${escapeHtml(deuda.acreedor)}"
                            aria-label="Eliminar ${escapeHtml(deuda.acreedor)}">
                            <i class="bi bi-trash" aria-hidden="true"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Acreedor</th>
                            <th>Tipo</th>
                            <th class="text-center">Cuotas</th>
                            <th>Pendiente total</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;

        container.querySelectorAll('[data-detail-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.dataset.detailId);
                const deuda = this.entities.find(d => d.id === id);
                if (!deuda) return;
                const detailModal = this.querySelector('#debtDetailModal');
                if (!detailModal) return;
                detailModal.openDetail(deuda);
                detailModal.attachOpener(btn);
            });
        });

        container.querySelectorAll('[data-edit-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.dataset.editId);
                const deuda = this.entities.find(d => d.id === id);
                if (!deuda) return;
                const modal = this.querySelector('#debtModal');
                if (modal?.attachOpener) {
                    modal.attachOpener(btn);
                }
                this.editDebt(deuda);
            });
        });

        container.querySelectorAll('[data-delete-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.dataset.deleteId);
                const acreedor = btn.dataset.acreedor;
                if (!confirm(`¿Eliminar la deuda con "${acreedor}" y todos sus montos?`)) return;
                import('../deudaRepository.js').then(({ deleteDeuda }) => {
                    deleteDeuda(id).then(() => {
                        window.dispatchEvent(new CustomEvent('deuda:deleted'));
                    });
                });
            });
        });
    }

    async editDebt(deuda) {
        const modal = this.querySelector('#debtModal');
        if (!modal || !deuda) return;
        modal.openEdit(deuda);
    }

    render() {
        const layout = document.createElement('page-section-layout');

        // Toolbar end: toggle button + CTA button
        const toolbarEnd = document.createElement('div');
        toolbarEnd.className = 'd-flex align-items-center gap-2 flex-wrap';

        // Toggle view button
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'btn btn-outline-secondary btn-sm';
        toggleBtn.setAttribute('data-toggle-view', '');
        if (this.currentView === 'cuotas') {
            toggleBtn.innerHTML = '<i class="bi bi-list-ul" aria-hidden="true"></i> Ver deudas';
            toggleBtn.setAttribute('aria-label', 'Cambiar a vista deudas');
        } else {
            toggleBtn.innerHTML = '<i class="bi bi-calendar-check" aria-hidden="true"></i> Ver cuotas';
            toggleBtn.setAttribute('aria-label', 'Cambiar a vista cuotas');
        }
        toggleBtn.addEventListener('click', () => this.toggleView());
        toolbarEnd.appendChild(toggleBtn);

        // CTA button (dynamic per view)
        const ctaBtn = document.createElement('app-button');
        ctaBtn.id = 'add-debt';
        if (this.currentView === 'cuotas') {
            ctaBtn.setAttribute('aria-label', 'Registrar pago');
            ctaBtn.textContent = 'Registrar pago';
        } else {
            ctaBtn.setAttribute('aria-label', 'Agregar deuda');
            ctaBtn.textContent = 'Agregar deuda';
        }
        ctaBtn.addEventListener('click', () => {
            const modal = this.querySelector('#debtModal');
            if (!modal) return;
            modal.openCreate();
            modal.attachOpener(ctaBtn);
        });
        toolbarEnd.appendChild(ctaBtn);

        layout.toolbarEnd = toolbarEnd;

        // Content: modals + dynamic view content
        const contentDiv = document.createElement('div');
        if (this.currentView === 'cuotas') {
            contentDiv.innerHTML = `
                <debt-modal id="debtModal"></debt-modal>
                <debt-detail-modal id="debtDetailModal"></debt-detail-modal>
                <debt-list></debt-list>
            `;
        } else {
            contentDiv.innerHTML = `
                <debt-modal id="debtModal"></debt-modal>
                <debt-detail-modal id="debtDetailModal"></debt-detail-modal>
                <div id="entity-table-container"></div>
            `;
        }
        layout.content = contentDiv;

        this.innerHTML = '';
        this.appendChild(layout);
    }
}

customElements.define('debt-entity-shell', DebtEntityShell);
