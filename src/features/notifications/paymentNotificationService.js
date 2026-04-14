// src/features/notifications/paymentNotificationService.js
// Business logic: payment filtering, native notification dispatch, orchestration

import { DAYS_AHEAD, MAX_INDIVIDUAL_NOTIFICATIONS, NOTIFIED_PAYMENTS_KEY } from './config/notificationConfig.js';
import { isNotificationSupported, requestPermission } from './notificationPermissions.js';
import { formatDate, formatRelativeDate, showInAppPanel } from './paymentNotificationUI.js';

// ── localStorage deduplication ────────────────────────────────────────────────

function paymentKey(p) {
    return p.deudaId != null
        ? `${p.deudaId}-${p.vencimiento}`
        : `${p.acreedor}-${p.monto}-${p.moneda}-${p.vencimiento}`;
}

function getNotifiedKeys() {
    try {
        return new Set(JSON.parse(localStorage.getItem(NOTIFIED_PAYMENTS_KEY) || '[]'));
    } catch {
        return new Set();
    }
}

function saveNotifiedKeys(payments) {
    try {
        localStorage.setItem(NOTIFIED_PAYMENTS_KEY, JSON.stringify(payments.map(paymentKey)));
    } catch {
        // localStorage not available (e.g. private browsing quota exceeded) — ignore
    }
}

/**
 * Checks whether a payment date belongs to the same month and year as `now`.
 * @param {Date} paymentDate
 * @param {Date} now
 * @returns {boolean}
 */
function isSameMonth(paymentDate, now) {
    return paymentDate.getFullYear() === now.getFullYear() && paymentDate.getMonth() === now.getMonth();
}

/**
 * Checks whether a payment date is before today's date.
 * @param {string} dueDate
 * @param {Date} now
 * @returns {boolean}
 */
function isOverdue(dueDate, now) {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const paymentDate = new Date(dueDate + 'T00:00:00');
    return paymentDate < todayStart;
}

/**
 * Returns montos that are unpaid and either overdue in the current month or
 * due within the next `days` days.
 * @param {Array<{id?: number, acreedor: string, montos: Array}>} deudas
 * @param {number} [days=DAYS_AHEAD]
 * @param {Date} [now=new Date()]
 * @returns {Array<{deudaId?: number, acreedor: string, monto: number, moneda: string, vencimiento: string}>}
 */
export function getUpcomingPayments(deudas, days = DAYS_AHEAD, now = new Date()) {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const limitDate = new Date(todayStart);
    limitDate.setDate(limitDate.getDate() + days);
    const upcoming = [];

    for (const deuda of deudas) {
        for (const monto of (deuda.montos || [])) {
            if (monto.pagado || !monto.vencimiento) continue;
            const venc = new Date(monto.vencimiento + 'T00:00:00');
            const isOverdueThisMonth = venc < todayStart && isSameMonth(venc, todayStart);
            const isUpcoming = venc >= todayStart && venc <= limitDate;
            if (isOverdueThisMonth || isUpcoming) {
                upcoming.push({
                    deudaId: deuda.id,
                    acreedor: deuda.acreedor,
                    monto: monto.monto,
                    moneda: monto.moneda || 'ARS',
                    vencimiento: monto.vencimiento
                });
            }
        }
    }

    return upcoming;
}

/**
 * Sends a native browser notification for a single payment.
 * @param {{acreedor: string, monto: number, moneda: string, vencimiento: string}} payment
 * @param {Date} [now=new Date()]
 */
export function sendPaymentNotification(payment, now = new Date()) {
    if (!isNotificationSupported() || Notification.permission !== 'granted') return;
    const { acreedor, monto, moneda, vencimiento } = payment;
    const overdue = isOverdue(vencimiento, now);
    const verb = overdue ? 'Venció' : 'Vence';
    const title = overdue ? `⚠️ Vencimiento pendiente: ${acreedor}` : `⚠️ Próximo vencimiento: ${acreedor}`;
    const body = `💰 ${moneda} ${monto.toLocaleString('es-AR')} · 📅 ${verb} ${formatRelativeDate(vencimiento, now)} (${formatDate(vencimiento)})`;
    new Notification(title, { body, icon: '/favicon.ico' });
}

/**
 * Sends a single grouped browser notification summarising all pending payments.
 * Used when there are more than MAX_INDIVIDUAL_NOTIFICATIONS payments due.
 * @param {number} count - Number of pending payments.
 */
export function sendGroupedNotification(count) {
    if (!isNotificationSupported() || Notification.permission !== 'granted') return;
    const n = new Notification('Pagos vencidos o por vencer', {
        body: `Tenés ${count} pagos vencidos o por vencer. Abrí la app para ver el detalle.`,
        icon: '/favicon.ico'
    });
    n.onclick = () => window.focus();
}

/**
 * Main entry point: shows the in-app panel and, when permitted, sends native
 * browser notifications (individual or grouped).
 * Only shows the panel when there are new upcoming payments not previously notified.
 * When new payments are detected, re-shows all upcoming payments and updates the
 * stored set so future calls skip unless another new payment appears.
 * @param {Array} deudas - List of debts from the repository.
 * @param {Date} [now=new Date()] - Reference date (injectable for testing).
 */
export async function checkAndNotify(deudas, now = new Date()) {
    const payments = getUpcomingPayments(deudas, DAYS_AHEAD, now);

    // Always update the in-app panel so the bell popover is always initialized
    showInAppPanel(payments, now);

    if (payments.length === 0) return;

    const notifiedKeys = getNotifiedKeys();
    const hasNew = payments.some(p => !notifiedKeys.has(paymentKey(p)));
    if (!hasNew) return;

    saveNotifiedKeys(payments);

    if (!isNotificationSupported()) return;

    const permission = await requestPermission();
    if (permission !== 'granted') return;

    payments.length > MAX_INDIVIDUAL_NOTIFICATIONS
        ? sendGroupedNotification(payments.length)
        : payments.forEach(p => sendPaymentNotification(p, now));
}
