// test/feedback.test.js
// Unit tests for HU 6.6 — Feedback feature
// Tests: text formatter, GitHub URL builder, WhatsApp URL builder, context helper, validation.

import { assert } from './setup.js';
import {
    formatFeedback,
    buildGitHubUrl,
    buildWhatsAppUrl,
    validateFeedback,
} from '../src/features/feedback/feedbackService.js';

// Register FeedbackFab / FeedbackModal in happy-dom for DOM tests
import '../src/features/feedback/FeedbackFab.js';

export const tests = [

    // --- formatFeedback ---
    async function formatFeedback_includesAllFields() {
        console.log('  formatFeedback: includes tipo, comentario, ruta, modal');
        const text = formatFeedback('sugerencia', 'Mejorar el menú', { ruta: '/gastos', modal: 'editar deuda' });
        assert(text.includes('Tipo: sugerencia'), 'Debe incluir Tipo');
        assert(text.includes('Comentario: Mejorar el menú'), 'Debe incluir Comentario');
        assert(text.includes('ruta: /gastos'), 'Debe incluir ruta');
        assert(text.includes('modal: editar deuda'), 'Debe incluir modal');
    },

    async function formatFeedback_usesDefaultsWhenContextMissing() {
        console.log('  formatFeedback: uses fallback when context fields are missing');
        const text = formatFeedback('problema', 'Algo falla', {});
        assert(text.includes('ruta: (sin ruta)'), 'ruta debe tener fallback');
        assert(text.includes('modal: (ninguno)'), 'modal debe tener fallback');
    },

    async function formatFeedback_handlesNullContext() {
        console.log('  formatFeedback: handles null/undefined context');
        const text = formatFeedback('confusión', 'No entiendo', null);
        assert(text.includes('ruta: (sin ruta)'), 'ruta debe tener fallback con contexto null');
        assert(text.includes('modal: (ninguno)'), 'modal debe tener fallback con contexto null');
    },

    // --- buildGitHubUrl ---
    async function buildGitHubUrl_containsRepoAndTitle() {
        console.log('  buildGitHubUrl: contains repo path and title');
        const text = formatFeedback('sugerencia', 'Comentario test', { ruta: '/ingresos', modal: '(ninguno)' });
        const url = buildGitHubUrl('sugerencia', text);
        assert(url.includes('github.com/rochafederico/deudas-app/issues/new'), 'URL apunta al repo correcto');
        assert(url.includes('title='), 'URL contiene title');
        assert(url.includes('%5BFeedback%5D'), 'El título incluye [Feedback] codificado');
    },

    async function buildGitHubUrl_containsLabel() {
        console.log('  buildGitHubUrl: contains the label parameter');
        const url = buildGitHubUrl('problema', 'texto');
        assert(url.includes('labels='), 'URL contiene labels');
        // Label "💬 feedbacl" should be encoded
        assert(url.includes('feedbacl'), 'URL contiene el label feedbacl');
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
        document.body.removeChild(fab);
    },

    async function feedbackModal_rendersForm() {
        console.log('  FeedbackModal: renders form fields');
        const modal = document.createElement('feedback-modal');
        document.body.appendChild(modal);
        modal.render();
        const tipoSelect = modal.querySelector('#feedback-tipo');
        const comentario = modal.querySelector('#feedback-comentario');
        assert(tipoSelect !== null, 'Debe existir selector de tipo');
        assert(comentario !== null, 'Debe existir textarea de comentario');
        document.body.removeChild(modal);
    },

];
