// src/components/AppForm.js
// Formulario reutilizable que usa Bootstrap directamente (sin Shadow DOM)
import { getFormValues } from '../utils/dom.js';

export class AppForm extends HTMLElement {
    static nextFormId = 0;

    constructor() {
        super();
        this._fields = [];
        this._initialValues = {};
        this._submitText = 'Guardar';
        this._cancelText = 'Cancelar';
        this._hideButtons = false;
        AppForm.nextFormId += 1;
        this._formId = `app-form-${AppForm.nextFormId}`;
        this._boundHandleSubmit = this.handleSubmit.bind(this);
        this._boundHandleInvalid = this.handleInvalid.bind(this);
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
            this.form.removeEventListener('invalid', this._boundHandleInvalid, true);
            this.form.addEventListener('invalid', this._boundHandleInvalid, true);
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
            wrapper.dataset.fieldName = field.name;
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
                if (required) {
                    const requiredMark = document.createElement('span');
                    requiredMark.className = 'text-danger ms-1';
                    requiredMark.setAttribute('aria-hidden', 'true');
                    requiredMark.textContent = '*';
                    lbl.appendChild(requiredMark);
                }
                wrapper.appendChild(lbl);
            }

            let input;
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.className = 'form-control';
                input.id = name;
                input.name = name;
                if (required) input.required = true;
                if (value !== '' && value != null) input.value = value;
            } else if (field.type === 'select') {
                input = document.createElement('select');
                input.className = 'form-select';
                input.id = name;
                input.name = name;
                if (required) input.required = true;
                if (field.placeholder) {
                    const placeholderOption = document.createElement('option');
                    placeholderOption.value = '';
                    placeholderOption.textContent = field.placeholder;
                    placeholderOption.disabled = false;
                    placeholderOption.selected = value === '' || value == null;
                    input.appendChild(placeholderOption);
                }
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
            }

            if (field.placeholder && field.type !== 'select') input.placeholder = field.placeholder;
            if (field.min !== undefined) input.min = String(field.min);
            if (field.max !== undefined) input.max = String(field.max);
            if (field.type === 'number') input.step = String(field.step || '0.01');
            input.setAttribute('form', this._formId);

            wrapper.appendChild(input);

            return wrapper;
        });

        const form = document.createElement('form');
        form.id = this._formId;
        form.className = 'd-flex flex-column gap-2';
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
        } else {
            const hiddenSubmitBtn = document.createElement('button');
            hiddenSubmitBtn.type = 'submit';
            hiddenSubmitBtn.className = 'd-none';
            hiddenSubmitBtn.tabIndex = -1;
            hiddenSubmitBtn.setAttribute('aria-hidden', 'true');
            hiddenSubmitBtn.dataset.programmaticSubmit = 'true';
            form.appendChild(hiddenSubmitBtn);
        }

        this.appendChild(form);
        this._setupListeners();
    }

    triggerSubmit() {
        const formEl = this.querySelector('form');
        if (formEl) {
            const hiddenSubmitBtn = formEl.querySelector('[data-programmatic-submit="true"]');
            if (hiddenSubmitBtn) {
                hiddenSubmitBtn.click();
                return;
            }
            const submitBtn = formEl.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.click();
                return;
            }
            if (typeof formEl.requestSubmit === 'function') {
                formEl.requestSubmit();
                return;
            }
            formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
    }

    triggerCancel() {
        this.dispatchEvent(new CustomEvent('form:cancel', { bubbles: true, composed: true }));
    }

    handleInvalid(e) {
        this.form?.classList.add('was-validated');
        const invalidField = e?.target;
        if (!invalidField || invalidField === this.form) return;
        const fieldName = invalidField.name || invalidField.id || 'form';
        this.dispatchEvent(new CustomEvent('form:validation-error', {
            detail: {
                errors: {
                    [fieldName]: invalidField.validationMessage || 'Campo inválido'
                }
            },
            bubbles: true,
            composed: true
        }));
    }

    handleSubmit(e) {
        e.preventDefault();
        const values = getFormValues(this.form);
        this.dispatchEvent(new CustomEvent('form:submit', {
            detail: values,
            bubbles: true,
            composed: true
        }));
    }
}
customElements.define('app-form', AppForm);
