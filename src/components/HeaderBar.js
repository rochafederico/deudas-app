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
        this.shadowRoot.getElementById('month-filter').value = this.month;
        this.shadowRoot.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
        this.shadowRoot.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));
        this.shadowRoot.getElementById('month-filter').addEventListener('change', (e) => {
            this.month = e.target.value;
            this.emitMonthChange();
        });
        // Filtro de agrupamiento
        this.shadowRoot.getElementById('group-filter').addEventListener('change', (e) => {
            this.emitGroupChange(e.target.value);
        });
        // Acciones
        this.shadowRoot.getElementById('add-debt').addEventListener('click', (e) => {
            e.preventDefault();
            this.dispatchEvent(new CustomEvent('add-debt', { bubbles: true, composed: true }));
        });
        this.shadowRoot.getElementById('export-data').addEventListener('click', (e) => {
            e.preventDefault();
            this.dispatchEvent(new CustomEvent('export-data', { bubbles: true, composed: true }));
        });
        this.shadowRoot.getElementById('dashboard-btn').addEventListener('click', (e) => {
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
                    justify-content: space-between; 
                    align-items: center; 
                    padding: 10px; 
                    background-color: var(--panel-light); 
                    color: var(--text-light);
                    border-radius: 12px 12px 0 0; 
                }
                .month-nav { display: flex; align-items: center; gap: 8px; }
                .actions { display: flex; gap: 8px; }
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
                    <app-button id="add-debt" type="button" variant="success" title="Agregar deuda" aria-label="Agregar deuda">
                        <img src="./src/components/icons/AddIcon.svg" alt="Agregar" width="15" height="15" style="vertical-align:middle;" />
                    </app-button>
                    <app-button id="export-data" type="button" title="Exportar datos">
                        <img src="./src/components/icons/ExportIcon.svg" alt="Exportar" width="15" height="15" style="vertical-align:middle;" />
                    </app-button>
                </div>
            </div>
        `;
    }
}
customElements.define('header-bar', HeaderBar);
