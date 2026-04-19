// src/features/deudas/components/DebtEntityShell.js
// Web Component <debt-entity-shell> – vista de deudas con tabs Bootstrap
// Rutas: /gastos (Deudas) y /gastos/mensual (Cuotas del mes)

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
        this.currentView = this._getViewFromPath();
    }

    _getViewFromPath() {
        return window.location.pathname === '/gastos/mensual' ? 'cuotas' : 'deudas';
    }

    connectedCallback() {
        this.currentView = this._getViewFromPath();
        this.classList.add('d-block');
        this.render();
        if (this.currentView === 'deudas') this.loadEntities();
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

        // Toolbar start: Bootstrap nav tabs (real links)
        layout.toolbarStart = this._renderTabs();

        // Toolbar end: CTA fixed to "Agregar deuda"
        const ctaBtn = document.createElement('app-button');
        ctaBtn.id = 'add-debt';
        ctaBtn.setAttribute('aria-label', 'Agregar deuda');
        ctaBtn.textContent = 'Agregar deuda';
        ctaBtn.addEventListener('click', () => {
            const modal = this.querySelector('#debtModal');
            if (!modal) return;
            modal.openCreate();
            modal.attachOpener(ctaBtn);
        });
        layout.toolbarEnd = ctaBtn;

        // Content: modals + view-specific content
        const contentDiv = document.createElement('div');

        const debtModal = document.createElement('debt-modal');
        debtModal.id = 'debtModal';
        contentDiv.appendChild(debtModal);

        const detailModal = document.createElement('debt-detail-modal');
        detailModal.id = 'debtDetailModal';
        contentDiv.appendChild(detailModal);

        if (this.currentView === 'cuotas') {
            const debtList = document.createElement('debt-list');
            debtList.setAttribute('exclude-columns', 'tipoDeuda');
            contentDiv.appendChild(debtList);
        } else {
            const entityContainer = document.createElement('div');
            entityContainer.id = 'entity-table-container';
            contentDiv.appendChild(entityContainer);
        }

        layout.content = contentDiv;

        this.innerHTML = '';
        this.appendChild(layout);
    }

    _renderTabs() {
        const nav = document.createElement('ul');
        nav.className = 'nav nav-tabs border-0';
        nav.setAttribute('role', 'tablist');
        nav.appendChild(this._createTabItem('Deudas', '/gastos', this.currentView === 'deudas'));
        nav.appendChild(this._createTabItem('Cuotas del mes', '/gastos/mensual', this.currentView === 'cuotas'));
        return nav;
    }

    _createTabItem(label, path, isActive) {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.setAttribute('role', 'presentation');

        const a = document.createElement('a');
        a.className = `nav-link${isActive ? ' active' : ''}`;
        a.href = path;
        if (isActive) a.setAttribute('aria-current', 'page');
        a.textContent = label;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(path);
        });

        li.appendChild(a);
        return li;
    }
}

customElements.define('debt-entity-shell', DebtEntityShell);
