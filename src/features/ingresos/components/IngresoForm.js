// src/components/IngresoForm.js
import '../../../shared/components/AppForm.js';
import '../../../shared/components/AppInput.js';
import { addIngreso } from '../ingresoRepository.js';
import monedas from '../../../shared/config/monedas.js';

export class IngresoForm extends HTMLElement {
    constructor() {
        super();
        this._boundOnSubmit = this._onSubmit.bind(this);
        this._boundOnCancel = () => {
            this.dispatchEvent(new CustomEvent('ingreso:cancel', { bubbles: true, composed: true }));
        };
    }

    connectedCallback() {
        this.classList.add('d-block');
        this.render();
        this.form = this.querySelector('app-form');
        if (this.form && !this._listenersAttached) {
            this.form.addEventListener('form:submit', this._boundOnSubmit);
            this.form.addEventListener('form:cancel', this._boundOnCancel);
            this._listenersAttached = true;
        }
    }

    disconnectedCallback() {
        if (this.form && this._listenersAttached) {
            this.form.removeEventListener('form:submit', this._boundOnSubmit);
            this.form.removeEventListener('form:cancel', this._boundOnCancel);
            this._listenersAttached = false;
        }
    }

    _onSubmit(e) {
        const values = e.detail;
        // Normalizar fecha y periodo
        const fecha = values.fecha;
        const periodo = fecha ? fecha.slice(0, 7) : '';
        const ingreso = {
            fecha,
            descripcion: values.descripcion,
            monto: Number(values.monto) || 0,
            moneda: values.moneda || 'ARS',
            periodo
        };
        addIngreso(ingreso).then(id => {
            // Emitir evento global y local
            window.dispatchEvent(new CustomEvent('ingreso:added', { detail: { id, ingreso }, bubbles: true, composed: true }));
            this.dispatchEvent(new CustomEvent('ingreso:saved', { detail: { id, ingreso }, bubbles: true, composed: true }));
        }).catch(err => {
            console.error('Error saving ingreso', err);
            // Podríamos mostrar un error al usuario aquí
        });
    }

    reset() {
        const form = this.querySelector('app-form');
        if (form) {
            form.initialValues = { moneda: 'ARS' };
            this._applyMobileFirstLayout(form);
            form.clearValidationState();
        }
    }

    render() {
        // Campos: descripcion, monto, moneda, fecha
        const fields = [
            { name: 'descripcion', label: 'Descripción', type: 'text', required: true },
            { name: 'monto', label: 'Monto', type: 'number', required: true, min: 0.01 },
            { name: 'moneda', label: 'Moneda', type: 'select', options: monedas, required: true, placeholder: 'Seleccioná una moneda…' },
            { name: 'fecha', label: 'Fecha', type: 'date', required: true },
        ];
        this.innerHTML = '';
        const form = document.createElement('app-form');
        form.fields = fields;
        form.submitText = 'Agregar ingreso';
        form.cancelText = 'Cancelar';
        form.initialValues = { moneda: 'ARS' };
        this.appendChild(form);
        this._applyMobileFirstLayout(form);
    }

    _applyMobileFirstLayout(appForm) {
        const formEl = appForm.querySelector('form');
        const descripcionField = appForm.querySelector('[data-field-name="descripcion"]');
        const montoField = appForm.querySelector('[data-field-name="monto"]');
        const monedaField = appForm.querySelector('[data-field-name="moneda"]');
        const fechaField = appForm.querySelector('[data-field-name="fecha"]');
        const submitControls = formEl?.lastElementChild;
        if (!formEl || !descripcionField || !montoField || !monedaField || !fechaField || !submitControls) return;

        const amountRow = document.createElement('div');
        amountRow.className = 'row g-2 align-items-end ingreso-monto-row';
        montoField.className = 'mb-0 col-8';
        monedaField.className = 'mb-0 col-4';
        amountRow.appendChild(montoField);
        amountRow.appendChild(monedaField);

        formEl.replaceChildren(
            descripcionField,
            amountRow,
            fechaField,
            submitControls
        );
    }
}

customElements.define('ingreso-form', IngresoForm);
