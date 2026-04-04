// src/features/notifications/UpcomingPaymentsPanel.js
// Persistent Bootstrap alert panel for upcoming payment due dates (HU 2.1)

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

        const alert = document.createElement('div');
        alert.className = 'alert alert-light border-start border-warning border-4 alert-dismissible mb-3 py-2 px-3';
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
            <h6 class="alert-heading fw-bold mb-2">⚠️ Vencimientos próximos</h6>
            ${html}
            <button type="button" class="btn-close" aria-label="Cerrar"></button>
        `;

        alert.querySelector('.btn-close').addEventListener('click', () => {
            alert.remove();
        });

        this.appendChild(alert);
    }
}

customElements.define('upcoming-payments-panel', UpcomingPaymentsPanel);
