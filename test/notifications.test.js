// test/notifications.test.js
// Tests for HU 2.1: NotificationService – upcoming payment notifications
import { assert } from './setup.js';
import {
    getUpcomingPayments,
    isNotificationSupported,
    getStoredPermission,
    setStoredPermission,
    requestPermission,
    checkAndNotify,
    showInAppNotification,
    showGroupedInAppNotification,
    formatDate,
    formatRelativeDate,
    buildUpcomingPaymentsHTML,
    showInAppPanel
} from '../src/features/notifications/NotificationService.js';

function localDate(year, month, day) {
    return new Date(year, month - 1, day, 12, 0, 0);
}

// ===================================================================
// UC1: getUpcomingPayments – filters payments due in the next 3 days and overdue in current month
// ===================================================================
async function testGetUpcomingPayments() {
    console.log('  UC1: getUpcomingPayments returns upcoming payments plus overdue payments in the current month');

    const now = localDate(2026, 4, 3);

    const deudas = [
        {
            acreedor: 'Banco A',
            montos: [
                { monto: 1000, moneda: 'ARS', vencimiento: '2026-04-03', pagado: false }, // today
                { monto: 2000, moneda: 'ARS', vencimiento: '2026-04-05', pagado: false }, // 2 days ahead
                { monto: 3000, moneda: 'ARS', vencimiento: '2026-04-06', pagado: false }, // 3 days ahead (limit)
                { monto: 4000, moneda: 'ARS', vencimiento: '2026-04-07', pagado: false }, // 4 days ahead (out)
                { monto: 5000, moneda: 'ARS', vencimiento: '2026-04-03', pagado: true },  // paid (excluded)
                { monto: 6000, moneda: 'ARS', vencimiento: '2026-04-02', pagado: false }, // overdue this month (included)
                { monto: 7000, moneda: 'ARS', vencimiento: '2026-03-31', pagado: false }, // past previous month (excluded)
            ]
        },
        {
            acreedor: 'Banco B',
            montos: [
                { monto: 100, moneda: 'USD', vencimiento: '2026-04-04', pagado: false } // 1 day ahead
            ]
        }
    ];

    const upcoming = getUpcomingPayments(deudas, 3, now);

    assert(upcoming.length === 5, `Debe haber 5 pagos a considerar, encontrados: ${upcoming.length}`);
    assert(upcoming.some(p => p.monto === 1000), 'Incluye pago de hoy');
    assert(upcoming.some(p => p.monto === 2000), 'Incluye pago en 2 días');
    assert(upcoming.some(p => p.monto === 3000), 'Incluye pago en 3 días (límite)');
    assert(upcoming.some(p => p.monto === 100 && p.moneda === 'USD'), 'Incluye pago USD');
    assert(upcoming.some(p => p.monto === 6000), 'Incluye pago vencido del mes actual');
    assert(!upcoming.some(p => p.monto === 4000), 'Excluye pago fuera de rango');
    assert(!upcoming.some(p => p.monto === 5000), 'Excluye pago ya pagado');
    assert(!upcoming.some(p => p.monto === 7000), 'Excluye pago vencido de otro mes');
}

// ===================================================================
// UC2: getUpcomingPayments – correct data shape in results
// ===================================================================
async function testGetUpcomingPaymentsShape() {
    console.log('  UC2: getUpcomingPayments returns correct data shape');

    const now = localDate(2026, 4, 3);
    const deudas = [{
        id: 42,
        acreedor: 'Visa',
        montos: [{ monto: 500, moneda: 'USD', vencimiento: '2026-04-04', pagado: false }]
    }];

    const upcoming = getUpcomingPayments(deudas, 3, now);
    assert(upcoming.length === 1, 'Debe haber 1 pago');

    const p = upcoming[0];
    assert(p.deudaId === 42, 'deudaId correcto');
    assert(p.acreedor === 'Visa', 'acreedor correcto');
    assert(p.monto === 500, 'monto correcto');
    assert(p.moneda === 'USD', 'moneda correcta');
    assert(p.vencimiento === '2026-04-04', 'vencimiento correcto');
}

// ===================================================================
// UC3: getUpcomingPayments – empty deudas
// ===================================================================
async function testGetUpcomingPaymentsEmpty() {
    console.log('  UC3: getUpcomingPayments returns empty array for no deudas');

    const now = localDate(2026, 4, 3);
    const upcoming = getUpcomingPayments([], 3, now);
    assert(upcoming.length === 0, 'Sin deudas: lista vacía');
}

// ===================================================================
// UC4: localStorage permission management
// ===================================================================
async function testStoredPermission() {
    console.log('  UC4: getStoredPermission / setStoredPermission use localStorage');

    localStorage.removeItem('nivva_notifications_permission');
    assert(getStoredPermission() === null, 'Permiso no establecido: null');

    setStoredPermission('granted');
    assert(getStoredPermission() === 'granted', 'Permiso guardado: granted');

    setStoredPermission('denied');
    assert(getStoredPermission() === 'denied', 'Permiso guardado: denied');

    // Cleanup
    localStorage.removeItem('nivva_notifications_permission');
}

// ===================================================================
// UC5: requestPermission – skips browser prompt when stored as denied
// ===================================================================
async function testRequestPermissionDeniedSkipsPrompt() {
    console.log('  UC5: requestPermission does not prompt when stored permission is denied');

    localStorage.setItem('nivva_notifications_permission', 'denied');

    let promptCalled = false;
    const originalNotification = global.Notification;

    // Mock Notification with permission=default so the only block that fires is the stored check
    global.Notification = class {
        static get permission() { return 'default'; }
        static requestPermission() {
            promptCalled = true;
            return Promise.resolve('granted');
        }
    };

    const result = await requestPermission();

    assert(result === 'denied', 'Debe retornar denied sin preguntar');
    assert(!promptCalled, 'No debe llamar a requestPermission del navegador');

    // Restore
    global.Notification = originalNotification;
    localStorage.removeItem('nivva_notifications_permission');
}

// ===================================================================
// UC6: checkAndNotify – sends notifications for upcoming payments
// ===================================================================
async function testCheckAndNotifySendsNotifications() {
    console.log('  UC6: checkAndNotify sends notifications when permission granted');

    const now = localDate(2026, 4, 3);
    const notificationsSent = [];

    const originalNotification = global.Notification;

    // Mock Notification API as granted
    global.Notification = class {
        static get permission() { return 'granted'; }
        static requestPermission() { return Promise.resolve('granted'); }
        constructor(title, opts) {
            notificationsSent.push({ title, body: opts?.body });
        }
    };

    localStorage.setItem('nivva_notifications_permission', 'granted');

    const deudas = [{
        acreedor: 'MiCredito',
        montos: [
            { monto: 800, moneda: 'ARS', vencimiento: '2026-04-04', pagado: false },
            { monto: 999, moneda: 'USD', vencimiento: '2026-04-07', pagado: false } // out of range
        ]
    }];

    // Use getUpcomingPayments + sendPaymentNotification directly (avoids async permission)
    const { getUpcomingPayments: gup, sendPaymentNotification: spn } = await import('../src/features/notifications/NotificationService.js');
    const upcoming = gup(deudas, 3, now);
    upcoming.forEach(p => spn(p, now));

    assert(notificationsSent.length === 1, `Debe enviar 1 notificación, enviadas: ${notificationsSent.length}`);
    assert(notificationsSent[0].title.includes('MiCredito'), 'Título incluye acreedor');
    assert(notificationsSent[0].body.includes('ARS'), 'Cuerpo incluye moneda');
    assert(notificationsSent[0].body.includes('04/04/2026'), 'Cuerpo incluye fecha en formato DD/MM/YYYY');

    // Restore
    global.Notification = originalNotification;
    localStorage.removeItem('nivva_notifications_permission');
}

// ===================================================================
// UC6b: sendPaymentNotification – overdue payments use pending wording
// ===================================================================
async function testCheckAndNotifySendsOverdueNotifications() {
    console.log('  UC6b: sendPaymentNotification uses overdue wording when payment is already vencido');

    const now = localDate(2026, 4, 3);
    const notificationsSent = [];

    const originalNotification = global.Notification;

    global.Notification = class {
        static get permission() { return 'granted'; }
        static requestPermission() { return Promise.resolve('granted'); }
        constructor(title, opts) {
            notificationsSent.push({ title, body: opts?.body });
        }
    };

    const { sendPaymentNotification: spn } = await import('../src/features/notifications/NotificationService.js');
    spn({ acreedor: 'MiCredito', monto: 800, moneda: 'ARS', vencimiento: '2026-04-02' }, now);

    assert(notificationsSent.length === 1, 'Debe enviar 1 notificación vencida');
    assert(notificationsSent[0].title === '⚠️ Vencimiento pendiente: MiCredito', 'Título vencido correcto');
    assert(notificationsSent[0].body.includes('Venció ayer'), 'Cuerpo usa copy de pago vencido');

    global.Notification = originalNotification;
}

// ===================================================================
// UC7: checkAndNotify – does nothing when Notification not supported and no payments
// ===================================================================
async function testCheckAndNotifyUnsupported() {
    console.log('  UC7: checkAndNotify does nothing when Notification API is not supported and deudas is empty');

    const originalNotification = global.Notification;
    delete global.Notification;

    assert(!isNotificationSupported(), 'isNotificationSupported debe ser false');

    const events = [];
    const handler = (e) => events.push(e.detail);
    window.addEventListener('app:upcoming-panel', handler);

    // Should not throw
    let threw = false;
    try {
        await checkAndNotify([]);
    } catch {
        threw = true;
    }
    assert(!threw, 'checkAndNotify no debe lanzar error cuando API no está soportada');
    assert(events.length === 0, 'Sin deudas no se despachan eventos app:upcoming-panel');

    window.removeEventListener('app:upcoming-panel', handler);
    global.Notification = originalNotification;
}

// ===================================================================
// UC8: showInAppNotification – dispatches app:notify event as warning
// ===================================================================
async function testShowInAppNotification() {
    console.log('  UC8: showInAppNotification dispatches an app:notify warning event with new visual format');

    const events = [];
    const handler = (e) => events.push(e.detail);
    window.addEventListener('app:notify', handler);

    // Pass a fixed `now` so the relative-date label is deterministic
    showInAppNotification(
        { acreedor: 'Pago Test', monto: 999, moneda: 'ARS', vencimiento: '2026-04-05' },
        localDate(2026, 4, 4)
    );

    assert(events.length === 1, 'Debe despachar 1 evento app:notify');
    assert(events[0].type === 'warning', 'El tipo de toast es warning');
    assert(events[0].message.includes('Pago Test'), 'El mensaje incluye el acreedor');
    assert(events[0].message.includes('ARS'), 'El mensaje incluye la moneda');
    assert(events[0].message.includes('05/04/2026'), 'El mensaje incluye la fecha en formato DD/MM/YYYY');
    assert(events[0].message.includes('mañana'), 'El mensaje incluye la etiqueta relativa de fecha');
    assert(events[0].message.includes('Ver detalle'), 'El mensaje incluye la acción Ver detalle');

    window.removeEventListener('app:notify', handler);
}

// ===================================================================
// UC8b: showInAppNotification – overdue payments use pending wording
// ===================================================================
async function testShowInAppNotificationOverdue() {
    console.log('  UC8b: showInAppNotification uses overdue wording for payments already vencidos');

    const events = [];
    const handler = (e) => events.push(e.detail);
    window.addEventListener('app:notify', handler);

    showInAppNotification(
        { acreedor: 'Pago Vencido', monto: 999, moneda: 'ARS', vencimiento: '2026-04-02' },
        localDate(2026, 4, 3)
    );

    assert(events.length === 1, 'Debe despachar 1 evento app:notify');
    assert(events[0].message.includes('Vencimiento pendiente'), 'El mensaje usa título de vencimiento pendiente');
    assert(events[0].message.includes('Venció ayer'), 'El mensaje usa copy de pago vencido');

    window.removeEventListener('app:notify', handler);
}

// ===================================================================
// UC9: checkAndNotify – sends grouped native notification when >5 payments
// ===================================================================
async function testCheckAndNotifyGroupedNative() {
    console.log('  UC9: checkAndNotify sends one grouped notification when more than 5 payments');

    const notificationsSent = [];

    const originalNotification = global.Notification;

    global.Notification = class {
        static get permission() { return 'granted'; }
        static requestPermission() { return Promise.resolve('granted'); }
        constructor(title, opts) {
            notificationsSent.push({ title, body: opts?.body });
        }
    };

    localStorage.setItem('nivva_notifications_permission', 'granted');

    // Use getUpcomingPayments + sendGroupedNotification directly with a fixed date
    const { getUpcomingPayments: gup, sendGroupedNotification: sgn } = await import('../src/features/notifications/NotificationService.js');
    const now = localDate(2026, 4, 3);
    const montos = Array.from({ length: 6 }, (_, i) => ({
        monto: (i + 1) * 100,
        moneda: 'ARS',
        vencimiento: '2026-04-04',
        pagado: false
    }));
    const deudas = [{ acreedor: 'Banco Test', montos }];
    const upcoming = gup(deudas, 3, now);

    assert(upcoming.length === 6, `Deben haber 6 pagos pendientes, encontrados: ${upcoming.length}`);
    sgn(upcoming.length);

    assert(notificationsSent.length === 1, `Debe enviar 1 notificación agrupada, enviadas: ${notificationsSent.length}`);
    assert(notificationsSent[0].title === 'Pagos vencidos o por vencer', 'Título de notificación agrupada correcto');
    assert(notificationsSent[0].body.includes('6'), 'Cuerpo incluye la cantidad de pagos');
    assert(notificationsSent[0].body.includes('vencidos o por vencer'), 'Cuerpo usa copy consistente con pagos vencidos');

    global.Notification = originalNotification;
    localStorage.removeItem('nivva_notifications_permission');
}

// ===================================================================
// UC10: showGroupedInAppNotification – dispatches app:notify with count and link
// ===================================================================
async function testShowGroupedInAppNotification() {
    console.log('  UC10: showGroupedInAppNotification dispatches a grouped app:notify warning with count and link');

    const events = [];
    const handler = (e) => events.push(e.detail);
    window.addEventListener('app:notify', handler);

    showGroupedInAppNotification(6);

    assert(events.length === 1, 'Debe despachar 1 evento app:notify');
    assert(events[0].type === 'warning', 'El tipo de toast es warning');
    assert(events[0].message.includes('6'), 'El mensaje incluye la cantidad de pagos');
    assert(events[0].message.includes('vencidos o por vencer'), 'El mensaje usa copy consistente con pagos vencidos');
    assert(events[0].message.includes('href="/"'), 'El mensaje incluye un enlace al detalle');

    window.removeEventListener('app:notify', handler);
}

// ===================================================================
// UC11: formatDate y formatRelativeDate – date formatting helpers
// ===================================================================
async function testFormatHelpers() {
    console.log('  UC11: formatDate y formatRelativeDate formatean fechas correctamente');

    // formatDate
    assert(formatDate('2026-04-05') === '05/04/2026', 'formatDate: YYYY-MM-DD → DD/MM/YYYY');
    assert(formatDate('2026-01-01') === '01/01/2026', 'formatDate: maneja mes y día con ceros');

    // formatRelativeDate
    const now = localDate(2026, 4, 3);
    assert(formatRelativeDate('2026-04-03', now) === 'hoy', 'formatRelativeDate: misma fecha → hoy');
    assert(formatRelativeDate('2026-04-04', now) === 'mañana', 'formatRelativeDate: día siguiente → mañana');
    assert(formatRelativeDate('2026-04-06', now) === 'en 3 días', 'formatRelativeDate: 3 días después');
    assert(formatRelativeDate('2026-04-02', now) === 'ayer', 'formatRelativeDate: día previo → ayer');
    assert(formatRelativeDate('2026-04-01', now) === 'hace 2 días', 'formatRelativeDate: días previos del mes');
}

// ===================================================================
// UC12: buildUpcomingPaymentsHTML – groups by overdue/today/tomorrow/rest, truncates rest>5
// ===================================================================
async function testBuildUpcomingPaymentsHTML() {
    console.log('  UC12: buildUpcomingPaymentsHTML groups overdue and upcoming payments and truncates rest list');

    const now = localDate(2026, 4, 3);

    const payments = [
        { acreedor: 'Cable',    monto: 1500,   moneda: 'ARS', vencimiento: '2026-04-02' }, // overdue
        { acreedor: 'Patente',  monto: 2100,   moneda: 'ARS', vencimiento: '2026-03-31' }, // old overdue (excluded)
        { acreedor: 'NaranjaX', monto: 212776, moneda: 'ARS', vencimiento: '2026-04-03' }, // today
        { acreedor: 'Brubank',  monto: 212776, moneda: 'ARS', vencimiento: '2026-04-03' }, // today
        { acreedor: 'Juli',     monto: 598646, moneda: 'ARS', vencimiento: '2026-04-04' }, // tomorrow
        { acreedor: 'Personal', monto: 1000,   moneda: 'ARS', vencimiento: '2026-04-05' }, // rest
        { acreedor: 'Edenor',   monto: 1000,   moneda: 'ARS', vencimiento: '2026-04-05' }, // rest
        { acreedor: 'Netflix',  monto: 1000,   moneda: 'ARS', vencimiento: '2026-04-05' }, // rest
        { acreedor: 'San Lorenzo', monto: 1000, moneda: 'ARS', vencimiento: '2026-04-06' }, // rest
        { acreedor: 'Expensas', monto: 1000,   moneda: 'ARS', vencimiento: '2026-04-06' }, // rest
        { acreedor: 'MercadoPago', monto: 1000, moneda: 'ARS', vencimiento: '2026-04-06' }, // rest (6th → truncated)
    ];

    const { html, todayCount } = buildUpcomingPaymentsHTML(payments, now);

    assert(html.includes('Vencidos del mes'), 'Incluye sección Vencidos del mes');
    assert(html.includes('Cable'), 'Incluye pagos vencidos del mes actual');
    assert(!html.includes('Patente'), 'No incluye pagos vencidos de meses anteriores');

    // Today section
    assert(html.includes('Hoy'), 'Incluye sección Hoy');
    assert(html.includes('NaranjaX'), 'Incluye NaranjaX en Hoy');
    assert(html.includes('Brubank'), 'Incluye Brubank en Hoy');

    // Tomorrow section
    assert(html.includes('Mañana'), 'Incluye sección Mañana');
    assert(html.includes('Juli'), 'Incluye Juli en Mañana');

    // Rest section – 6 items, max 5 shown, "y 1 más"
    assert(html.includes('Próximos días'), 'Incluye sección Próximos días');
    assert(html.includes('Personal'), 'Lista rest incluye Personal');
    assert(html.includes('y 1 más'), 'Trunca con "y 1 más" cuando rest > 5');

    // todayCount reflects the number of payments due today
    assert(todayCount === 2, 'todayCount es 2 (NaranjaX y Brubank vencen hoy)');

    // Totals section – 1 overdue payment (Cable ARS 1500)
    assert(html.includes('1 vencido'), 'Incluye conteo de pagos vencidos');
    assert(html.includes('text-bg-danger'), 'Usa badge Bootstrap text-bg-danger para totales');
    assert(html.includes('1.500'), 'Incluye monto total del vencido en ARS');

    // View link
    assert(html.includes('Ver detalle'), 'Incluye link "Ver detalle"');
    assert(html.includes('data-notif-navigate'), 'El link tiene atributo data-notif-navigate');
    assert(html.includes('href="/"'), 'El link apunta al home /');

    // showInAppPanel dispatches app:upcoming-panel with the html and todayCount
    const events = [];
    const handler = (e) => events.push(e.detail);
    window.addEventListener('app:upcoming-panel', handler);

    showInAppPanel(payments, now);

    assert(events.length === 1, 'showInAppPanel despacha 1 evento app:upcoming-panel');
    assert(typeof events[0].html === 'string', 'El evento incluye html como string');
    assert(events[0].html.includes('NaranjaX'), 'El html del evento incluye datos de los pagos');
    assert(events[0].todayCount === 2, 'El evento incluye todayCount correcto');

    window.removeEventListener('app:upcoming-panel', handler);
}

// ===================================================================
// UC12b: buildUpcomingPaymentsHTML – totales multi-moneda en vencidos
// ===================================================================
async function testBuildUpcomingPaymentsHTMLMultiCurrencyTotals() {
    console.log('  UC12b: buildUpcomingPaymentsHTML muestra totales por moneda para pagos vencidos');

    const now = localDate(2026, 4, 3);

    const payments = [
        { acreedor: 'Banco A', monto: 1000, moneda: 'ARS', vencimiento: '2026-04-01' }, // overdue ARS
        { acreedor: 'Banco B', monto: 2000, moneda: 'ARS', vencimiento: '2026-04-02' }, // overdue ARS
        { acreedor: 'Banco C', monto: 100,  moneda: 'USD', vencimiento: '2026-04-02' }, // overdue USD
        { acreedor: 'Banco D', monto: 500,  moneda: 'ARS', vencimiento: '2026-04-04' }, // upcoming (not overdue)
    ];

    const { html } = buildUpcomingPaymentsHTML(payments, now);

    // Should show "3 vencidos" (2 ARS + 1 USD overdue, upcoming not counted)
    assert(html.includes('3 vencidos'), 'Muestra el conteo correcto de pagos vencidos');
    // ARS total: 1000 + 2000 = 3000
    assert(html.includes('ARS') && html.includes('3.000'), 'Incluye total ARS de vencidos');
    // USD total: 100
    assert(html.includes('USD') && html.includes('100'), 'Incluye total USD de vencidos');
    // Should not include upcoming payment in totals (500 ARS)
    assert(!html.includes('3.500'), 'No suma montos próximos en el total vencido');
}

// ===================================================================
// UC13: checkAndNotify – localStorage deduplication
// ===================================================================
async function testCheckAndNotifyDeduplication() {
    console.log('  UC13: checkAndNotify always shows panel; deduplication only applies to native notifications');

    const NOTIFIED_KEY = 'nivva_notified_payments';
    localStorage.removeItem(NOTIFIED_KEY);

    const panelEvents = [];
    const handler = (e) => panelEvents.push(e.detail);
    window.addEventListener('app:upcoming-panel', handler);

    const originalNotification = global.Notification;
    delete global.Notification; // disable native notifications for this test

    const deuda = {
        id: 1,
        acreedor: 'TestBank',
        montos: [{ monto: 500, moneda: 'ARS', vencimiento: '2026-04-04', pagado: false }]
    };

    const { checkAndNotify: can } = await import('../src/features/notifications/NotificationService.js');

    // First call: new payment → panel should appear
    await can([deuda], localDate(2026, 4, 3));
    assert(panelEvents.length === 1, 'Primera llamada debe mostrar el panel');

    // Second call: same payment (already in localStorage) → panel still updates (always shown)
    await can([deuda], localDate(2026, 4, 3));
    assert(panelEvents.length === 2, 'Segunda llamada actualiza el panel siempre que haya vencimientos');

    // Add a new debt → panel should appear again
    const deuda2 = {
        id: 2,
        acreedor: 'NewBank',
        montos: [{ monto: 300, moneda: 'ARS', vencimiento: '2026-04-04', pagado: false }]
    };
    await can([deuda, deuda2], localDate(2026, 4, 3));
    assert(panelEvents.length === 3, 'Nueva deuda también muestra el panel');

    window.removeEventListener('app:upcoming-panel', handler);
    global.Notification = originalNotification;
    localStorage.removeItem(NOTIFIED_KEY);
}

export const tests = [
    testGetUpcomingPayments,
    testGetUpcomingPaymentsShape,
    testGetUpcomingPaymentsEmpty,
    testStoredPermission,
    testRequestPermissionDeniedSkipsPrompt,
    testCheckAndNotifySendsNotifications,
    testCheckAndNotifySendsOverdueNotifications,
    testCheckAndNotifyUnsupported,
    testShowInAppNotification,
    testShowInAppNotificationOverdue,
    testCheckAndNotifyGroupedNative,
    testShowGroupedInAppNotification,
    testFormatHelpers,
    testBuildUpcomingPaymentsHTML,
    testBuildUpcomingPaymentsHTMLMultiCurrencyTotals,
    testCheckAndNotifyDeduplication
];
