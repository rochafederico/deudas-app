// src/components/IngresoModal.js
import '../../../shared/components/UiModal.js';
import './IngresoForm.js';

export class IngresoModal extends HTMLElement {
    constructor() {
        super();
        this.style.display = 'block';
    }

    connectedCallback() {
        this.render();
        this.ui = this.querySelector('ui-modal');
        this.form = this.querySelector('ingreso-form');
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
        this.innerHTML = `
            <ui-modal></ui-modal>
            <ingreso-form></ingreso-form>
        `;
        setTimeout(() => {
            const modal = this.querySelector('ui-modal');
            const form = this.querySelector('ingreso-form');
            if (modal && form) modal.appendChild(form);
        }, 0);
    }
}

customElements.define('ingreso-modal', IngresoModal);
