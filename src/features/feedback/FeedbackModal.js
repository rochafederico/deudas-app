// src/features/feedback/FeedbackModal.js
import '../../shared/components/UiModal.js';
import {
    FEEDBACK_TYPES,
    formatFeedback,
    buildGitHubUrl,
    buildMailtoUrl,
    getScreenLabel,
    savePending,
} from './feedbackService.js';

export class FeedbackModal extends HTMLElement {
    constructor() {
        super();
        this._rendered = false;
        this._modal = null;
        this._currentData = null;
    }

    connectedCallback() {
        this.render();
        this._modal = this.querySelector('ui-modal');

        this._onSubmit = (e) => {
            e.preventDefault();
            const comment = this.querySelector('#feedback-comment')?.value?.trim();
            if (!comment) return;
            const data = {
                type: this.querySelector('#feedback-type')?.value || 'sugerencia',
                comment,
                screen: getScreenLabel(window.location.pathname),
                url: window.location.href,
                date: new Date().toISOString().slice(0, 10),
            };
            this._currentData = data;
            savePending(formatFeedback(data));
            this._showActions();
        };

        this._onCopy = async (e) => {
            e.preventDefault();
            const text = formatFeedback(this._currentData);
            try {
                await navigator.clipboard.writeText(text);
                window.dispatchEvent(new CustomEvent('app:notify', {
                    detail: { message: '✅ Feedback copiado al portapapeles.', type: 'success' }
                }));
            } catch (_err) {
                window.dispatchEvent(new CustomEvent('app:notify', {
                    detail: { message: '❌ No se pudo copiar. Intentá de nuevo.', type: 'danger' }
                }));
            }
        };

        this._onGithub = (e) => {
            e.preventDefault();
            const url = buildGitHubUrl(this._currentData);
            window.open(url, '_blank', 'noopener,noreferrer');
        };

        this._onEmail = (e) => {
            e.preventDefault();
            const a = document.createElement('a');
            a.href = buildMailtoUrl(this._currentData);
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        this.querySelector('#feedback-form')?.addEventListener('submit', this._onSubmit);
        this.querySelector('#feedback-copy')?.addEventListener('click', this._onCopy);
        this.querySelector('#feedback-github')?.addEventListener('click', this._onGithub);
        this.querySelector('#feedback-email')?.addEventListener('click', this._onEmail);
    }

    disconnectedCallback() {
        this.querySelector('#feedback-form')?.removeEventListener('submit', this._onSubmit);
        this.querySelector('#feedback-copy')?.removeEventListener('click', this._onCopy);
        this.querySelector('#feedback-github')?.removeEventListener('click', this._onGithub);
        this.querySelector('#feedback-email')?.removeEventListener('click', this._onEmail);
    }

    open(opener) {
        if (!this._modal) this._modal = this.querySelector('ui-modal');
        this._modal.setTitle('📝 Enviar feedback');
        this._modal.returnFocusTo(opener);
        this._reset();
        this._modal.open();
    }

    close() {
        this._modal?.close();
    }

    _reset() {
        const form = this.querySelector('#feedback-form');
        if (form) form.reset();
        this._currentData = null;
        this._hideActions();
    }

    _hideActions() {
        const actions = this.querySelector('#feedback-actions');
        if (actions) actions.classList.add('d-none');
    }

    _showActions() {
        const actions = this.querySelector('#feedback-actions');
        if (actions) actions.classList.remove('d-none');
    }

    render() {
        this._rendered = true;
        const typeOptions = FEEDBACK_TYPES.map(t =>
            `<option value="${t.value}">${t.label}</option>`
        ).join('');
        this.innerHTML = `
            <ui-modal id="feedbackModal">
                <form id="feedback-form" novalidate>
                    <div class="mb-3">
                        <label for="feedback-type" class="form-label fw-semibold">Tipo de feedback</label>
                        <select id="feedback-type" class="form-select" required>
                            ${typeOptions}
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="feedback-comment" class="form-label fw-semibold">Comentario</label>
                        <textarea id="feedback-comment" class="form-control" rows="4"
                            placeholder="Describí tu sugerencia, problema o confusión..." required></textarea>
                    </div>
                    <div class="d-flex justify-content-end gap-2">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Generar feedback</button>
                    </div>
                </form>
                <div id="feedback-actions" class="d-none mt-3 border-top pt-3">
                    <p class="text-muted small mb-2">Feedback generado. Elegí cómo enviarlo:</p>
                    <div class="d-flex flex-wrap gap-2">
                        <button id="feedback-copy" type="button" class="btn btn-outline-secondary btn-sm">📋 Copiar al portapapeles</button>
                        <button id="feedback-github" type="button" class="btn btn-outline-dark btn-sm">🐙 Abrir issue en GitHub</button>
                        <button id="feedback-email" type="button" class="btn btn-outline-primary btn-sm">📧 Enviar por email</button>
                    </div>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('feedback-modal', FeedbackModal);
