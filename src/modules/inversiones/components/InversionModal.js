
import { addInversion } from '../../../repository/inversionRepository.js';
import { UiModal } from '../../../components/UiModal.js';
import monedas from '../../../config/monedas.js';

export class InversionModal extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    _form;
    resetValues() {
        this._form.form.reset();
    }

    render() {
        if (this._rendered) return;
        this._rendered = true;
        this.innerHTML = '<ui-modal></ui-modal>';
        // Campos: nombre, valor inicial, fecha compra
        const fields = [
            { name: 'nombre', label: 'Nombre', type: 'text', required: true },
            { name: 'valorInicial', label: 'Valor Inicial', type: 'number', required: true },
            { name: 'moneda', label: 'Moneda', type: 'select', options: monedas, required: true },
            { name: 'fechaCompra', label: 'Fecha Compra', type: 'date', required: true },
        ];
        this._form = document.createElement('app-form');
        this._form.fields = fields;
        this._form.initialValues = this._inversion || {};
        this._form.submitText = 'Guardar';
        this._form.cancelText = 'Cancelar';
        // Usar evento personalizado para submit SOLO una vez
        this._form.addEventListener('form:submit', async (e) => {
            e.preventDefault();
            const nombre = e.detail.nombre.trim();
            const valorInicial = parseFloat(e.detail.valorInicial);
            const moneda = e.detail.moneda;
            const fechaCompra = e.detail.fechaCompra;
            if (!nombre || isNaN(valorInicial) || !fechaCompra || !moneda)
                return;
            const inversionData = { nombre, valorInicial, moneda, fechaCompra, historialValores: [] };
            inversionData.historialValores.push({ fecha: fechaCompra, valor: valorInicial });
            await addInversion(inversionData);
            this.onsave && this.onsave();
            this._closeModal();
        });

        this._form.addEventListener('form:cancel', () => this._closeModal());
        const ui = this.querySelector('ui-modal');
        ui.appendChild(this._form);
    }
    _closeModal() {
        const ui = this.querySelector('ui-modal');
        this.resetValues();
        ui.close();
    }
}

customElements.define('inversion-modal', InversionModal);
