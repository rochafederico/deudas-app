import { assert } from './setup.js';
import { getDB } from '../src/shared/database/initDB.js';
import { ANALYTICS_EVENTS_STORE } from '../src/shared/database/schema.js';
import {
    trackEvent,
    trackFlowStart,
    trackFlowComplete,
    trackFlowError,
    trackFlowAbandoned,
    listAnalyticsEvents,
    getAnalyticsUsageSummary
} from '../src/shared/analytics/analytics.service.js';
import '../src/features/deudas/components/DebtForm.js';
import '../src/features/import-export/components/ImportDataModal.js';
import '../src/layout/MonthSelector.js';

function clearAnalyticsStore() {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const tx = db.transaction(ANALYTICS_EVENTS_STORE, 'readwrite');
        const store = tx.objectStore(ANALYTICS_EVENTS_STORE);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = (event) => reject(event);
    });
}

async function cleanup() {
    await clearAnalyticsStore();
    window.localStorage?.removeItem('analytics:pending-events');
    delete window.clarity;
    document.body.innerHTML = '';
}

function waitForAnalytics() {
    return new Promise((resolve) => setTimeout(resolve, 25));
}

async function testTrackEventPersistsDeviceAndClarity() {
    console.log('  UC1: analytics service persiste eventos y envia a Clarity');
    await cleanup();
    const clarityCalls = [];
    window.innerWidth = 480;
    window.clarity = (...args) => clarityCalls.push(args);

    await trackEvent('shortcut_used', {
        flow: 'shortcut',
        status: 'completed',
        shortcut: 'tour',
        location: 'header'
    });
    await waitForAnalytics();

    const events = await listAnalyticsEvents();
    assert(events.length === 1, 'Debe persistir 1 evento analitico');
    assert(events[0].eventName === 'shortcut_used', 'Debe guardar el nombre del evento');
    assert(events[0].device === 'mobile', 'Debe detectar dispositivo mobile');
    assert(clarityCalls.length === 1, 'Debe enviar el evento a Clarity');
    assert(clarityCalls[0][0] === 'event' && clarityCalls[0][1] === 'shortcut_used', 'Clarity debe recibir el nombre del evento');
}

async function testFlowTrackingAndSummary() {
    console.log('  UC2: analytics service resume uso y friccion por flujo');
    await cleanup();

    await trackFlowStart('create_debt', { step: 'modal_open' });
    await trackFlowError('create_debt', { step: 'submit', errors: { acreedor: 'Requerido' } });
    await trackFlowAbandoned('create_debt', 'submit', { reason: 'cancel' });
    await trackFlowStart('tour', { step: 'bienvenida' });
    await trackFlowComplete('tour', { step: 'privacidad' });
    await waitForAnalytics();

    const summary = await getAnalyticsUsageSummary();
    const createDebt = summary.frictionByFlow.find((flow) => flow.flow === 'create_debt');
    const tour = summary.frictionByFlow.find((flow) => flow.flow === 'tour');

    assert(summary.totalEvents === 5, 'Debe contabilizar todos los eventos del flujo');
    assert(createDebt.validation_error === 1, 'Debe contar errores de validacion');
    assert(createDebt.abandoned === 1, 'Debe contar abandonos');
    assert(tour.completed === 1, 'Debe contar completados');
}

async function testDebtFormTracksValidationAndCompletion() {
    console.log('  UC3: DebtForm registra inicio, error y completado');
    await cleanup();

    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    form.startAnalyticsFlow('create_debt', { step: 'modal_open' });
    form.querySelector('[name="acreedor"]').dispatchEvent(new Event('input', { bubbles: true }));
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Banco Test', tipoDeuda: 'Tarjeta', notas: '' }
    });
    await waitForAnalytics();

    form.montos = [{ monto: 1000, moneda: 'ARS', vencimiento: '2026-06-10', pagado: false }];
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Banco Test', tipoDeuda: 'Tarjeta', notas: '' }
    });

    const events = await listAnalyticsEvents();
    const names = events.map((event) => event.eventName);
    assert(names.includes('create_debt_started'), 'Debe registrar inicio del flujo de crear deuda');
    assert(names.includes('create_debt_validation_error'), 'Debe registrar error de validacion si faltan montos');
    assert(names.includes('create_debt_completed'), 'Debe registrar completado al guardar');
}

async function testImportAndMonthNavigationTracking() {
    console.log('  UC4: importacion y navegacion mensual registran eventos');
    await cleanup();

    const modal = document.createElement('import-data-modal');
    document.body.appendChild(modal);
    modal.open();
    modal.selectFile();
    await modal.close();

    const selector = document.createElement('month-selector');
    document.body.appendChild(selector);
    selector.querySelector('#ms-next').click();
    await waitForAnalytics();

    const events = await listAnalyticsEvents();
    const names = events.map((event) => event.eventName);
    assert(names.includes('import_data_started'), 'Debe registrar inicio de importacion');
    assert(names.includes('import_data_abandoned'), 'Debe registrar abandono de importacion');
    assert(names.includes('month_navigation_used'), 'Debe registrar navegacion mensual');
}

export const tests = [
    testTrackEventPersistsDeviceAndClarity,
    testFlowTrackingAndSummary,
    testDebtFormTracksValidationAndCompletion,
    testImportAndMonthNavigationTracking,
];
