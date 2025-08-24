// src/components/AppForm.js
import { el, getFormValuesAndValidate } from '../utils/dom.js';

export class AppForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._fields = [];
        this._initialValues = {};
        this._submitText = 'Guardar';
        this._cancelText = 'Cancelar';
        this.render();
    }

    set fields(fields) {
        this._fields = fields;
        this.render();
    }
    get fields() {
        return this._fields;
    }

    set initialValues(values) {
        this._initialValues = values || {};
        this.render();
    }
    get initialValues() {
        return this._initialValues;
    }

    set submitText(text) {
        this._submitText = text;
        this.render();
    }
    set cancelText(text) {
        this._cancelText = text;
        this.render();
    }

    connectedCallback() {
        // Siempre volver a asociar los listeners después de cada render
        this._setupListeners();
    }

    _setupListeners() {
        this.form = this.shadowRoot.querySelector('form');
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
        const cancelBtn = this.shadowRoot.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('form:cancel', { bubbles: true, composed: true }));
            });
        }
    }

    render() {
        this.shadowRoot.innerHTML = '';
        const inputs = this._fields.map(field => {
            let attrs = {
                type: field.type,
                name: field.name,
                label: field.label || '',
            };
            if (field.required) attrs.required = '';
            if (field.value !== undefined) attrs.value = field.value;
            if (this._initialValues[field.name] !== undefined) attrs.value = this._initialValues[field.name];
            let children = [];
            if (field.type === 'select' && field.options) {
                children = field.options.map(opt => el('option', {
                    attrs: {
                        value: opt,
                        selected: attrs.value === opt ? '' : undefined
                    },
                    text: opt
                }));
            }
            return el('app-input', { attrs, children });
        });
        const form = el('form', {
            attrs: { style: 'display:flex;flex-direction:column;gap:10px;' },
            children: [
                ...inputs,
                el('div', {
                    attrs: { style: 'display:flex;justify-content:flex-end;gap:8px;' },
                    children: [
                        el('app-button', {
                            attrs: { type: 'button', id: 'cancelBtn' },
                            text: this._cancelText
                        }),
                        el('app-button', {
                            attrs: { type: 'submit', variant: 'success' },
                            text: this._submitText
                        })
                    ]
                })
            ]
        });
        this.shadowRoot.appendChild(form);
        // Reasociar listeners tras render
        this._setupListeners();
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
        this.dispatchEvent(new CustomEvent('form:submit', {
            detail: values,
            bubbles: true,
            composed: true
        }));
    }
}
customElements.define('app-form', AppForm);