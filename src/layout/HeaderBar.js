// src/layout/HeaderBar.js
import '../shared/components/AppInput.js';
import { groupOptions } from '../shared/config/tables/groupOptions.js';
import '../shared/components/AppButton.js';

export class HeaderBar extends HTMLElement {
    set mode(val) {
        this._mode = val;
        if (this.isConnected) this._updateButtonVisibility();
    }

    get mode() {
        return this._mode || this.getAttribute('mode');
    }

    connectedCallback() {
        this.classList.add('d-block');
        this.render();
        const groupFilter = this.querySelector('#group-filter');
        const addDebtBtn = this.querySelector('#add-debt');
        const addIncomeBtn = this.querySelector('#add-income');
        const dashboardBtn = this.querySelector('#dashboard-btn');

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
        if (dashboardBtn) dashboardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });
        this._updateButtonVisibility();
    }

    _updateButtonVisibility() {
        const addDebtBtn = this.querySelector('#add-debt');
        const addIncomeBtn = this.querySelector('#add-income');
        const mode = this.mode;
        if (addDebtBtn) addDebtBtn.classList.toggle('d-none', mode === 'ingresos');
        if (addIncomeBtn) addIncomeBtn.classList.toggle('d-none', mode === 'deudas');
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
            <div class="card-header d-flex flex-wrap justify-content-between align-items-center p-2 gap-2">
            <div class="d-flex flex-wrap align-items-center gap-2">
                <app-input type="select" id="group-filter" name="group-filter" title="Agrupar montos">
                ${optionsHtml}
                </app-input>
            </div>
            <div class="d-flex gap-2 flex-wrap">
                <app-button id="add-income" type="button" variant="success" title="Agregar ingreso" aria-label="Agregar ingreso">
                Nuevo ingreso
                </app-button>
                <app-button id="add-debt" type="button" title="Agregar deuda" aria-label="Agregar deuda" data-tour-step="nueva-deuda">
                Nueva deuda
                </app-button>
            </div>
            </div>
        `;
    }
}
customElements.define('header-bar', HeaderBar);
