// src/features/notifications/paymentNotificationService.js
// Business logic: payment filtering, native notification dispatch, orchestration

import { DAYS_AHEAD, MAX_INDIVIDUAL_NOTIFICATIONS } from './config/notificationConfig.js';
import { isNotificationSupported, requestPermission } from './notificationPermissions.js';
import { formatDate, formatRelativeDate, showInAppPanel } from './paymentNotificationUI.js';

/**
 * Returns montos that are unpaid and due within the next `days` days.
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
            if (venc >= todayStart && venc <= limitDate) {
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
 * Sends a native browser notification for a single upcoming payment.
 * @param {{acreedor: string, monto: number, moneda: string, vencimiento: string}} payment
 * @param {Date} [now=new Date()]
 */
export function sendPaymentNotification(payment, now = new Date()) {
    if (!isNotificationSupported() || Notification.permission !== 'granted') return;
    const { acreedor, monto, moneda, vencimiento } = payment;
    const body = `💰 ${moneda} ${monto.toLocaleString('es-AR')} · 📅 Vence ${formatRelativeDate(vencimiento, now)} (${formatDate(vencimiento)})`;
    new Notification(`⚠️ Próximo vencimiento: ${acreedor}`, { body, icon: '/favicon.ico' });
}

/**
 * Sends a single grouped browser notification summarising all upcoming payments.
 * Used when there are more than MAX_INDIVIDUAL_NOTIFICATIONS payments due.
 * @param {number} count - Number of upcoming payments.
 */
export function sendGroupedNotification(count) {
    if (!isNotificationSupported() || Notification.permission !== 'granted') return;
    const n = new Notification('Pagos próximos a vencer', {
        body: `Tenés ${count} pagos próximos a vencer en los próximos 3 días. Abrí la app para ver el detalle.`,
        icon: '/favicon.ico'
    });
    n.onclick = () => window.focus();
}

/**
 * Main entry point: shows the in-app panel and, when permitted, sends native
 * browser notifications (individual or grouped).
 * @param {Array} deudas - List of debts from the repository.
 */
export async function checkAndNotify(deudas) {
    const now = new Date();
    const payments = getUpcomingPayments(deudas, DAYS_AHEAD, now);
    if (payments.length === 0) return;

    showInAppPanel(payments, now);

    if (!isNotificationSupported()) return;

    const permission = await requestPermission();
    if (permission !== 'granted') return;

    payments.length > MAX_INDIVIDUAL_NOTIFICATIONS
        ? sendGroupedNotification(payments.length)
        : payments.forEach(p => sendPaymentNotification(p, now));
}
