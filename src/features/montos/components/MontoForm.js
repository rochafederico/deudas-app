// src/components/MontoForm.js
import monedas from '../../../shared/config/monedas.js';
import '../../../shared/components/AppForm.js';

export class MontoForm extends HTMLElement {
    constructor() {
        super();
        this._monto = {};
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
            this.form.addEventListener('monto:submit', e => {
                this.dispatchEvent(new CustomEvent('monto:save', {
                    detail: e.detail,
                    bubbles: true,
                    composed: true
                }));
            });
            this.form.addEventListener('form:cancel', () => {
                this.dispatchEvent(new CustomEvent('monto:cancel', { bubbles: true, composed: true }));
            });
        }
    }

    render() {
        this.innerHTML = '';
        const form = document.createElement('app-form');
        form.fields = [
            { name: 'monto', type: 'number', label: 'Monto', required: true, min: 0.01 },
            { name: 'moneda', type: 'select', label: 'Moneda', options: monedas, required: true, placeholder: 'Seleccioná una moneda…' },
            { name: 'vencimiento', type: 'date', label: 'Vencimiento', required: true }
        ];
        form.initialValues = this._monto || {};
        form.submitText = 'Guardar';
        form.cancelText = 'Cancelar';
        // Usar evento personalizado para submit
        form.addEventListener('form:submit', e => {
            form.dispatchEvent(new CustomEvent('monto:submit', { detail: e.detail, bubbles: true, composed: true }));
        });
        this.appendChild(form);
    }
}
customElements.define('monto-form', MontoForm);
