// src/features/notifications/UpcomingPaymentsPanel.js
// Persistent Bootstrap alert panel for upcoming payment due dates (HU 2.1)

import { attachDeudaClickHandler } from './paymentNotificationUI.js';

export class UpcomingPaymentsPanel extends HTMLElement {
    connectedCallback() {
        this._handler = (e) => this.#render(e.detail.html);
        window.addEventListener('app:upcoming-panel', this._handler);
    }

    disconnectedCallback() {
        window.removeEventListener('app:upcoming-panel', this._handler);
        this.innerHTML = '';
    }

    #render(html) {
        this.innerHTML = '';

        const alertEl = document.createElement('div');
        alertEl.className = 'alert alert-warning alert-dismissible fade show shadow position-fixed top-0 start-50 translate-middle-x mt-3';
        alertEl.style.zIndex = '1056';
        alertEl.setAttribute('role', 'alert');
        alertEl.innerHTML = `
            <h6 class="alert-heading fw-bold mb-2">⚠️ Vencimientos próximos</h6>
            ${html}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        `;

        attachDeudaClickHandler(alertEl);

        this.appendChild(alertEl);

        if (window.bootstrap?.Alert) {
            new window.bootstrap.Alert(alertEl);
        }
    }
}

customElements.define('upcoming-payments-panel', UpcomingPaymentsPanel);
