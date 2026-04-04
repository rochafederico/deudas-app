// src/features/notifications/NotificationService.js
// Web Notifications API for upcoming payment due dates (HU 2.1)

const NOTIFICATION_PERM_KEY = 'nivva_notifications_permission';
const DAYS_AHEAD = 3;

/**
 * Returns true if the browser supports the Notifications API.
 */
export function isNotificationSupported() {
    return typeof Notification !== 'undefined';
}

/**
 * Returns the stored permission preference from localStorage.
 * Possible values: 'granted', 'denied', or null (not decided yet).
 */
export function getStoredPermission() {
    return localStorage.getItem(NOTIFICATION_PERM_KEY);
}

/**
 * Saves the permission preference to localStorage.
 * @param {string} value - 'granted' | 'denied'
 */
export function setStoredPermission(value) {
    localStorage.setItem(NOTIFICATION_PERM_KEY, value);
}

/**
 * Requests notification permission from the browser if not already decided.
 * - If the user previously denied, does not ask again (returns 'denied').
 * - Saves the result to localStorage.
 * @returns {Promise<string>} - The permission status: 'granted', 'denied', or 'default'.
 */
export async function requestPermission() {
    if (!isNotificationSupported()) return 'denied';

    const stored = getStoredPermission();
    // If user previously denied via our app, don't ask again
    if (stored === 'denied') return 'denied';

    // If the browser already has a decision, honour it
    if (Notification.permission === 'granted') {
        setStoredPermission('granted');
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        setStoredPermission('denied');
        return 'denied';
    }

    // Ask the user
    const result = await Notification.requestPermission();
    setStoredPermission(result === 'granted' ? 'granted' : 'denied');
    return result;
}

/**
 * Returns montos (payments) that are unpaid and due within the next `days` days.
 * @param {Array<{acreedor: string, montos: Array}>} deudas
 * @param {number} [days=3]
 * @param {Date} [now=new Date()]
 * @returns {Array<{acreedor: string, monto: number, moneda: string, vencimiento: string}>}
 */
export function getUpcomingPayments(deudas, days = DAYS_AHEAD, now = new Date()) {
    const upcoming = [];
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const limitDate = new Date(todayStart);
    limitDate.setDate(limitDate.getDate() + days);

    for (const deuda of deudas) {
        const montos = deuda.montos || [];
        for (const monto of montos) {
            if (monto.pagado) continue;
            if (!monto.vencimiento) continue;

            const venc = new Date(monto.vencimiento + 'T00:00:00');
            if (venc >= todayStart && venc <= limitDate) {
                upcoming.push({
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
 * Sends a browser notification for a single upcoming payment.
 * @param {{acreedor: string, monto: number, moneda: string, vencimiento: string}} payment
 */
export function sendPaymentNotification(payment) {
    if (!isNotificationSupported() || Notification.permission !== 'granted') return;

    const { acreedor, monto, moneda, vencimiento } = payment;
    const body = `Monto: ${monto.toLocaleString('es-AR')} ${moneda} — Vence: ${vencimiento}`;
    new Notification(`Pago próximo a vencer: ${acreedor}`, {
        body,
        icon: '/favicon.ico'
    });
}

/**
 * Shows an in-app toast alert for an upcoming payment.
 * Used as a fallback when the browser Notifications API is unavailable or denied
 * (e.g. iOS Safari, or when the user has not granted permission).
 * @param {{acreedor: string, monto: number, moneda: string, vencimiento: string}} payment
 */
export function showInAppNotification(payment) {
    if (typeof window === 'undefined') return;
    const { acreedor, monto, moneda, vencimiento } = payment;
    const message = `⚠️ Pago próximo a vencer: ${acreedor} — Monto: ${monto.toLocaleString('es-AR')} ${moneda} — Vence: ${vencimiento}`;
    window.dispatchEvent(new CustomEvent('app:notify', {
        detail: { message, type: 'warning' }
    }));
}

/**
 * Main entry point: requests permission and notifies the user about upcoming payments.
 * Falls back to in-app toasts when the browser Notifications API is unavailable or
 * the user has not granted permission (e.g. iOS Safari).
 * Should be called when the app loads or becomes visible.
 * @param {Array} deudas - List of debts from the repository.
 */
export async function checkAndNotify(deudas) {
    const payments = getUpcomingPayments(deudas);

    if (!isNotificationSupported()) {
        payments.forEach(showInAppNotification);
        return;
    }

    const permission = await requestPermission();
    if (permission !== 'granted') {
        payments.forEach(showInAppNotification);
        return;
    }

    payments.forEach(sendPaymentNotification);
}
