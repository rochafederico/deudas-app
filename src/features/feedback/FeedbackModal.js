// src/features/feedback/FeedbackModal.js
// Modal Bootstrap para envío de feedback vía GitHub o WhatsApp.

import '../../shared/components/UiModal.js';
import {
    validateFeedback,
    formatFeedbackGitHub,
    formatFeedbackWhatsApp,
    buildGitHubUrl,
    buildWhatsAppUrl,
    getContext,
} from './feedbackService.js';

export class FeedbackModal extends HTMLElement {
    connectedCallback() {
        if (!this._rendered) this.render();
    }

    open(opener) {
        // Capture context BEFORE render so getContext() sees whatever was open
        // before the feedback modal itself appears.
        this._contexto = getContext();
        if (!this._rendered) this.render();
        const ui = this.querySelector('ui-modal');
        ui.setTitle('Enviar feedback');
        this._resetForm();
        document.body.classList.add('feedback-modal-open');
        ui.open();
        if (opener) ui.returnFocusTo(opener);
    }

    close() {
        document.body.classList.remove('feedback-modal-open');
        const ui = this.querySelector('ui-modal');
        ui?.close();
    }

    _resetForm() {
        if (this._formEl) this._formEl.reset();
        if (this._counterEl) this._counterEl.textContent = '0';
        this._updateLinks();
    }

    _getFormValues() {
        return {
            tipo: this._tipoEl?.value || '',
            comentario: this._comentarioEl?.value || '',
        };
    }

    /** Rebuilds the dropdown hrefs and toggles the send button disabled state live. */
    _updateLinks() {
        const { tipo, comentario } = this._getFormValues();
        const { valid } = validateFeedback(tipo, comentario);

        if (valid) {
            const contexto = this._contexto || getContext();
            if (this._githubLinkEl) this._githubLinkEl.href = buildGitHubUrl(tipo, formatFeedbackGitHub(tipo, comentario.trim(), contexto));
            if (this._whatsappLinkEl) this._whatsappLinkEl.href = buildWhatsAppUrl(formatFeedbackWhatsApp(tipo, comentario.trim(), contexto));
            this._sendBtn?.removeAttribute('disabled');
        } else {
            if (this._githubLinkEl) this._githubLinkEl.href = '#';
            if (this._whatsappLinkEl) this._whatsappLinkEl.href = '#';
            this._sendBtn?.setAttribute('disabled', '');
        }
    }

    render() {
        this._rendered = true;
        this.innerHTML = `
            <ui-modal id="feedbackModal">
                <form id="feedback-form" novalidate>
                    <div class="mb-3">
                        <label for="feedback-tipo" class="form-label fw-semibold">Tipo <span class="text-danger" aria-hidden="true">*</span></label>
                        <select id="feedback-tipo" class="form-select" aria-required="true">
                            <option value="">Seleccioná un tipo…</option>
                            <option value="sugerencia">💡 Sugerencia</option>
                            <option value="problema">🐛 Problema</option>
                            <option value="confusión">❓ Confusión</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label for="feedback-comentario" class="form-label fw-semibold">Comentario <span class="text-danger" aria-hidden="true">*</span></label>
                        <textarea id="feedback-comentario" class="form-control" rows="4"
                            placeholder="Describí tu sugerencia, problema o confusión…"
                            maxlength="1000" aria-required="true"></textarea>
                        <div class="form-text text-end">
                            <span id="feedback-char-count">0</span>/1000
                        </div>
                    </div>

                    <div class="alert alert-warning fade show" role="alert">
                        <p class="small mb-1">
                            💡 Si tenés imagen o video, adjuntalo luego en la plataforma.
                        </p>
                        <p class="small mb-0">
                            ⚠️ Evitá incluir datos sensibles como montos u otros datos personales.
                        </p>
                    </div>
                </form>
                <div id="feedback-actions" class="btn-group w-100">
                    <button type="button" id="feedback-send-btn"
                        class="btn btn-primary dropdown-toggle"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        disabled>
                        Enviar
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                            <a class="dropdown-item" id="feedback-link-github"
                                href="#" target="_blank" rel="noopener noreferrer">
                                🐙 GitHub
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item" id="feedback-link-whatsapp"
                                href="#" target="_blank" rel="noopener noreferrer">
                                💬 WhatsApp
                            </a>
                        </li>
                    </ul>
                </div>
            </ui-modal>
        `;

        // Store direct element references now, before ui-modal.open() can move
        // the .modal element to document.body (which would break this.querySelector).
        this._formEl = this.querySelector('#feedback-form');
        this._tipoEl = this.querySelector('#feedback-tipo');
        this._comentarioEl = this.querySelector('#feedback-comentario');
        this._counterEl = this.querySelector('#feedback-char-count');
        this._sendBtn = this.querySelector('#feedback-send-btn');
        this._githubLinkEl = this.querySelector('#feedback-link-github');
        this._whatsappLinkEl = this.querySelector('#feedback-link-whatsapp');

        // Remove feedback-modal-open class when the modal is closed via X or ESC
        const modalInnerEl = this.querySelector('ui-modal .modal');
        if (modalInnerEl) {
            modalInnerEl.addEventListener('hidden.bs.modal', () => {
                document.body.classList.remove('feedback-modal-open');
            });
        }

        // Move the actions div into the modal footer
        const actionsEl = this.querySelector('#feedback-actions');
        const footerEl = this.querySelector('.modal-footer');
        if (actionsEl && footerEl) footerEl.appendChild(actionsEl);

        // Live update: rebuild URLs and toggle send button on every change
        this._tipoEl?.addEventListener('change', () => this._updateLinks());
        this._comentarioEl?.addEventListener('input', () => {
            if (this._counterEl) this._counterEl.textContent = this._comentarioEl.value.length;
            this._updateLinks();
        });

        // Close modal after a send link is followed
        this._githubLinkEl?.addEventListener('click', () => this.close());
        this._whatsappLinkEl?.addEventListener('click', () => this.close());

        // Initial state
        this._updateLinks();
    }
}

customElements.define('feedback-modal', FeedbackModal);
