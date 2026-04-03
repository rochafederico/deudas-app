// src/components/UiModal.js
// Web Component <ui-modal> - Modal usando Bootstrap 5 Modal JS (sin Shadow DOM)

export class UiModal extends HTMLElement {
    constructor() {
        super();
        this.opener = null;
        this._bsModal = null;
    }

    connectedCallback() {
        if (!this._rendered) this.render();
        this._initModal();
    }

    _initModal() {
        const modalEl = this.querySelector('.modal');
        if (!modalEl) return;
        // Use Bootstrap Modal JS if available
        if (window.bootstrap && window.bootstrap.Modal) {
            this._bsModal = new window.bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: true });
        }
        // Listen for hidden event to return focus
        modalEl.addEventListener('hidden.bs.modal', () => this._onClose());
    }

    clearBody() {
        const body = this.querySelector('.modal-body');
        if (body) body.innerHTML = '';
    }

    setTitle(text) {
        const h = this.querySelector('.modal-title');
        if (h) h.textContent = text;
    }

    open() {
        if (this._bsModal) {
            this._bsModal.show();
        } else {
            // Fallback: manual show
            const modalEl = this.querySelector('.modal');
            if (modalEl) {
                modalEl.classList.add('show');
                modalEl.classList.add('d-block');
                document.body.classList.add('modal-open');
            }
        }
        this._focusFirst();
    }

    close() {
        if (this._bsModal) {
            this._bsModal.hide();
        } else {
            const modalEl = this.querySelector('.modal');
            if (modalEl) {
                modalEl.classList.remove('show');
                modalEl.classList.remove('d-block');
                document.body.classList.remove('modal-open');
            }
            this._onClose();
        }
    }

    returnFocusTo(el) {
        this.opener = el;
    }

    _onClose() {
        if (this.opener && typeof this.opener.focus === 'function') {
            this.opener.focus();
        }
    }

    _focusFirst() {
        setTimeout(() => {
            const el = this.querySelector('.modal-body input, .modal-body select, .modal-body textarea, .modal-body button');
            if (el) el.focus();
        }, 100);
    }

    render() {
        this._rendered = true;
        // Preserve existing children to place in modal body
        const existingChildren = Array.from(this.childNodes).map(n => n.cloneNode(true));
        this.innerHTML = `
        <div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="modal-title" aria-modal="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modal-title"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body"></div>
                </div>
            </div>
        </div>
        `;
        const body = this.querySelector('.modal-body');
        existingChildren.forEach(child => body.appendChild(child));
    }

    // Override appendChild to place children inside modal-body
    appendChild(child) {
        const body = this.querySelector('.modal-body');
        if (body) {
            return body.appendChild(child);
        }
        return super.appendChild(child);
    }
}

customElements.define('ui-modal', UiModal);
