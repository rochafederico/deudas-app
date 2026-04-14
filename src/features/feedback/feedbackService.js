// src/features/feedback/feedbackService.js
// Pure business logic: text formatting, URL builders, context capture.

const GITHUB_REPO = 'rochafederico/deudas-app';
const GITHUB_LABEL = '💬 feedback';
const WHATSAPP_NUMBER = '5491128382383';
const MAX_COMMENT_LENGTH = 1000;

/**
 * Returns the current navigation context (ruta + modal).
 * @returns {{ ruta: string, modal: string }}
 */
export function getContext() {
    let ruta = '(sin ruta)';
    let modal = '(ninguno)';

    if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path) ruta = path;

        // Find open Bootstrap modal by looking for .modal.show in the DOM
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            const title = openModal.querySelector('.modal-title');
            if (title && title.textContent.trim()) {
                modal = title.textContent.trim();
            } else {
                modal = openModal.id || 'modal abierto';
            }
        }
    }

    return { ruta, modal };
}

/**
 * Validates feedback input fields.
 * @param {string} tipo
 * @param {string} comentario
 * @returns {{ valid: boolean, errors: { tipo?: string, comentario?: string } }}
 */
export function validateFeedback(tipo, comentario) {
    const errors = {};
    const tiposValidos = ['sugerencia', 'problema', 'confusión'];

    if (!tipo || !tiposValidos.includes(tipo)) {
        errors.tipo = 'Seleccioná un tipo.';
    }

    const trimmed = typeof comentario === 'string' ? comentario.trim() : '';
    if (!trimmed) {
        errors.comentario = 'El campo Comentario es obligatorio.';
    } else if (trimmed.length > MAX_COMMENT_LENGTH) {
        errors.comentario = `El comentario no puede superar los ${MAX_COMMENT_LENGTH} caracteres.`;
    }

    return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Formats feedback as GitHub-flavoured Markdown (bold headers + fenced code blocks).
 * @param {string} tipo
 * @param {string} comentario
 * @param {{ ruta: string, modal: string }} contexto
 * @returns {string}
 */
export function formatFeedbackGitHub(tipo, comentario, contexto) {
    const { ruta, modal } = contexto || {};
    const r = ruta ?? '(sin ruta)';
    const m = modal ?? '(ninguno)';
    return [
        '**Tipo:**',
        '```',
        tipo,
        '```',
        '**ruta:**',
        '```',
        r,
        '```',
        '**modal:**',
        '```',
        m,
        '```',
        '**Comentario:**',
        '```',
        comentario,
        '```',
    ].join('\n');
}

/**
 * Formats feedback for WhatsApp (bold headers + blockquote lines).
 * @param {string} tipo
 * @param {string} comentario
 * @param {{ ruta: string, modal: string }} contexto
 * @returns {string}
 */
export function formatFeedbackWhatsApp(tipo, comentario, contexto) {
    const { ruta, modal } = contexto || {};
    const r = ruta ?? '(sin ruta)';
    const m = modal ?? '(ninguno)';
    return [
        '*Tipo:*',
        `> ${tipo}`,
        '*ruta:*',
        `> ${r}`,
        '*modal:*',
        `> ${m}`,
        '*Comentario:*',
        `> ${comentario}`,
    ].join('\n');
}

/**
 * Builds the GitHub new-issue URL with prellenado title, body and label.
 * @param {string} tipo
 * @param {string} feedbackText  Full formatted feedback text (body).
 * @returns {string}
 */
export function buildGitHubUrl(tipo, feedbackText) {
    const title = `[Feedback] ${tipo}`;
    const params = new URLSearchParams({
        title,
        body: feedbackText,
        labels: GITHUB_LABEL,
    });
    return `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}`;
}

/**
 * Builds the WhatsApp URL with prellenado text.
 * @param {string} feedbackText  Full formatted feedback text.
 * @returns {string}
 */
export function buildWhatsAppUrl(feedbackText) {
    const encoded = encodeURIComponent(feedbackText);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}
