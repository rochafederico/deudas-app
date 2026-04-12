// src/components/AppForm.js
// Formulario reutilizable que usa Bootstrap directamente (sin Shadow DOM)
import { getFormValuesAndValidate } from '../utils/dom.js';

export class AppForm extends HTMLElement {
    constructor() {
        super();
        this._fields = [];
        this._initialValues = {};
        this._submitText = 'Guardar';
        this._cancelText = 'Cancelar';
        this._hideButtons = false;
        this._boundHandleSubmit = this.handleSubmit.bind(this);
        this._boundCancelClick = () => {
            this.dispatchEvent(new CustomEvent('form:cancel', { bubbles: true, composed: true }));
        };
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
    set hideButtons(val) {
        this._hideButtons = !!val;
        this.render();
    }
    get hideButtons() {
        return this._hideButtons;
    }

    connectedCallback() {
        if (!this._rendered) this.render();
        this._setupListeners();
    }

    _setupListeners() {
        this.form = this.querySelector('form');
        if (this.form) {
            this.form.removeEventListener('submit', this._boundHandleSubmit);
            this.form.addEventListener('submit', this._boundHandleSubmit);
        }
        const cancelBtn = this.querySelector('#cancelBtn');
        if (cancelBtn) {
            cancelBtn.removeEventListener('click', this._boundCancelClick);
            cancelBtn.addEventListener('click', this._boundCancelClick);
        }
    }

    render() {
        this._rendered = true;
        this.innerHTML = '';
        const inputs = this._fields.map(field => {
            const wrapper = document.createElement('div');
            wrapper.className = 'mb-2';
            const name = field.name;
            const label = field.label || '';
            const required = field.required;
            let value = field.value !== undefined ? field.value : '';
            if (this._initialValues[name] !== undefined) value = this._initialValues[name];

            if (label) {
                const lbl = document.createElement('label');
                lbl.setAttribute('for', name);
                lbl.className = 'form-label';
                lbl.textContent = label;
                wrapper.appendChild(lbl);
            }

            let input;
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.className = 'form-control';
                input.id = name;
                input.name = name;
                if (required) input.required = true;
                input.textContent = value;
            } else if (field.type === 'select') {
                input = document.createElement('select');
                input.className = 'form-select';
                input.id = name;
                input.name = name;
                if (required) input.required = true;
                if (field.options) {
                    field.options.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt;
                        option.textContent = opt;
                        if (value === opt) option.selected = true;
                        input.appendChild(option);
                    });
                }
            } else {
                input = document.createElement('input');
                input.type = field.type || 'text';
                input.className = 'form-control';
                input.id = name;
                input.name = name;
                if (required) input.required = true;
                if (value !== '' && value != null) input.value = value;
                if (field.type === 'number') input.step = '0.01';
            }

            wrapper.appendChild(input);

            // Error container
            const errDiv = document.createElement('div');
            errDiv.className = 'invalid-feedback';
            errDiv.dataset.errorFor = name;
            wrapper.appendChild(errDiv);

            return wrapper;
        });

        const form = document.createElement('form');
        form.className = 'd-flex flex-column gap-2';
        form.noValidate = true;
        inputs.forEach(input => form.appendChild(input));

        if (!this._hideButtons) {
            // Buttons
            const btnRow = document.createElement('div');
            btnRow.className = 'd-flex justify-content-end gap-2 mt-2';

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.id = 'cancelBtn';
            cancelBtn.className = 'btn btn-primary btn-sm';
            cancelBtn.setAttribute('aria-label', 'Cancelar formulario');
            cancelBtn.textContent = this._cancelText;

            const submitBtn = document.createElement('button');
            submitBtn.type = 'submit';
            submitBtn.className = 'btn btn-success btn-sm';
            submitBtn.setAttribute('aria-label', 'Guardar formulario');
            submitBtn.textContent = this._submitText;

            btnRow.appendChild(cancelBtn);
            btnRow.appendChild(submitBtn);
            form.appendChild(btnRow);
        }

        this.appendChild(form);
        this._setupListeners();
    }

    triggerSubmit() {
        if (this.form) {
            this.handleSubmit({ preventDefault: () => {} });
        }
    }

    triggerCancel() {
        this.dispatchEvent(new CustomEvent('form:cancel', { bubbles: true, composed: true }));
    }

    handleSubmit(e) {
        e.preventDefault();
        const { values, valid, errors } = getFormValuesAndValidate(this.form);
        // Clear previous errors
        this.form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        this.form.querySelectorAll('.invalid-feedback').forEach(el => { el.textContent = ''; });
        if (!valid) {
            this.dispatchEvent(new CustomEvent('form:validation-error', {
                detail: { values, errors },
                bubbles: true,
                composed: true
            }));
            Object.entries(errors).forEach(([name, msg]) => {
                const input = this.form.querySelector(`[name="${name}"]`);
                if (input) {
                    input.classList.add('is-invalid');
                    const errDiv = this.form.querySelector(`[data-error-for="${name}"]`);
                    if (errDiv) {
                        errDiv.textContent = msg;
                        errDiv.classList.add('d-block');
                    }
                }
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
