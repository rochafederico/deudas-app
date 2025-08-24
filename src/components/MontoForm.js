// src/components/MontoForm.js
import { el } from '../utils/dom.js';
import './AppForm.js';

export class MontoForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._monto = {};
        this.render();
    }

    set monto(data) {
        this._monto = data || {};
        this.render();
    }
    get monto() {
        return this._monto;
    }

    connectedCallback() {
        this.form = this.shadowRoot.querySelector('app-form');
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
        this.shadowRoot.innerHTML = '';
        const form = document.createElement('app-form');
        form.fields = [
            { name: 'monto', type: 'number', label: 'Monto', required: true },
            { name: 'moneda', type: 'select', label: 'Moneda', options: ['ARS', 'USD'], required: true },
            { name: 'vencimiento', type: 'date', label: 'Vencimiento', required: true }
        ];
        form.initialValues = this._monto || {};
        form.submitText = 'Guardar';
        form.cancelText = 'Cancelar';
        // Usar evento personalizado para submit
        form.addEventListener('form:submit', e => {
            form.dispatchEvent(new CustomEvent('monto:submit', { detail: e.detail, bubbles: true, composed: true }));
        });
        this.shadowRoot.appendChild(form);
    }
}
customElements.define('monto-form', MontoForm);
