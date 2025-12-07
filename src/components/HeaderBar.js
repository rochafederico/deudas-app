// src/components/HeaderBar.js
import './AppInput.js';
import { groupOptions } from '../config/tables/groupOptions.js';
import './AppButton.js';

export class HeaderBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.month = new Date().toISOString().slice(0, 7);
        this.render();
    }

    connectedCallback() {
        // Mes actual
        const monthFilter = this.shadowRoot.querySelector('#month-filter');
        const prevBtn = this.shadowRoot.querySelector('#prev-month');
        const nextBtn = this.shadowRoot.querySelector('#next-month');
        const groupFilter = this.shadowRoot.querySelector('#group-filter');
        const addDebtBtn = this.shadowRoot.querySelector('#add-debt');
        const addIncomeBtn = this.shadowRoot.querySelector('#add-income');
        const exportBtn = this.shadowRoot.querySelector('#export-data');
        const importBtn = this.shadowRoot.querySelector('#import-data');
        const deleteBtn = this.shadowRoot.querySelector('#delete-data');
        const dashboardBtn = this.shadowRoot.querySelector('#dashboard-btn');

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
        this.shadowRoot.getElementById('month-filter').value = this.month;
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
        // Generar las opciones para el select
        const optionsHtml = groupOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
        this.shadowRoot.innerHTML = `
            <style>
            .header-bar { 
                display: flex; 
                flex-wrap: wrap;
                justify-content: space-between; 
                align-items: center; 
                padding: 10px; 
                background-color: var(--panel-light); 
                color: var(--text-light);
                border-radius: 12px 12px 0 0; 
                gap: 8px;
            }
            .month-nav { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
            .actions { display: flex; gap: 8px; flex-wrap: wrap; }
            .group-filter { margin-left: 12px; min-width: 140px; }
            /* Modo oscuro */
            :host-context(body.dark-mode) .header-bar {
                background-color: var(--panel-dark);
                color: var(--text-dark);
            }
            </style>
            <div class="header-bar">
            <div class="month-nav">
                <app-button id="prev-month" type="button" title="Mes anterior">‹</app-button>
                <app-input type="month" name="month-filter" id="month-filter" value="${this.month}"></app-input>
                <app-button id="next-month" type="button" title="Mes siguiente">›</app-button>
                <app-input type="select" id="group-filter" name="group-filter" class="group-filter" title="Agrupar montos">
                ${optionsHtml}
                </app-input>
            </div>
            <div class="actions">
                <app-button id="add-income" type="button" variant="success" title="Agregar ingreso" aria-label="Agregar ingreso">
                Nuevo ingreso
                </app-button>
                <app-button id="add-debt" type="button" title="Agregar deuda" aria-label="Agregar deuda">
                Nueva deuda
                </app-button>
                <app-button id="export-data" type="button" title="Exportar datos">
                Exportar
                </app-button>
                <app-button id="import-data" type="button" title="Importar datos">
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
