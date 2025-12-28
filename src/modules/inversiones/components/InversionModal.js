
import { addInversion } from '../../../repository/inversionRepository.js';
import { UiModal } from '../../../components/UiModal.js';

export class InversionModal extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        if (this._rendered) return;
        this._rendered = true;
        this.innerHTML = '<ui-modal></ui-modal>';
        // Campos: nombre, valor inicial, fecha compra
        const fields = [
            { name: 'nombre', label: 'Nombre', type: 'text', required: true },
            { name: 'valorInicial', label: 'Valor Inicial', type: 'number', required: true },
            { name: 'fechaCompra', label: 'Fecha Compra', type: 'date', required: true },
        ];
        const form = document.createElement('app-form');
        form.fields = fields;
        form.initialValues = this._inversion || {};
        form.submitText = 'Guardar';
        form.cancelText = 'Cancelar';
        // Usar evento personalizado para submit SOLO una vez
        form.addEventListener('form:submit', async (e) => {
            e.preventDefault();
            const nombre = e.detail.nombre.trim();
            const valorInicial = parseFloat(e.detail.valorInicial);
            const fechaCompra = e.detail.fechaCompra;
            if (!nombre || isNaN(valorInicial) || !fechaCompra)
                return;
            const inversionData = { nombre, valorInicial, fechaCompra, historialValores: e.detail.historialValores || [] };
            inversionData.historialValores.push({ fecha: fechaCompra, valor: valorInicial });
            await addInversion(inversionData);
            this.onsave && this.onsave();
            ui.close();
        });
        const ui = this.querySelector('ui-modal');

        ui.appendChild(form);
    }
}

customElements.define('inversion-modal', InversionModal);
