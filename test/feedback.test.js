// test/feedback.test.js
// Unit tests for HU 6.6 — Feedback feature
// Tests: text formatter, GitHub URL builder, WhatsApp URL builder, context helper, validation.

import { assert } from './setup.js';
import {
    formatFeedbackGitHub,
    formatFeedbackWhatsApp,
    buildGitHubUrl,
    buildWhatsAppUrl,
    validateFeedback,
} from '../src/features/feedback/feedbackService.js';

// Register FeedbackFab / FeedbackModal in happy-dom for DOM tests
import '../src/features/feedback/FeedbackFab.js';

export const tests = [

    // --- formatFeedbackGitHub ---
    async function formatFeedbackGitHub_markdownStructure() {
        console.log('  formatFeedbackGitHub: uses bold headers and fenced code blocks');
        const text = formatFeedbackGitHub('sugerencia', 'Mejorar el menú', { ruta: '/gastos', modal: 'ninguno' });
        assert(text.includes('**Tipo:**'), 'Debe incluir header Tipo en negrita');
        assert(text.includes('**Comentario:**'), 'Debe incluir header Comentario en negrita');
        assert(text.includes('**ruta:**'), 'Debe incluir header ruta en negrita');
        assert(text.includes('**modal:**'), 'Debe incluir header modal en negrita');
        assert(text.includes('```'), 'Debe incluir bloques de código');
        assert(text.includes('sugerencia'), 'Debe incluir el valor del tipo');
        assert(text.includes('Mejorar el menú'), 'Debe incluir el comentario');
    },

    async function formatFeedbackGitHub_fallbacks() {
        console.log('  formatFeedbackGitHub: fallbacks when context is missing');
        const text = formatFeedbackGitHub('problema', 'Error', null);
        assert(text.includes('(sin ruta)'), 'ruta debe tener fallback');
        assert(text.includes('(ninguno)'), 'modal debe tener fallback');
    },

    // --- formatFeedbackWhatsApp ---
    async function formatFeedbackWhatsApp_boldAndBlockquote() {
        console.log('  formatFeedbackWhatsApp: uses WhatsApp bold and blockquote');
        const text = formatFeedbackWhatsApp('problema', 'No funciona', { ruta: '/', modal: 'Editar deuda' });
        assert(text.includes('*Tipo:*'), 'Debe incluir header Tipo en formato WhatsApp');
        assert(text.includes('*Comentario:*'), 'Debe incluir header Comentario en formato WhatsApp');
        assert(text.includes('*ruta:*'), 'Debe incluir header ruta en formato WhatsApp');
        assert(text.includes('*modal:*'), 'Debe incluir header modal en formato WhatsApp');
        assert(text.includes('> problema'), 'Tipo debe ir como blockquote');
        assert(text.includes('> No funciona'), 'Comentario debe ir como blockquote');
        assert(text.includes('> /'), 'ruta debe ir como blockquote');
    },

    async function formatFeedbackWhatsApp_fallbacks() {
        console.log('  formatFeedbackWhatsApp: fallbacks when context is missing');
        const text = formatFeedbackWhatsApp('confusión', 'No entiendo', {});
        assert(text.includes('> (sin ruta)'), 'ruta debe tener fallback como blockquote');
        assert(text.includes('> (ninguno)'), 'modal debe tener fallback como blockquote');
    },

    // --- buildGitHubUrl ---
    async function buildGitHubUrl_containsRepoAndTitle() {
        console.log('  buildGitHubUrl: contains repo path and title');
        const feedbackText = 'Tipo: sugerencia\nComentario: Comentario test\nruta: /ingresos\nmodal: (ninguno)';
        const url = buildGitHubUrl('sugerencia', feedbackText);
        assert(url.includes('github.com/rochafederico/deudas-app/issues/new'), 'URL apunta al repo correcto');
        assert(url.includes('title='), 'URL contiene title');
        assert(url.includes('%5BFeedback%5D'), 'El título incluye [Feedback] codificado');
    },

    async function buildGitHubUrl_containsLabel() {
        console.log('  buildGitHubUrl: contains the label parameter');
        const url = buildGitHubUrl('problema', 'texto');
        assert(url.includes('labels='), 'URL contiene labels');
        // Label "💬 feedback" should be encoded
        assert(url.includes('feedback'), 'URL contiene el label feedback');
    },

    async function buildGitHubUrl_bodyContainsFeedbackText() {
        console.log('  buildGitHubUrl: body param contains encoded feedback text');
        const feedbackText = 'Tipo: problema\nComentario: test';
        const url = buildGitHubUrl('problema', feedbackText);
        assert(url.includes('body='), 'URL contiene body');
        // URLSearchParams encodes spaces as '+', so check for the ':' encoding
        assert(url.includes('Tipo') && url.includes('problema'), 'body contiene el texto de feedback');
    },

    // --- buildWhatsAppUrl ---
    async function buildWhatsAppUrl_containsNumber() {
        console.log('  buildWhatsAppUrl: contains the target phone number');
        const url = buildWhatsAppUrl('texto de prueba');
        assert(url.includes('wa.me/5491128382383'), 'URL apunta al número correcto');
    },

    async function buildWhatsAppUrl_containsEncodedText() {
        console.log('  buildWhatsAppUrl: text is URL-encoded in the query string');
        const url = buildWhatsAppUrl('Tipo: sugerencia\nComentario: algo');
        assert(url.includes('text='), 'URL contiene param text');
        assert(url.includes(encodeURIComponent('Tipo: sugerencia')), 'texto está codificado');
    },

    // --- validateFeedback ---
    async function validateFeedback_validInputPasses() {
        console.log('  validateFeedback: valid input passes');
        const { valid, errors } = validateFeedback('sugerencia', 'Un comentario válido');
        assert(valid === true, 'Debe ser válido con tipo y comentario correctos');
        assert(Object.keys(errors).length === 0, 'No debe haber errores');
    },

    async function validateFeedback_missingTipoFails() {
        console.log('  validateFeedback: missing tipo fails');
        const { valid, errors } = validateFeedback('', 'Comentario');
        assert(valid === false, 'Debe fallar sin tipo');
        assert(typeof errors.tipo === 'string' && errors.tipo.length > 0, 'Debe tener error de tipo');
    },

    async function validateFeedback_invalidTipoFails() {
        console.log('  validateFeedback: invalid tipo fails');
        const { valid, errors } = validateFeedback('otro', 'Comentario');
        assert(valid === false, 'Debe fallar con tipo inválido');
        assert(typeof errors.tipo === 'string', 'Debe tener error de tipo');
    },

    async function validateFeedback_missingComentarioFails() {
        console.log('  validateFeedback: missing comentario fails');
        const { valid, errors } = validateFeedback('problema', '');
        assert(valid === false, 'Debe fallar sin comentario');
        assert(typeof errors.comentario === 'string' && errors.comentario.length > 0, 'Debe tener error de comentario');
    },

    async function validateFeedback_whitespaceOnlyComentarioFails() {
        console.log('  validateFeedback: whitespace-only comentario fails');
        const { valid, errors } = validateFeedback('confusión', '   ');
        assert(valid === false, 'Debe fallar con comentario solo espacios');
        assert(typeof errors.comentario === 'string', 'Debe tener error de comentario');
    },

    async function validateFeedback_comentarioTooLongFails() {
        console.log('  validateFeedback: comentario exceeding max length fails');
        const long = 'a'.repeat(1001);
        const { valid, errors } = validateFeedback('sugerencia', long);
        assert(valid === false, 'Debe fallar con comentario demasiado largo');
        assert(typeof errors.comentario === 'string', 'Debe tener error de comentario');
    },

    async function validateFeedback_exactMaxLengthPasses() {
        console.log('  validateFeedback: comentario of exactly 1000 chars passes');
        const exact = 'a'.repeat(1000);
        const { valid } = validateFeedback('sugerencia', exact);
        assert(valid === true, 'Debe pasar con exactamente 1000 caracteres');
    },

    async function validateFeedback_allThreeTiposAreValid() {
        console.log('  validateFeedback: all three tipos are accepted');
        for (const tipo of ['sugerencia', 'problema', 'confusión']) {
            const { valid } = validateFeedback(tipo, 'Comentario');
            assert(valid === true, `Tipo "${tipo}" debe ser válido`);
        }
    },

    // --- FeedbackFab / FeedbackModal DOM ---
    async function feedbackFab_rendersButton() {
        console.log('  FeedbackFab: renders the FAB button');
        const fab = document.createElement('feedback-fab');
        document.body.appendChild(fab);
        const btn = fab.querySelector('#feedback-fab-btn');
        assert(btn !== null, 'Debe existir el botón FAB');
        assert(btn.classList.contains('btn'), 'El FAB debe usar clase Bootstrap btn');
        assert(btn.classList.contains('rounded-circle'), 'El FAB debe ser circular con rounded-circle');
        assert(btn.classList.contains('btn-outline-primary'), 'El FAB debe usar btn-outline-primary');
        document.body.removeChild(fab);
    },

    async function feedbackModal_rendersForm() {
        console.log('  FeedbackModal: renders form fields');
        const modal = document.createElement('feedback-modal');
        document.body.appendChild(modal);
        modal.render();
        assert(modal._tipoEl !== null && modal._tipoEl !== undefined, 'Debe existir referencia _tipoEl');
        assert(modal._comentarioEl !== null && modal._comentarioEl !== undefined, 'Debe existir referencia _comentarioEl');
        const alert = modal.querySelector('.alert.alert-warning');
        assert(alert !== null, 'Debe existir bloque alert-warning con los avisos');
        document.body.removeChild(modal);
    },

    async function feedbackModal_sendButtonDisabledInitially() {
        console.log('  FeedbackModal: send button is disabled when form is empty');
        const modal = document.createElement('feedback-modal');
        document.body.appendChild(modal);
        modal.render();
        const sendBtn = modal._sendBtn;
        assert(sendBtn !== null && sendBtn !== undefined, 'Debe existir el botón Enviar');
        assert(sendBtn.disabled || sendBtn.hasAttribute('disabled'), 'Botón Enviar debe estar desactivado al inicio');
        document.body.removeChild(modal);
    },

    async function feedbackModal_sendButtonEnabledWhenValid() {
        console.log('  FeedbackModal: send button enabled when tipo and comentario are filled');
        const modal = document.createElement('feedback-modal');
        document.body.appendChild(modal);
        modal.render();

        modal._tipoEl.value = 'sugerencia';
        modal._comentarioEl.value = 'Un comentario válido';

        // Simulate change/input events to trigger live update
        modal._tipoEl.dispatchEvent(new Event('change'));
        modal._comentarioEl.dispatchEvent(new Event('input'));

        assert(!modal._sendBtn.disabled && !modal._sendBtn.hasAttribute('disabled'), 'Botón Enviar debe estar activado con formulario válido');
        document.body.removeChild(modal);
    },

    async function feedbackModal_linksUpdatedLive() {
        console.log('  FeedbackModal: dropdown links are updated live with valid form');
        const modal = document.createElement('feedback-modal');
        document.body.appendChild(modal);
        modal.render();

        modal._tipoEl.value = 'problema';
        modal._comentarioEl.value = 'Algo no funciona';

        modal._tipoEl.dispatchEvent(new Event('change'));
        modal._comentarioEl.dispatchEvent(new Event('input'));

        assert(modal._githubLinkEl.href && modal._githubLinkEl.href !== '#', 'GitHub link debe tener URL generada');
        assert(modal._githubLinkEl.href.includes('github.com'), 'GitHub link debe apuntar a GitHub');
        assert(modal._whatsappLinkEl.href && modal._whatsappLinkEl.href !== '#', 'WhatsApp link debe tener URL generada');
        assert(modal._whatsappLinkEl.href.includes('wa.me'), 'WhatsApp link debe apuntar a wa.me');
        document.body.removeChild(modal);
    },

];
