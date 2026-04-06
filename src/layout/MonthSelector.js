// src/layout/MonthSelector.js
// Compact global month selector web component — Bootstrap Input Group with input[type=month]
import {
    getSelectedMonth,
    setSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
} from '../shared/MonthFilter.js';
import { trackEvent } from '../shared/observability/index.js';

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
        const group = document.createElement('div');
        group.className = 'input-group input-group-sm';
        group.dataset.tourStep = 'navegacion-mes';

        const prev = document.createElement('button');
        prev.id = 'ms-prev';
        prev.className = 'btn btn-outline-secondary';
        prev.type = 'button';
        prev.title = 'Mes anterior';
        prev.setAttribute('aria-label', 'Mes anterior');
        prev.textContent = '‹';

        const input = document.createElement('input');
        input.id = 'ms-input';
        input.type = 'month';
        input.className = 'form-control text-center';
        input.value = getSelectedMonth();
        input.setAttribute('aria-label', 'Seleccionar mes');

        const next = document.createElement('button');
        next.id = 'ms-next';
        next.className = 'btn btn-outline-secondary';
        next.type = 'button';
        next.title = 'Mes siguiente';
        next.setAttribute('aria-label', 'Mes siguiente');
        next.textContent = '›';

        group.appendChild(prev);
        group.appendChild(input);
        group.appendChild(next);

        this.innerHTML = '';
        this.appendChild(group);
        this.querySelector('#ms-prev').addEventListener('click', () => {
            goToPreviousMonth();
            trackEvent('monthly_navigation_used', {
                direction: 'previous',
                month: getSelectedMonth()
            });
        });
        this.querySelector('#ms-next').addEventListener('click', () => {
            goToNextMonth();
            trackEvent('monthly_navigation_used', {
                direction: 'next',
                month: getSelectedMonth()
            });
        });
        this.querySelector('#ms-input').addEventListener('change', (e) => {
            if (e.target.value) {
                setSelectedMonth(e.target.value);
                trackEvent('monthly_navigation_used', {
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
