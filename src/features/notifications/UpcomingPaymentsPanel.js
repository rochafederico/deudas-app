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
            this.#openDeudaModal(btn.dataset.deudaId);
        });

        this.appendChild(alertEl);

        if (window.bootstrap?.Alert) {
            new window.bootstrap.Alert(alertEl);
        }
    }

    async #openDeudaModal(deudaId) {
        if (!deudaId) return;
        const modal = document.querySelector('app-shell')?.querySelector('#debtModal')
            ?? document.getElementById('debtModal');
        if (!modal) return;
        const { getDeuda } = await import('../deudas/deudaRepository.js');
        const deuda = await getDeuda(Number(deudaId));
        if (!deuda) return;
        modal.openEdit(deuda);
        modal.attachOpener();
    }
}

customElements.define('upcoming-payments-panel', UpcomingPaymentsPanel);
