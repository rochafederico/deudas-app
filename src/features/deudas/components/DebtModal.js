// src/components/DebtModal.js
// Web Component <debt-modal> - Wrapper específico para <ui-modal> + <debt-form>

import '../../../shared/components/UiModal.js';
import './DebtForm.js';

export class DebtModal extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.classList.add('d-block');
        this.render();
        this.ui = this.querySelector('ui-modal');
        this.form = this.querySelector('debt-form');
        // Propagar eventos del formulario y cerrar modal
        this.form.addEventListener('deuda:saved', e => this._handleEvent(e, 'deuda:saved'));
        this.form.addEventListener('deuda:updated', e => this._handleEvent(e, 'deuda:updated'));
    }

    openCreate() {
        this.ui.setTitle('Agregar deuda');
        this.form.reset({ trackAbandonment: false });
        this.form.startAnalyticsFlow('create_debt', { step: 'modal_open' });
        this.ui.open();
    }

    openEdit(deuda) {
        this.ui.setTitle('Editar deuda');
        this.form.load(deuda);
        this.form.startAnalyticsFlow('edit_debt', { step: 'modal_open', deudaId: deuda?.id });
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
                const appForm = form.querySelector('app-form');
                const footerDiv = document.createElement('div');
                footerDiv.className = 'd-flex justify-content-end gap-2';

                const cancelBtn = document.createElement('button');
                cancelBtn.type = 'button';
                cancelBtn.className = 'btn btn-primary btn-sm';
                cancelBtn.setAttribute('aria-label', 'Cancelar');
                cancelBtn.textContent = 'Cancelar';
                cancelBtn.addEventListener('click', () => appForm && appForm.triggerCancel());

                const saveBtn = document.createElement('button');
                saveBtn.type = 'button';
                saveBtn.className = 'btn btn-success btn-sm';
                saveBtn.setAttribute('aria-label', 'Guardar');
                saveBtn.textContent = 'Guardar';
                saveBtn.addEventListener('click', () => appForm && appForm.triggerSubmit());

                footerDiv.appendChild(cancelBtn);
                footerDiv.appendChild(saveBtn);
                modal.addFooter(footerDiv);
            }
        }, 0);
    }
}

customElements.define('debt-modal', DebtModal);
