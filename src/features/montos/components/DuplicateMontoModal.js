// src/components/DuplicateMontoModal.js
import '../../../shared/components/AppForm.js';

export class DuplicateMontoModal extends HTMLElement {
    constructor() {
        super();
        this._monto = null;
    }

    set monto(data) {
        this._monto = data || {};
        this.render();
    }
    get monto() {
        return this._monto;
    }

    connectedCallback() {
        this.classList.add('d-block');
        this.render();
        this.form = this.querySelector('app-form');
        if (this.form) {
            this.form.addEventListener('duplicate:submit', e => {
                this.dispatchEvent(new CustomEvent('duplicate:save', {
                    detail: e.detail,
                    bubbles: true,
                    composed: true
                }));
            });
            this.form.addEventListener('form:cancel', () => {
                this.dispatchEvent(new CustomEvent('duplicate:cancel', { bubbles: true, composed: true }));
            });
        }
    }

    render() {
        this.innerHTML = '';
        const form = document.createElement('app-form');
        form.fields = [
            { name: 'vencimiento', type: 'date', label: 'Nueva fecha de vencimiento', required: true }
        ];
        // Precargar la fecha del monto original si existe
        if (this._monto && this._monto.vencimiento) {
            form.initialValues = { vencimiento: this._monto.vencimiento };
        }
        form.submitText = 'Duplicar';
        form.cancelText = 'Cancelar';
        // Usar evento personalizado para submit
        form.addEventListener('form:submit', e => {
            form.dispatchEvent(new CustomEvent('duplicate:submit', { detail: e.detail, bubbles: true, composed: true }));
        });
        this.appendChild(form);
    }
}
customElements.define('duplicate-monto-modal', DuplicateMontoModal);
