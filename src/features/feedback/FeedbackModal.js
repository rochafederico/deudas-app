// src/features/feedback/FeedbackModal.js
// Modal Bootstrap para envío de feedback vía GitHub o WhatsApp.

import '../../shared/components/UiModal.js';
import {
    validateFeedback,
    formatFeedback,
    buildGitHubUrl,
    buildWhatsAppUrl,
    getContext,
} from './feedbackService.js';

export class FeedbackModal extends HTMLElement {
    connectedCallback() {
        if (!this._rendered) this.render();
    }

    open(opener) {
        if (!this._rendered) this.render();
        const ui = this.querySelector('ui-modal');
        ui.setTitle('Enviar feedback');
        this._resetForm();
        ui.open();
        if (opener) ui.returnFocusTo(opener);
    }

    close() {
        const ui = this.querySelector('ui-modal');
        ui?.close();
    }

    _resetForm() {
        const form = this.querySelector('#feedback-form');
        if (form) form.reset();
        this._clearErrors();
        this._updateLinks();
    }

    _clearErrors() {
        this.querySelectorAll('.feedback-error').forEach(el => {
            el.textContent = '';
            el.classList.add('d-none');
        });
    }

    _showError(field, message) {
        const el = this.querySelector(`#feedback-error-${field}`);
        if (el) {
            el.textContent = message;
            el.classList.remove('d-none');
        }
    }

    _getFormValues() {
        return {
            tipo: this.querySelector('#feedback-tipo')?.value || '',
            comentario: this.querySelector('#feedback-comentario')?.value || '',
        };
    }

    /** Rebuilds the dropdown hrefs and toggles the send button disabled state live. */
    _updateLinks() {
        const { tipo, comentario } = this._getFormValues();
        const { valid } = validateFeedback(tipo, comentario);
        const sendBtn = this.querySelector('#feedback-send-btn');
        const githubLink = this.querySelector('#feedback-link-github');
        const whatsappLink = this.querySelector('#feedback-link-whatsapp');

        if (valid) {
            const contexto = getContext();
            const feedbackText = formatFeedback(tipo, comentario.trim(), contexto);
            if (githubLink) githubLink.href = buildGitHubUrl(tipo, feedbackText);
            if (whatsappLink) whatsappLink.href = buildWhatsAppUrl(feedbackText);
            sendBtn?.removeAttribute('disabled');
        } else {
            if (githubLink) githubLink.href = '#';
            if (whatsappLink) whatsappLink.href = '#';
            sendBtn?.setAttribute('disabled', '');
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
                        <div id="feedback-error-tipo" class="feedback-error invalid-feedback d-none" role="alert"></div>
                    </div>

                    <div class="mb-3">
                        <label for="feedback-comentario" class="form-label fw-semibold">Comentario <span class="text-danger" aria-hidden="true">*</span></label>
                        <textarea id="feedback-comentario" class="form-control" rows="4"
                            placeholder="Describí tu sugerencia, problema o confusión…"
                            maxlength="1000" aria-required="true"></textarea>
                        <div class="form-text text-end">
                            <span id="feedback-char-count">0</span>/1000
                        </div>
                        <div id="feedback-error-comentario" class="feedback-error invalid-feedback d-none" role="alert"></div>
                    </div>

                    <p class="text-muted small mb-1">
                        💡 Si tenés imagen o video, adjuntalo luego en la plataforma.
                    </p>
                    <p class="text-warning small mb-3">
                        ⚠️ Evitá incluir datos sensibles como montos u otros datos personales.
                    </p>

                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        <div class="btn-group flex-fill">
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
                        <button type="button" id="feedback-cancel"
                            class="btn btn-link btn-sm text-muted">
                            Cancelar
                        </button>
                    </div>
                </form>
            </ui-modal>
        `;

        // Live update: rebuild URLs and toggle send button on every change
        const tipo = this.querySelector('#feedback-tipo');
        const textarea = this.querySelector('#feedback-comentario');
        const counter = this.querySelector('#feedback-char-count');

        tipo?.addEventListener('change', () => this._updateLinks());
        textarea?.addEventListener('input', () => {
            if (counter) counter.textContent = textarea.value.length;
            this._updateLinks();
        });

        // Close modal after a send link is followed
        this.querySelector('#feedback-link-github')?.addEventListener('click', () => this.close());
        this.querySelector('#feedback-link-whatsapp')?.addEventListener('click', () => this.close());
        this.querySelector('#feedback-cancel')?.addEventListener('click', () => this.close());

        // Initial state
        this._updateLinks();
    }
}

customElements.define('feedback-modal', FeedbackModal);
