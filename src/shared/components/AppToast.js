export class AppToast extends HTMLElement {
    connectedCallback() {
        this._container = document.createElement('div');
        this._container.className = 'toast-container position-fixed top-0 end-0 p-3';
        this._container.style.zIndex = '11000';
        document.body.appendChild(this._container);

        this._handler = (e) => this.#show(e.detail);
        window.addEventListener('app:notify', this._handler);
    }

    disconnectedCallback() {
        window.removeEventListener('app:notify', this._handler);
        this._container?.remove();
    }

    #show({ message, type = 'success' }) {
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-bg-${type} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        toastEl.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="toast-body flex-grow-1">${message}</div>
                <button type="button" class="btn-close btn-close-white mt-2 me-2 flex-shrink-0" data-bs-dismiss="toast" aria-label="Cerrar"></button>
            </div>
        `;
        this._container.appendChild(toastEl);
        new window.bootstrap.Toast(toastEl, { delay: 5000 }).show();
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    }
}

customElements.define('app-toast', AppToast);
