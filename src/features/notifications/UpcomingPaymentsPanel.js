// src/features/notifications/UpcomingPaymentsPanel.js
// Persistent Bootstrap alert panel for upcoming payment due dates (HU 2.1)

export class UpcomingPaymentsPanel extends HTMLElement {
    connectedCallback() {
        Object.assign(this.style, {
            position: 'fixed',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(92vw, 480px)',
            zIndex: '1050',
        });

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
        alertEl.className = 'alert alert-warning alert-dismissible fade show shadow';
        alertEl.setAttribute('role', 'alert');
        alertEl.innerHTML = `
            <h6 class="alert-heading fw-bold mb-2">⚠️ Vencimientos próximos</h6>
            ${html}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        `;

        this.appendChild(alertEl);

        if (window.bootstrap?.Alert) {
            new window.bootstrap.Alert(alertEl);
        }
    }
}

customElements.define('upcoming-payments-panel', UpcomingPaymentsPanel);
