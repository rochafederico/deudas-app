// src/components/IngresoModal.js
import { UiModal } from './UiModal.js';
import './IngresoForm.js';

export class IngresoModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    connectedCallback() {
        this.ui = this.shadowRoot.querySelector('ui-modal');
        this.form = this.shadowRoot.querySelector('ingreso-form');
        this.form.addEventListener('ingreso:saved', (e) => this._handleEvent(e, 'ingreso:saved'));
        this.form.addEventListener('ingreso:cancel', () => this.ui.close());
    }

    openCreate() {
        this.ui.setTitle('Agregar ingreso');
        this.form.reset();
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
        this.dispatchEvent(new CustomEvent(type, { detail: e.detail, bubbles: true, composed: true }));
    }

    render() {
        this.shadowRoot.innerHTML = `
            <ui-modal></ui-modal>
            <ingreso-form></ingreso-form>
            <style>
            :host{}
            ingreso-form{ display:block; }
            ui-modal::part(dialog){ border-radius:16px; padding:16px; }
            </style>
        `;
        setTimeout(() => {
            const modal = this.shadowRoot.querySelector('ui-modal');
            const form = this.shadowRoot.querySelector('ingreso-form');
            if (modal && form) modal.appendChild(form);
        }, 0);
    }
}

customElements.define('ingreso-modal', IngresoModal);
