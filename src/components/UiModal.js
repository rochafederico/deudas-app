// src/components/UiModal.js
// Web Component <ui-modal> - Modal genérico accesible con <dialog>

export class UiModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.opener = null;
        this.render();
    }

    connectedCallback() {
        this.dialog = this.shadowRoot.querySelector('dialog');
        this.btnClose = this.shadowRoot.querySelector('.btn-close');
        this.header = this.shadowRoot.querySelector('h2');
        this.btnClose.addEventListener('click', () => this.close());
        this.dialog.addEventListener('close', () => this._onClose());
        this.dialog.addEventListener('keydown', this._onKeyDown.bind(this));
        this.dialog.addEventListener('click', (e) => {
            if (e.target === this.dialog) this.close();
        });
    }

    setTitle(text) {
        this.header.textContent = text;
    }

    open() {
        this.dialog.showModal();
        document.body.style.overflow = 'hidden';
        this._focusFirst();
    }

    close() {
        this.dialog.close();
    }

    returnFocusTo(el) {
        this.opener = el;
    }

    _onClose() {
        document.body.style.overflow = '';
        if (this.opener) {
            this.opener.focus();
        }
    }

    _focusFirst() {
        // Focus en el primer focoable del slot
        setTimeout(() => {
            const slot = this.shadowRoot.querySelector('slot');
            const nodes = slot.assignedElements({flatten:true});
            let firstInput = nodes.find(n => n.querySelector && n.querySelector('input,select,textarea,button'));
            if (firstInput) {
                const el = firstInput.querySelector('input,select,textarea,button');
                el && el.focus();
            } else {
                // fallback: focus en el primer input dentro del modal
                const el = this.dialog.querySelector('input,select,textarea,button');
                el && el.focus();
            }
        }, 10);
    }

    _onKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        }
        // Focus trap
        if (e.key === 'Tab') {
            const focusables = this._getFocusable();
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            } else if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        }
    }

    _getFocusable() {
        return Array.from(this.dialog.querySelectorAll('input,select,textarea,button,[tabindex]:not([tabindex="-1"])'))
            .filter(el => !el.disabled && el.offsetParent !== null);
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
        :host{}
        dialog::backdrop{ background:rgba(0,0,0,.5); }
        dialog[open]{ animation: fadeIn .2s; }
        @keyframes fadeIn{ from{opacity:0} to{opacity:1} }
        dialog{ border-radius:16px; padding:16px; background:#111a34; color:#e5e7eb; min-width:320px; border:none; }
        .header{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
        .btn-close{ background:transparent; border:0; color:#e5e7eb; font-size:20px; cursor:pointer; }
        </style>
        <dialog role="dialog" aria-modal="true" aria-labelledby="modal-title" part="dialog">
            <div class="header" part="header">
                <h2 id="modal-title"></h2>
                <app-button class="btn-close" aria-label="Cerrar modal" variant="delete" style="font-size:20px;padding:2px 10px;" tabindex="0">×</app-button>
            </div>
            <slot></slot>
        </dialog>
        `;
    }
}

customElements.define('ui-modal', UiModal);
