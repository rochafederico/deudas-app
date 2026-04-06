// src/layout/MonthSelector.js
// Compact global month selector web component — Bootstrap Input Group with input[type=month]
import {
    getSelectedMonth,
    setSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
} from '../shared/MonthFilter.js';
import { trackEvent } from '../shared/analytics/analytics.service.js';

export class MonthSelector extends HTMLElement {
    connectedCallback() {
        this.classList.add('d-inline-flex', 'align-items-center');
        this._render();
        this._onUiMonth = (e) => this._syncInput(e.detail.mes);
        window.addEventListener('ui:month', this._onUiMonth);
    }

    disconnectedCallback() {
        window.removeEventListener('ui:month', this._onUiMonth);
    }

    _render() {
        this.innerHTML = `
            <div class="input-group input-group-sm" data-tour-step="navegacion-mes">
                <button id="ms-prev" class="btn btn-outline-secondary" type="button" title="Mes anterior" aria-label="Mes anterior">&#8249;</button>
                <input id="ms-input" type="month" class="form-control text-center" value="${getSelectedMonth()}" aria-label="Seleccionar mes">
                <button id="ms-next" class="btn btn-outline-secondary" type="button" title="Mes siguiente" aria-label="Mes siguiente">&#8250;</button>
            </div>
        `;
        this.querySelector('#ms-prev').addEventListener('click', () => {
            goToPreviousMonth();
            trackEvent('month_navigation_used', {
                flow: 'month_navigation',
                status: 'completed',
                direction: 'previous',
                month: getSelectedMonth()
            });
        });
        this.querySelector('#ms-next').addEventListener('click', () => {
            goToNextMonth();
            trackEvent('month_navigation_used', {
                flow: 'month_navigation',
                status: 'completed',
                direction: 'next',
                month: getSelectedMonth()
            });
        });
        this.querySelector('#ms-input').addEventListener('change', (e) => {
            if (e.target.value) {
                setSelectedMonth(e.target.value);
                trackEvent('month_navigation_used', {
                    flow: 'month_navigation',
                    status: 'completed',
                    direction: 'direct_select',
                    month: e.target.value
                });
            }
        });
    }

    _syncInput(month) {
        const input = this.querySelector('#ms-input');
        if (input && input.value !== month) input.value = month;
    }
}

customElements.define('month-selector', MonthSelector);
