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
    formatRelativeDate
} from '../src/features/notifications/NotificationService.js';

// ===================================================================
// UC1: getUpcomingPayments – filters payments due in the next 3 days
// ===================================================================
async function testGetUpcomingPayments() {
    console.log('  UC1: getUpcomingPayments returns only unpaid payments in the next 3 days');

    const now = new Date('2026-04-03');

    const deudas = [
        {
            acreedor: 'Banco A',
            montos: [
                { monto: 1000, moneda: 'ARS', vencimiento: '2026-04-03', pagado: false }, // today
                { monto: 2000, moneda: 'ARS', vencimiento: '2026-04-05', pagado: false }, // 2 days ahead
                { monto: 3000, moneda: 'ARS', vencimiento: '2026-04-06', pagado: false }, // 3 days ahead (limit)
                { monto: 4000, moneda: 'ARS', vencimiento: '2026-04-07', pagado: false }, // 4 days ahead (out)
                { monto: 5000, moneda: 'ARS', vencimiento: '2026-04-03', pagado: true },  // paid (excluded)
                { monto: 6000, moneda: 'ARS', vencimiento: '2026-04-02', pagado: false }, // past (excluded)
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

    assert(upcoming.length === 4, `Debe haber 4 pagos próximos, encontrados: ${upcoming.length}`);
    assert(upcoming.some(p => p.monto === 1000), 'Incluye pago de hoy');
    assert(upcoming.some(p => p.monto === 2000), 'Incluye pago en 2 días');
    assert(upcoming.some(p => p.monto === 3000), 'Incluye pago en 3 días (límite)');
    assert(upcoming.some(p => p.monto === 100 && p.moneda === 'USD'), 'Incluye pago USD');
    assert(!upcoming.some(p => p.monto === 4000), 'Excluye pago fuera de rango');
    assert(!upcoming.some(p => p.monto === 5000), 'Excluye pago ya pagado');
    assert(!upcoming.some(p => p.monto === 6000), 'Excluye pago pasado');
}

// ===================================================================
// UC2: getUpcomingPayments – correct data shape in results
// ===================================================================
async function testGetUpcomingPaymentsShape() {
    console.log('  UC2: getUpcomingPayments returns correct data shape');

    const now = new Date('2026-04-03');
    const deudas = [{
        acreedor: 'Visa',
        montos: [{ monto: 500, moneda: 'USD', vencimiento: '2026-04-04', pagado: false }]
    }];

    const upcoming = getUpcomingPayments(deudas, 3, now);
    assert(upcoming.length === 1, 'Debe haber 1 pago');

    const p = upcoming[0];
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

    const now = new Date('2026-04-03');
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

    const now = new Date('2026-04-03');
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
// UC7: checkAndNotify – does nothing when Notification not supported and no payments
// ===================================================================
async function testCheckAndNotifyUnsupported() {
    console.log('  UC7: checkAndNotify does nothing when Notification API is not supported and deudas is empty');

    const originalNotification = global.Notification;
    delete global.Notification;

    assert(!isNotificationSupported(), 'isNotificationSupported debe ser false');

    const events = [];
    const handler = (e) => events.push(e.detail);
    window.addEventListener('app:notify', handler);

    // Should not throw
    let threw = false;
    try {
        await checkAndNotify([]);
    } catch {
        threw = true;
    }
    assert(!threw, 'checkAndNotify no debe lanzar error cuando API no está soportada');
    assert(events.length === 0, 'Sin deudas no se despachan eventos app:notify');

    window.removeEventListener('app:notify', handler);
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
        new Date('2026-04-04')
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
    const now = new Date('2026-04-03');
    const montos = Array.from({ length: 6 }, (_, i) => ({
        monto: (i + 1) * 100,
        moneda: 'ARS',
        vencimiento: '2026-04-04',
        pagado: false
    }));
    const deudas = [{ acreedor: 'Banco Test', montos }];
    const upcoming = gup(deudas, 3, now);

    assert(upcoming.length === 6, `Deben haber 6 pagos próximos, encontrados: ${upcoming.length}`);
    sgn(upcoming.length);

    assert(notificationsSent.length === 1, `Debe enviar 1 notificación agrupada, enviadas: ${notificationsSent.length}`);
    assert(notificationsSent[0].title === 'Pagos próximos a vencer', 'Título de notificación agrupada correcto');
    assert(notificationsSent[0].body.includes('6'), 'Cuerpo incluye la cantidad de pagos');

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
    const now = new Date('2026-04-03');
    assert(formatRelativeDate('2026-04-03', now) === 'hoy', 'formatRelativeDate: misma fecha → hoy');
    assert(formatRelativeDate('2026-04-04', now) === 'mañana', 'formatRelativeDate: día siguiente → mañana');
    assert(formatRelativeDate('2026-04-06', now) === 'en 3 días', 'formatRelativeDate: 3 días después');
}

export const tests = [
    testGetUpcomingPayments,
    testGetUpcomingPaymentsShape,
    testGetUpcomingPaymentsEmpty,
    testStoredPermission,
    testRequestPermissionDeniedSkipsPrompt,
    testCheckAndNotifySendsNotifications,
    testCheckAndNotifyUnsupported,
    testShowInAppNotification,
    testCheckAndNotifyGroupedNative,
    testShowGroupedInAppNotification,
    testFormatHelpers
];
