// src/components/HeaderBar.js
import '../shared/components/AppInput.js';
import { groupOptions } from '../shared/config/tables/groupOptions.js';
import '../shared/components/AppButton.js';

export class HeaderBar extends HTMLElement {
    constructor() {
        super();
        this.month = new Date().toISOString().slice(0, 7);
    }

    connectedCallback() {
        this.style.display = 'block';
        this.render();
        const monthFilter = this.querySelector('#month-filter');
        const prevBtn = this.querySelector('#prev-month');
        const nextBtn = this.querySelector('#next-month');
        const groupFilter = this.querySelector('#group-filter');
        const addDebtBtn = this.querySelector('#add-debt');
        const addIncomeBtn = this.querySelector('#add-income');
        const exportBtn = this.querySelector('#export-data');
        const importBtn = this.querySelector('#import-data');
        const deleteBtn = this.querySelector('#delete-data');
        const dashboardBtn = this.querySelector('#dashboard-btn');

        if (monthFilter) monthFilter.value = this.month;
        if (prevBtn) prevBtn.addEventListener('click', () => this.changeMonth(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.changeMonth(1));
        if (monthFilter) monthFilter.addEventListener('change', (e) => {
            this.month = e.target.value;
            this.emitMonthChange();
        });
        // Filtro de agrupamiento
        if (groupFilter) groupFilter.addEventListener('change', (e) => {
            this.emitGroupChange(e.target.value);
        });
        // Acciones
        if (addDebtBtn) addDebtBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.dispatchEvent(new CustomEvent('add-debt', { bubbles: true, composed: true }));
        });
        // Botón agregar ingreso
        if (addIncomeBtn) {
            addIncomeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.dispatchEvent(new CustomEvent('add-income', { bubbles: true, composed: true }));
            });
        }
        if (exportBtn) exportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.dispatchEvent(new CustomEvent('export-data', { bubbles: true, composed: true }));
        });
        if (importBtn) importBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.dispatchEvent(new CustomEvent('import-data', { bubbles: true, composed: true }));
        });
        if (deleteBtn) deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.dispatchEvent(new CustomEvent('delete-data', { bubbles: true, composed: true }));
        });
        if (dashboardBtn) dashboardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });
    }

    changeMonth(delta) {
        const d = new Date(this.month + '-01T12:00:00');
        d.setMonth(d.getMonth() + delta);
        this.month = d.toISOString().slice(0, 7);
        this.querySelector('#month-filter').value = this.month;
        this.emitMonthChange();
    }

    emitMonthChange() {
        this.dispatchEvent(new CustomEvent('month-change', {
            detail: { mes: this.month },
            bubbles: true,
            composed: true
        }));
    }

    emitGroupChange(groupBy) {
        this.dispatchEvent(new CustomEvent('group-change', {
            detail: { groupBy },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        const optionsHtml = groupOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
        this.innerHTML = `
            <div class="header-bar d-flex flex-wrap justify-content-between align-items-center p-2 gap-2" style="background-color:var(--panel-light);color:var(--text-light);border-radius:0.75rem 0.75rem 0 0;">
            <div class="d-flex flex-wrap align-items-center gap-2" data-tour-step="navegacion-mes">
                <app-button id="prev-month" type="button" title="Mes anterior">&#8249;</app-button>
                <app-input type="month" name="month-filter" id="month-filter" value="${this.month}"></app-input>
                <app-button id="next-month" type="button" title="Mes siguiente">&#8250;</app-button>
                <app-input type="select" id="group-filter" name="group-filter" title="Agrupar montos">
                ${optionsHtml}
                </app-input>
            </div>
            <div class="d-flex gap-2 flex-wrap">
                <app-button id="add-income" type="button" variant="success" title="Agregar ingreso" aria-label="Agregar ingreso" data-tour-step="nuevo-ingreso">
                Nuevo ingreso
                </app-button>
                <app-button id="add-debt" type="button" title="Agregar deuda" aria-label="Agregar deuda" data-tour-step="nueva-deuda">
                Nueva deuda
                </app-button>
                <app-button id="export-data" type="button" title="Exportar datos" data-tour-step="exportar">
                Exportar
                </app-button>
                <app-button id="import-data" type="button" title="Importar datos" data-tour-step="importar">
                Importar
                </app-button>
                <app-button id="delete-data" type="button" variant="delete" title="Eliminar datos">
                Eliminar todo
                </app-button>
            </div>
            </div>
        `;
    }
}
customElements.define('header-bar', HeaderBar);
