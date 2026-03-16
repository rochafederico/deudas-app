// src/components/DebtModal.js
// Web Component <debt-modal> - Wrapper específico para <ui-modal> + <debt-form>

import '../../../shared/components/UiModal.js';
import './DebtForm.js';

export class DebtModal extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.style.display = 'block';
        this.render();
        this.ui = this.querySelector('ui-modal');
        this.form = this.querySelector('debt-form');
        // Propagar eventos del formulario y cerrar modal
        this.form.addEventListener('deuda:saved', e => this._handleEvent(e, 'deuda:saved'));
        this.form.addEventListener('deuda:updated', e => this._handleEvent(e, 'deuda:updated'));
    }

    openCreate() {
        this.ui.setTitle('Agregar deuda');
        this.form.reset();
        this.ui.open();
    }

    openEdit(deuda) {
        this.ui.setTitle('Editar deuda');
        this.form.load(deuda);
        this.ui.open();
    }

    close() {
        this.ui.close();
    }

    attachOpener(el) {
        this.ui.returnFocusTo(el);
    }

    _handleEvent(e, type) {
        this.close();
        // Reemitir evento hacia arriba
        this.dispatchEvent(new CustomEvent(type, { detail: e.detail, bubbles: true, composed: true }));
    }

    render() {
        this.innerHTML = `
        <ui-modal></ui-modal>
        <debt-form></debt-form>
        `;
        setTimeout(() => {
            const modal = this.querySelector('ui-modal');
            const form = this.querySelector('debt-form');
            if (modal && form) {
                modal.appendChild(form);
            }
        }, 0);
    }
}

customElements.define('debt-modal', DebtModal);
