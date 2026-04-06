import { assert } from './setup.js';
import {
    trackEvent,
    trackFlowStart,
    trackFlowComplete,
    trackFlowError,
    trackFlowAbandoned
} from '../src/shared/analytics/clarity.service.js';
import { setPagado, listMontos } from '../src/features/montos/montoRepository.js';
import { addDeuda, deleteDeudas } from '../src/features/deudas/deudaRepository.js';
import '../src/features/deudas/components/DebtForm.js';
import '../src/features/import-export/components/ImportDataModal.js';
import '../src/layout/MonthSelector.js';

async function cleanup() {
    delete window.clarity;
    document.body.innerHTML = '';
    try { await deleteDeudas(); } catch (_error) { /* ignore */ }
}

function readClarityEvents() {
    return window.__clarityEvents || [];
}

function installClarityStub() {
    window.__clarityEvents = [];
    window.clarity = (type, eventName) => {
        window.__clarityEvents.push([type, eventName]);
    };
}

async function testTrackEventSendsDevicePrefixedClarityEvent() {
    console.log('  UC1: clarity service sends device-prefixed events');
    await cleanup();
    installClarityStub();
    window.innerWidth = 480;

    trackEvent('shortcut_used', { shortcut: 'tour' });

    const events = readClarityEvents();
    assert(events.length === 1, 'Should send 1 Clarity event');
    assert(events[0][0] === 'event', 'Clarity should be called with event type');
    assert(events[0][1] === 'mobile_shortcut_used', 'Should prefix event names with the device');
    assert(!events[0][1].includes('tour'), 'Metadata should not alter the Clarity event name');
}

async function testFlowLifecycleSendsExpectedClarityEvents() {
    console.log('  UC2: clarity service sends started, error, abandoned and completed flow events');
    await cleanup();
    installClarityStub();
    window.innerWidth = 1280;

    trackFlowStart('create_debt', { step: 'modal_open' });
    trackFlowError('create_debt', { step: 'submit' });
    trackFlowAbandoned('create_debt', 'submit', { reason: 'cancel' });
    trackFlowStart('tour', { step: 'bienvenida' });
    trackFlowComplete('tour', { step: 'privacidad' });

    const names = readClarityEvents().map(([, eventName]) => eventName);
    assert(names.includes('desktop_create_debt_started'), 'Should send create_debt_started');
    assert(names.includes('desktop_create_debt_validation_error'), 'Should send create_debt_validation_error');
    assert(names.includes('desktop_create_debt_abandoned'), 'Should send create_debt_abandoned');
    assert(names.includes('desktop_tour_started'), 'Should send tour_started');
    assert(names.includes('desktop_tour_completed'), 'Should send tour_completed');
}

async function testDebtFormAndMonthNavigationUseClarityOnly() {
    console.log('  UC3: DebtForm and month navigation emit Clarity events');
    await cleanup();
    installClarityStub();

    const form = document.createElement('debt-form');
    document.body.appendChild(form);
    form.startAnalyticsFlow('create_debt', { step: 'modal_open' });
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Banco Test', tipoDeuda: 'Tarjeta', notas: '' }
    });

    form.montos = [{ monto: 1000, moneda: 'ARS', vencimiento: '2026-06-10', pagado: false }];
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Banco Test', tipoDeuda: 'Tarjeta', notas: '' }
    });

    const selector = document.createElement('month-selector');
    document.body.appendChild(selector);
    selector.querySelector('#ms-next').click();

    const names = readClarityEvents().map(([, eventName]) => eventName);
    assert(names.includes('desktop_create_debt_validation_error'), 'DebtForm should send validation_error to Clarity');
    assert(names.includes('desktop_create_debt_completed'), 'DebtForm should send completed to Clarity');
    assert(names.includes('desktop_monthly_navigation_used'), 'Month selector should send desktop_monthly_navigation_used');
}

async function testImportFlowAndPaymentErrorsSendClarityEvents() {
    console.log('  UC4: import flow and payment errors emit Clarity events');
    await cleanup();
    installClarityStub();

    const modal = document.createElement('import-data-modal');
    document.body.appendChild(modal);
    modal.open();
    modal.selectFile();
    await modal.close();

    let paymentFailed = false;
    try {
        await setPagado(999999, true);
    } catch (_error) {
        paymentFailed = true;
    }

    assert(paymentFailed, 'Payment update with missing monto should fail');

    const names = readClarityEvents().map(([, eventName]) => eventName);
    assert(names.includes('desktop_import_data_started'), 'Import flow should send started event');
    assert(names.includes('desktop_import_data_abandoned'), 'Import flow should send abandoned event');
    assert(names.includes('desktop_payment_validation_error'), 'Payment failures should send payment_validation_error');
}

async function testImportSuccessAndPaymentRegistrationSendClarityEvents() {
    console.log('  UC5: import success and payment registration emit Clarity events');
    await cleanup();
    installClarityStub();

    const deudaId = await addDeuda({
        acreedor: 'Banco Test',
        tipoDeuda: 'Prestamo',
        notas: '',
        montos: [{ monto: 2000, moneda: 'ARS', vencimiento: '2026-06-20', pagado: false }]
    });
    const [monto] = await listMontos();

    await setPagado(monto.id, true);

    const modal = document.createElement('import-data-modal');
    document.body.appendChild(modal);
    modal.importData = {
        deudas: [{ acreedor: 'Otra deuda', tipoDeuda: 'Servicio', notas: '', montos: [] }],
        ingresos: [],
        inversiones: []
    };
    await modal.importDataToDb();

    const names = readClarityEvents().map(([, eventName]) => eventName);
    assert(deudaId > 0, 'Debt setup should create a debt');
    assert(monto.id > 0, 'Debt setup should create a monto');
    assert(names.includes('desktop_payment_registered'), 'Successful payment should send payment_registered');
    assert(names.includes('desktop_import_data_used'), 'Successful import should send import_data_used');
}

export const tests = [
    testTrackEventSendsDevicePrefixedClarityEvent,
    testFlowLifecycleSendsExpectedClarityEvents,
    testDebtFormAndMonthNavigationUseClarityOnly,
    testImportFlowAndPaymentErrorsSendClarityEvents,
    testImportSuccessAndPaymentRegistrationSendClarityEvents,
];
