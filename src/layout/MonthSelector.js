// src/layout/MonthSelector.js
// Compact global month selector web component — < abril 2026 >
import {
    getSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    formatMonthLabel,
} from '../shared/MonthFilter.js';

export class MonthSelector extends HTMLElement {
    connectedCallback() {
        this.classList.add('d-inline-flex', 'align-items-center');
        this._render();
        this._onUiMonth = () => this._updateLabel();
        window.addEventListener('ui:month', this._onUiMonth);
    }

    disconnectedCallback() {
        window.removeEventListener('ui:month', this._onUiMonth);
    }

    _render() {
        this.innerHTML = `
            <div class="d-flex align-items-center gap-1" data-tour-step="navegacion-mes">
                <button id="ms-prev" class="btn btn-outline-secondary btn-sm px-2 py-1 lh-1" type="button" title="Mes anterior" aria-label="Mes anterior">&#8249;</button>
                <span id="ms-label" class="fw-semibold small px-1 text-nowrap">${formatMonthLabel(getSelectedMonth())}</span>
                <button id="ms-next" class="btn btn-outline-secondary btn-sm px-2 py-1 lh-1" type="button" title="Mes siguiente" aria-label="Mes siguiente">&#8250;</button>
            </div>
        `;
        this.querySelector('#ms-prev').addEventListener('click', () => goToPreviousMonth());
        this.querySelector('#ms-next').addEventListener('click', () => goToNextMonth());
    }

    _updateLabel() {
        const label = this.querySelector('#ms-label');
        if (label) label.textContent = formatMonthLabel(getSelectedMonth());
    }
}

customElements.define('month-selector', MonthSelector);
