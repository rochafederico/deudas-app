// src/components/DebtModal.js
// Web Component <debt-modal> - Wrapper específico para <ui-modal> + <debt-form>

import { UiModal } from './UiModal.js';
import { DebtForm } from './DebtForm.js';

export class DebtModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    connectedCallback() {
        this.ui = this.shadowRoot.querySelector('ui-modal');
        this.form = this.shadowRoot.querySelector('debt-form');
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
        this.shadowRoot.innerHTML = `
        <ui-modal></ui-modal>
        <debt-form></debt-form>
        <style>
        :host{}
        debt-form{ display:block; }
        ui-modal::part(dialog){ border-radius:16px; padding:16px; background:#111a34; color:#e5e7eb; }
        ui-modal::part(header){ display:flex; align-items:center; justify-content:space-between; }
        </style>
        `;
        // Mover el formulario dentro del slot del modal
        setTimeout(() => {
            const modal = this.shadowRoot.querySelector('ui-modal');
            const form = this.shadowRoot.querySelector('debt-form');
            if (modal && form) {
                modal.appendChild(form);
            }
        }, 0);
    }
}

customElements.define('debt-modal', DebtModal);
