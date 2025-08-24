// src/components/MontoForm.js
import { el, getFormValuesAndValidate } from '../utils/dom.js';

export class MontoForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    connectedCallback() {
        this.form = this.shadowRoot.querySelector('form');
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.shadowRoot.getElementById('cancelMonto').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('monto:cancel', { bubbles: true, composed: true }));
        });
    }

    set monto(data) {
        this._monto = data;
        this.render();
    }

    get monto() {
        return this._monto;
    }

    render() {
        this.shadowRoot.innerHTML = '';
        const form = el('form', {
            attrs: { style: 'display:flex;flex-direction:column;gap:10px;min-width:220px;' },
            children: [
                el('app-input', {
                    attrs: {
                        type: 'number',
                        name: 'monto',
                        label: 'Monto:',
                        required: '',
                        value: this._monto?.monto ?? ''
                    }
                }),
                el('app-input', {
                    attrs: {
                        type: 'select',
                        name: 'moneda',
                        label: 'Moneda:'
                    },
                    children: [
                        el('option', {
                            attrs: {
                                value: 'ARS',
                                selected: this._monto?.moneda === 'ARS' ? '' : undefined
                            },
                            text: 'ARS'
                        }),
                        el('option', {
                            attrs: {
                                value: 'USD',
                                selected: this._monto?.moneda === 'USD' ? '' : undefined
                            },
                            text: 'USD'
                        })
                    ]
                }),
                el('app-input', {
                    attrs: {
                        type: 'date',
                        name: 'vencimiento',
                        label: 'Vencimiento:',
                        required: '',
                        value: this._monto?.vencimiento ?? ''
                    }
                }),
                el('div', {
                    attrs: { style: 'display:flex;justify-content:flex-end;gap:8px;' },
                    children: [
                        el('app-button', {
                            attrs: { type: 'button', id: 'cancelMonto' },
                            text: 'Cancelar'
                        }),
                        el('app-button', {
                            attrs: { type: 'submit', variant: 'success' },
                            text: 'Guardar'
                        })
                    ]
                })
            ]
        });
        this.shadowRoot.appendChild(form);
    }

    handleSubmit(e) {
        e.preventDefault();
        const { values, valid, errors } = getFormValuesAndValidate(this.form);
        this.form.querySelectorAll('app-input').forEach(input => input.clearError());
        if (!valid) {
            Object.entries(errors).forEach(([name, msg]) => {
                const input = this.form.querySelector(`app-input[name="${name}"]`);
                if (input) input.showError(msg);
            });
            return;
        }
        this.dispatchEvent(new CustomEvent('monto:save', {
            detail: values,
            bubbles: true,
            composed: true
        }));
    }
}
customElements.define('monto-form', MontoForm);
