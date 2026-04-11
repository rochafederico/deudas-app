// test/feedback.test.js
// Tests for the feedback feature: feedbackService and FeedbackModal component.
import { assert } from './setup.js';
import {
    FEEDBACK_TYPES,
    formatFeedback,
    buildGitHubUrl,
    buildMailtoUrl,
    getScreenLabel,
    savePending,
    getPending,
    clearPending,
} from '../src/features/feedback/feedbackService.js';
import '../src/features/feedback/FeedbackModal.js';

// ===================================================================
// UC1: formatFeedback genera el texto con el formato estándar
// ===================================================================
async function testFormatFeedback() {
    console.log('  UC1: formatFeedback — genera texto con formato estándar');

    const result = formatFeedback({
        type: 'sugerencia',
        comment: 'Sería bueno poder filtrar por categoría',
        screen: 'Egresos',
        url: 'http://localhost/',
        date: '2026-04-11',
    });

    assert(result.includes('**Tipo:** 💡 Sugerencia'), 'formatFeedback incluye tipo con emoji');
    assert(result.includes('**Comentario:**'), 'formatFeedback incluye etiqueta Comentario');
    assert(result.includes('Sería bueno poder filtrar por categoría'), 'formatFeedback incluye el comentario');
    assert(result.includes('**Pantalla:** Egresos'), 'formatFeedback incluye pantalla');
    assert(result.includes('**Fecha:** 2026-04-11'), 'formatFeedback incluye fecha');
    assert(result.includes('**URL:** http://localhost/'), 'formatFeedback incluye URL');
    assert(result.includes('**Versión:**'), 'formatFeedback incluye versión');
}

// ===================================================================
// UC2: formatFeedback — tipo desconocido usa el valor crudo
// ===================================================================
async function testFormatFeedbackUnknownType() {
    console.log('  UC2: formatFeedback — tipo desconocido usa valor crudo');

    const result = formatFeedback({
        type: 'otro',
        comment: 'Test',
        screen: 'Egresos',
        url: '',
        date: '2026-04-11',
    });

    assert(result.includes('**Tipo:** otro'), 'formatFeedback tipo desconocido muestra valor crudo');
    assert(!result.includes('**URL:**'), 'formatFeedback omite URL si está vacía');
}

// ===================================================================
// UC3: getScreenLabel mapea rutas a etiquetas legibles
// ===================================================================
async function testGetScreenLabel() {
    console.log('  UC3: getScreenLabel — mapea rutas a etiquetas legibles');

    assert(getScreenLabel('/') === 'Egresos', 'getScreenLabel / → Egresos');
    assert(getScreenLabel('/ingresos') === 'Ingresos', 'getScreenLabel /ingresos → Ingresos');
    assert(getScreenLabel('/inversiones') === 'Inversiones', 'getScreenLabel /inversiones → Inversiones');
    assert(getScreenLabel('/otra') === '/otra', 'getScreenLabel ruta desconocida devuelve el pathname');
}

// ===================================================================
// UC4: buildGitHubUrl genera URL correcta para abrir issue en GitHub
// ===================================================================
async function testBuildGitHubUrl() {
    console.log('  UC4: buildGitHubUrl — genera URL para issue en GitHub');

    const url = buildGitHubUrl({
        type: 'problema',
        comment: 'La app se cierra al guardar',
        screen: 'Egresos',
        url: 'http://localhost/',
        date: '2026-04-11',
    });

    assert(url.startsWith('https://github.com/rochafederico/deudas-app/issues/new'), 'buildGitHubUrl apunta al repo correcto');
    assert(url.includes('title='), 'buildGitHubUrl tiene parámetro title');
    assert(url.includes('body='), 'buildGitHubUrl tiene parámetro body');
    assert(url.includes('%5BFeedback%5D') || url.includes('[Feedback]') || url.includes('Feedback'), 'buildGitHubUrl title incluye Feedback');
}

// ===================================================================
// UC5: buildMailtoUrl genera un mailto con asunto y cuerpo prellenados
// ===================================================================
async function testBuildMailtoUrl() {
    console.log('  UC5: buildMailtoUrl — genera mailto con asunto y cuerpo');

    const url = buildMailtoUrl({
        type: 'confusion',
        comment: 'No entiendo cómo agregar una deuda',
        screen: 'Egresos',
        url: 'http://localhost/',
        date: '2026-04-11',
    });

    assert(url.startsWith('mailto:'), 'buildMailtoUrl comienza con mailto:');
    assert(url.includes('subject='), 'buildMailtoUrl tiene subject');
    assert(url.includes('body='), 'buildMailtoUrl tiene body');
    assert(url.includes('Nivva'), 'buildMailtoUrl subject incluye Nivva');
}

// ===================================================================
// UC6: savePending / getPending / clearPending — offline-first en localStorage
// ===================================================================
async function testLocalStoragePending() {
    console.log('  UC6: savePending/getPending/clearPending — offline-first localStorage');

    // Limpiar estado previo
    clearPending();
    assert(getPending().length === 0, 'localStorage vacío al inicio');

    savePending('Feedback texto 1');
    let pending = getPending();
    assert(pending.length === 1, 'savePending guarda 1 feedback');
    assert(pending[0].text === 'Feedback texto 1', 'savePending guarda texto correcto');
    assert(typeof pending[0].savedAt === 'string', 'savePending guarda savedAt como string ISO');

    savePending('Feedback texto 2');
    pending = getPending();
    assert(pending.length === 2, 'savePending acumula 2 feedbacks');

    clearPending();
    assert(getPending().length === 0, 'clearPending elimina todos los feedbacks');
}

// ===================================================================
// UC7: FEEDBACK_TYPES tiene 3 tipos con value y label
// ===================================================================
async function testFeedbackTypesConstant() {
    console.log('  UC7: FEEDBACK_TYPES — contiene 3 tipos con value y label');

    assert(FEEDBACK_TYPES.length === 3, 'FEEDBACK_TYPES tiene 3 elementos');
    assert(FEEDBACK_TYPES.every(t => t.value && t.label), 'Todos los tipos tienen value y label');
    const values = FEEDBACK_TYPES.map(t => t.value);
    assert(values.includes('sugerencia'), 'FEEDBACK_TYPES incluye sugerencia');
    assert(values.includes('problema'), 'FEEDBACK_TYPES incluye problema');
    assert(values.includes('confusion'), 'FEEDBACK_TYPES incluye confusion');
}

// ===================================================================
// UC8: FeedbackModal — renderiza formulario con campos requeridos
// ===================================================================
async function testFeedbackModalRenders() {
    console.log('  UC8: FeedbackModal — renderiza formulario con campos requeridos');

    const modal = document.createElement('feedback-modal');
    document.body.appendChild(modal);
    await new Promise(r => setTimeout(r, 50));

    assert(modal.querySelector('#feedback-form') !== null, 'FeedbackModal tiene #feedback-form');
    assert(modal.querySelector('#feedback-type') !== null, 'FeedbackModal tiene #feedback-type');
    assert(modal.querySelector('#feedback-comment') !== null, 'FeedbackModal tiene #feedback-comment');
    assert(modal.querySelector('#feedback-actions') !== null, 'FeedbackModal tiene #feedback-actions');
    assert(modal.querySelector('#feedback-copy') !== null, 'FeedbackModal tiene #feedback-copy');
    assert(modal.querySelector('#feedback-github') !== null, 'FeedbackModal tiene #feedback-github');
    assert(modal.querySelector('#feedback-email') !== null, 'FeedbackModal tiene #feedback-email');

    // Acciones ocultas por defecto
    const actions = modal.querySelector('#feedback-actions');
    assert(actions.classList.contains('d-none'), 'Sección de acciones está oculta por defecto');

    // Selector de tipo tiene las 3 opciones
    const options = modal.querySelectorAll('#feedback-type option');
    assert(options.length === 3, 'Selector de tipo tiene 3 opciones');

    document.body.removeChild(modal);
}

// ===================================================================
// UC9: FeedbackModal — submit muestra sección de acciones
// ===================================================================
async function testFeedbackModalSubmitShowsActions() {
    console.log('  UC9: FeedbackModal — submit muestra sección de acciones de envío');

    clearPending();

    const modal = document.createElement('feedback-modal');
    document.body.appendChild(modal);
    await new Promise(r => setTimeout(r, 50));

    // Rellenar el formulario
    const typeSelect = modal.querySelector('#feedback-type');
    const commentArea = modal.querySelector('#feedback-comment');
    typeSelect.value = 'problema';
    commentArea.value = 'Algo no funciona bien en la pantalla de egresos';

    // Disparar submit
    const form = modal.querySelector('#feedback-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 50));

    const actions = modal.querySelector('#feedback-actions');
    assert(!actions.classList.contains('d-none'), 'Sección de acciones visible tras submit');

    // Verificar que se guardó en localStorage
    const pending = getPending();
    assert(pending.length >= 1, 'Feedback guardado en localStorage tras submit');
    assert(pending[pending.length - 1].text.includes('Problema'), 'Feedback guardado incluye tipo Problema');

    document.body.removeChild(modal);
    clearPending();
}

// ===================================================================
// UC10: FeedbackModal — submit sin comentario no muestra acciones
// ===================================================================
async function testFeedbackModalSubmitEmptyComment() {
    console.log('  UC10: FeedbackModal — submit sin comentario no muestra acciones');

    const modal = document.createElement('feedback-modal');
    document.body.appendChild(modal);
    await new Promise(r => setTimeout(r, 50));

    // No llenar el comentario
    const form = modal.querySelector('#feedback-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 50));

    const actions = modal.querySelector('#feedback-actions');
    assert(actions.classList.contains('d-none'), 'Acciones permanecen ocultas si el comentario está vacío');

    document.body.removeChild(modal);
}

export const tests = [
    testFormatFeedback,
    testFormatFeedbackUnknownType,
    testGetScreenLabel,
    testBuildGitHubUrl,
    testBuildMailtoUrl,
    testLocalStoragePending,
    testFeedbackTypesConstant,
    testFeedbackModalRenders,
    testFeedbackModalSubmitShowsActions,
    testFeedbackModalSubmitEmptyComment,
];
