
import { addValorToInversion } from '../../../repository/inversionRepository.js';
import { UiModal } from '../../../components/UiModal.js';

export class ValorInversionModal extends HTMLElement {
    _form;
    connectedCallback() {
        this.render();
    }
    setIdInversion(id) {
        this._idInversion = id;
    }
    resetValues() {
        this._form.form.reset();
    }
    render() {
        if (this._rendered) return;
        this._rendered = true;
        this.innerHTML = '<ui-modal></ui-modal>';
        // Campos: nombre, valor inicial, fecha compra
        const fields = [
            { name: 'valor', label: 'Valor', type: 'number', required: true },
            { name: 'fecha', label: 'Fecha', type: 'date', required: true },
        ];
        this._form = document.createElement('app-form');
        this._form.fields = fields;
        this._form.initialValues = this._inversion || {};
        this._form.submitText = 'Guardar';
        this._form.cancelText = 'Cancelar';
        // Usar evento personalizado para submit SOLO una vez
        this._form.addEventListener('form:submit', async (e) => {
            e.preventDefault();
            const valor = parseFloat(e.detail.valor);
            const fecha = e.detail.fecha;
            if (isNaN(valor) || !fecha)
                return;
            await addValorToInversion(this._idInversion, { fecha, valor });
            this.onsave && this.onsave();
            ui.close();
        });
        const ui = this.querySelector('ui-modal');

        ui.appendChild(this._form);
    }
}

customElements.define('valor-modal', ValorInversionModal);
