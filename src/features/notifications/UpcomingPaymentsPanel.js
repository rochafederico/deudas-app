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

        const alertEl = document.createElement('div');
        alertEl.className = 'alert alert-warning alert-dismissible fade show shadow position-fixed top-0 start-50 translate-middle-x mt-3';
        alertEl.setAttribute('role', 'alert');
        alertEl.innerHTML = `
            <h6 class="alert-heading fw-bold mb-2">⚠️ Vencimientos próximos</h6>
            ${html}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        `;

        alertEl.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-deuda-id]');
            if (!btn) return;
            e.preventDefault();
            const deudaId = btn.dataset.deudaId;
            if (!deudaId) return;
            window.dispatchEvent(new CustomEvent('deuda:open', { detail: { deudaId: Number(deudaId) } }));
        });

        this.appendChild(alertEl);

        if (window.bootstrap?.Alert) {
            new window.bootstrap.Alert(alertEl);
        }
    }
}

customElements.define('upcoming-payments-panel', UpcomingPaymentsPanel);
