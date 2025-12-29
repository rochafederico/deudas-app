// src/components/IngresoForm.js
import './AppForm.js';
import './AppInput.js';
import { addIngreso } from '../repository/ingresoRepository.js';
import monedas from '../config/monedas.js';

export class IngresoForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._boundOnSubmit = this._onSubmit.bind(this);
        this._boundOnCancel = () => {
            this.dispatchEvent(new CustomEvent('ingreso:cancel', { bubbles: true, composed: true }));
        };
        this.render();
    }

    connectedCallback() {
        this.form = this.shadowRoot.querySelector('app-form');
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
        const form = this.shadowRoot.querySelector('app-form');
        if (form) form.initialValues = { fecha: new Date().toISOString().slice(0,10), moneda: 'ARS' };
    }

    render() {
        // Campos: fecha, descripcion, monto, moneda
        const fields = [
            { name: 'fecha', label: 'Fecha', type: 'date', required: true },
            { name: 'descripcion', label: 'Descripción', type: 'text' },
            { name: 'monto', label: 'Monto', type: 'number', required: true },
            { name: 'moneda', label: 'Moneda', type: 'select', options: monedas, required: true },
        ];
        this.shadowRoot.innerHTML = '';
        const form = document.createElement('app-form');
        form.fields = fields;
        form.submitText = 'Agregar ingreso';
        form.cancelText = 'Cancelar';
        form.initialValues = { fecha: new Date().toISOString().slice(0,10), moneda: 'ARS' };
        this.shadowRoot.appendChild(form);
    }
}

customElements.define('ingreso-form', IngresoForm);
