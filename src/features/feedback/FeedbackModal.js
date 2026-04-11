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

    _onSend(channel) {
        this._clearErrors();
        const { tipo, comentario } = this._getFormValues();
        const { valid, errors } = validateFeedback(tipo, comentario);

        if (!valid) {
            if (errors.tipo) this._showError('tipo', errors.tipo);
            if (errors.comentario) this._showError('comentario', errors.comentario);
            return;
        }

        const contexto = getContext();
        const feedbackText = formatFeedback(tipo, comentario.trim(), contexto);
        const url = channel === 'github'
            ? buildGitHubUrl(tipo, feedbackText)
            : buildWhatsAppUrl(feedbackText);

        window.open(url, '_blank', 'noopener,noreferrer');
        this.close();
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

                    <div class="d-flex gap-2 flex-wrap">
                        <button type="button" id="feedback-send-github"
                            class="btn btn-dark flex-fill">
                            🐙 Enviar por GitHub
                        </button>
                        <button type="button" id="feedback-send-whatsapp"
                            class="btn btn-success flex-fill">
                            💬 Enviar por WhatsApp
                        </button>
                    </div>
                    <div class="mt-2 text-center">
                        <button type="button" id="feedback-cancel"
                            class="btn btn-link btn-sm text-muted">
                            Cancelar
                        </button>
                    </div>
                </form>
            </ui-modal>
        `;

        // Wire up char counter
        const textarea = this.querySelector('#feedback-comentario');
        const counter = this.querySelector('#feedback-char-count');
        textarea?.addEventListener('input', () => {
            if (counter) counter.textContent = textarea.value.length;
        });

        // Wire up send buttons
        this.querySelector('#feedback-send-github')?.addEventListener('click', () => this._onSend('github'));
        this.querySelector('#feedback-send-whatsapp')?.addEventListener('click', () => this._onSend('whatsapp'));
        this.querySelector('#feedback-cancel')?.addEventListener('click', () => this.close());
    }
}

customElements.define('feedback-modal', FeedbackModal);
