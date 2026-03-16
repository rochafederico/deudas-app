// src/components/UiModal.js
// Web Component <ui-modal> - Modal genérico accesible con <dialog>
import { injectBootstrap } from '../utils/bootstrapStyles.js';

export class UiModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.opener = null;
        this.render();
    }

    connectedCallback() {
        this.dialog = this.shadowRoot.querySelector('dialog');
        this.btnClose = this.shadowRoot.querySelector('.btn-modal-close');
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
        dialog{ 
            border-radius: 0.75rem; 
            padding: 0; 
            background: var(--panel-light, #fff); 
            color: var(--text-light, #222); 
            min-width: 320px; 
            max-width: 600px;
            border: 1px solid var(--border-light, #e0e0e0); 
            box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
        }
        .modal-header { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--border-light, #dee2e6);
        }
        .modal-header h2 {
            margin: 0;
            font-size: 1.25rem;
            color: var(--accent, rgb(61, 121, 130));
        }
        .modal-body {
            padding: 1rem 1.25rem;
        }
        .btn-modal-close {
            background: transparent;
            border: 0;
            font-size: 1.5rem;
            line-height: 1;
            cursor: pointer;
            color: var(--muted-light, #888);
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
        }
        .btn-modal-close:hover {
            color: var(--text-light, #222);
            background-color: rgba(0,0,0,0.05);
        }
        :host-context(body.dark-mode) dialog {
            background: var(--panel-dark, #23272e);
            color: var(--text-dark, #eaeaea);
            border-color: var(--border-dark, #333);
        }
        :host-context(body.dark-mode) .modal-header {
            border-color: var(--border-dark, #333);
        }
        :host-context(body.dark-mode) .btn-modal-close {
            color: var(--muted-dark, #b0b0b0);
        }
        :host-context(body.dark-mode) .btn-modal-close:hover {
            color: var(--text-dark, #eaeaea);
            background-color: rgba(255,255,255,0.1);
        }
        </style>
        <dialog role="dialog" aria-modal="true" aria-labelledby="modal-title" part="dialog">
            <div class="modal-header" part="header">
                <h2 id="modal-title"></h2>
                <button type="button" class="btn-modal-close" aria-label="Cerrar modal" tabindex="0">&times;</button>
            </div>
            <div class="modal-body">
                <slot></slot>
            </div>
        </dialog>
        `;
        injectBootstrap(this.shadowRoot);
    }
}

customElements.define('ui-modal', UiModal);
