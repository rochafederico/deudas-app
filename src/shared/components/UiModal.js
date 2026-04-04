// src/components/UiModal.js
// Web Component <ui-modal> - Modal usando Bootstrap 5 Modal JS (sin Shadow DOM)

export class UiModal extends HTMLElement {
    constructor() {
        super();
        this.opener = null;
        this._bsModal = null;
        this._modalEl = null;
        this._bodyEl = null;
        this._titleEl = null;
        this._movedToBody = false;
    }

    connectedCallback() {
        if (!this._rendered) this.render();
        this._initModal();
    }

    _initModal() {
        const modalEl = this.querySelector('.modal');
        if (!modalEl) return;
        this._modalEl = modalEl;
        this._bodyEl = modalEl.querySelector('.modal-body');
        this._titleEl = modalEl.querySelector('.modal-title');
        // Use Bootstrap Modal JS if available
        if (window.bootstrap && window.bootstrap.Modal) {
            this._bsModal = new window.bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: true });
        }
        // Listen for hidden event to return focus
        modalEl.addEventListener('hidden.bs.modal', () => this._onClose());
    }

    clearBody() {
        if (this._bodyEl) this._bodyEl.innerHTML = '';
    }

    setTitle(text) {
        if (this._titleEl) this._titleEl.textContent = text;
    }

    open() {
        // Move the .modal element to document.body so Bootstrap stacks
        // z-index correctly when multiple modals are open simultaneously.
        if (this._modalEl && !this._movedToBody) {
            document.body.appendChild(this._modalEl);
            this._movedToBody = true;
        }
        const shownPromise = new Promise((resolve) => {
            if (this._bsModal && this._modalEl) {
                this._modalEl.addEventListener('shown.bs.modal', resolve, { once: true });
            } else {
                resolve();
            }
        });
        if (this._bsModal) {
            this._bsModal.show();
        } else {
            // Fallback: manual show
            if (this._modalEl) {
                this._modalEl.classList.add('show', 'd-block');
                document.body.classList.add('modal-open');
            }
        }
        this._focusFirst();
        return shownPromise;
    }

    close() {
        if (this._bsModal) {
            this._bsModal.hide();
        } else {
            if (this._modalEl) {
                this._modalEl.classList.remove('show', 'd-block');
                document.body.classList.remove('modal-open');
            }
            this._onClose();
        }
    }

    returnFocusTo(el) {
        this.opener = el;
    }

    _onClose() {
        // Return the .modal element from body back into this custom element.
        if (this._movedToBody && this._modalEl) {
            HTMLElement.prototype.appendChild.call(this, this._modalEl);
            this._movedToBody = false;
        }
        if (this.opener && typeof this.opener.focus === 'function') {
            this.opener.focus();
        }
    }

    _focusFirst() {
        setTimeout(() => {
            const el = this._bodyEl && this._bodyEl.querySelector('input, select, textarea, button');
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
        if (this._bodyEl) {
            return this._bodyEl.appendChild(child);
        }
        return super.appendChild(child);
    }
}

customElements.define('ui-modal', UiModal);
