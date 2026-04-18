// src/features/deudas/components/DebtEntityShell.js
// Web Component <debt-entity-shell> – listado de entidades de deuda (acreedor/tipo/cuotas/pendiente)
// Ruta: /gastos  |  Vista mensual de montos: /gastos/mensual

import '../../../shared/components/AppButton.js';
import '../../../layout/PageSectionLayout.js';
import './DebtModal.js';
import './DebtDetailModal.js';

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function navigate(path) {
    if (path !== window.location.pathname) {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }
}

export class DebtEntityShell extends HTMLElement {
    constructor() {
        super();
        this.entities = [];
    }

    connectedCallback() {
        this.classList.add('d-block');
        this.render();
        this.loadEntities();
        this._onLoad = () => this.loadEntities();
        this._onEdit = (e) => this.editDebt(e.detail);
        window.addEventListener('deuda:added', this._onLoad);
        window.addEventListener('deuda:updated', this._onLoad);
        window.addEventListener('deuda:deleted', this._onLoad);
        window.addEventListener('data-imported', this._onLoad);
        window.addEventListener('deuda:edit', this._onEdit);
    }

    disconnectedCallback() {
        window.removeEventListener('deuda:added', this._onLoad);
        window.removeEventListener('deuda:updated', this._onLoad);
        window.removeEventListener('deuda:deleted', this._onLoad);
        window.removeEventListener('data-imported', this._onLoad);
        window.removeEventListener('deuda:edit', this._onEdit);
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
            const cuotas = (deuda.montos || []).length;
            const pendienteStr = Object.keys(pendiente).length
                ? Object.entries(pendiente).map(([moneda, total]) => this.fmtMoneda(moneda, total)).join(' | ')
                : '—';
            return `
                <tr>
                    <td>${escapeHtml(deuda.acreedor)}</td>
                    <td>${escapeHtml(deuda.tipoDeuda || '—')}</td>
                    <td class="text-center">${cuotas}</td>
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
            btn.addEventListener('click', (e) => {
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
                if (deuda) this.editDebt(deuda);
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
        modal.attachOpener();
    }

    render() {
        const layout = document.createElement('page-section-layout');

        // Toolbar end: "Ver cuotas del mes" link + "Agregar deuda" button
        const toolbarEnd = document.createElement('div');
        toolbarEnd.className = 'd-flex align-items-center gap-2 flex-wrap';

        const mensualLink = document.createElement('a');
        mensualLink.href = '/gastos/mensual';
        mensualLink.className = 'btn btn-outline-secondary btn-sm';
        mensualLink.setAttribute('data-mensual-link', '');
        mensualLink.innerHTML = '<i class="bi bi-calendar3" aria-hidden="true"></i> Ver cuotas del mes';
        mensualLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigate('/gastos/mensual');
        });
        toolbarEnd.appendChild(mensualLink);

        const addDebtBtn = document.createElement('app-button');
        addDebtBtn.id = 'add-debt';
        addDebtBtn.setAttribute('aria-label', 'Agregar deuda');
        addDebtBtn.textContent = 'Agregar deuda';
        addDebtBtn.addEventListener('click', () => {
            const modal = this.querySelector('#debtModal');
            if (!modal) return;
            modal.openCreate();
            modal.attachOpener(addDebtBtn);
        });
        toolbarEnd.appendChild(addDebtBtn);

        layout.toolbarEnd = toolbarEnd;

        // Content: modals + entity table
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `
            <debt-modal id="debtModal"></debt-modal>
            <debt-detail-modal id="debtDetailModal"></debt-detail-modal>
            <div id="entity-table-container"></div>
        `;
        layout.content = contentDiv;

        this.innerHTML = '';
        this.appendChild(layout);
    }
}

customElements.define('debt-entity-shell', DebtEntityShell);
