// src/components/HeaderBar.js
import './AppInput.js';
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
        // Acciones
        this.shadowRoot.getElementById('add-debt').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('add-debt', { bubbles: true, composed: true }));
        });
        this.shadowRoot.getElementById('export-data').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('export-data', { bubbles: true, composed: true }));
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

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .header-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px; background-color: var(--panel-light); border-radius: 12px 12px 0 0; }
                .month-nav { display: flex; align-items: center; gap: 8px; }
                .actions { display: flex; gap: 8px; }
            </style>
            <div class="header-bar">
                <div class="month-nav">
                    <app-button id="prev-month" type="button" title="Mes anterior">‹</app-button>
                    <app-input type="month" name="month-filter" id="month-filter" value="${this.month}"></app-input>
                    <app-button id="next-month" type="button" title="Mes siguiente">›</app-button>
                </div>
                <div class="actions">
                    <app-button id="add-debt" type="button" variant="success" title="Agregar deuda">+</app-button>
                    <app-button id="export-data" type="button" title="Exportar datos">↓</app-button>
                </div>
            </div>
        `;
    }
}
customElements.define('header-bar', HeaderBar);
