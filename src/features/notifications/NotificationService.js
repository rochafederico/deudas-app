// src/features/notifications/NotificationService.js
// Web Notifications API for upcoming payment due dates (HU 2.1)

const NOTIFICATION_PERM_KEY = 'nivva_notifications_permission';
const DAYS_AHEAD = 3;
const MAX_INDIVIDUAL_NOTIFICATIONS = 5;

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
 * Formats an ISO date string (YYYY-MM-DD) as DD/MM/YYYY.
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Returns a human-readable relative label for a vencimiento date.
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @param {Date} [now=new Date()]
 * @returns {string} 'hoy', 'mañana', or 'en N días'
 */
export function formatRelativeDate(dateStr, now = new Date()) {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const venc = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.round((venc - todayStart) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'mañana';
    return `en ${diffDays} días`;
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
 * @param {Date} [now=new Date()]
 */
export function sendPaymentNotification(payment, now = new Date()) {
    if (!isNotificationSupported() || Notification.permission !== 'granted') return;

    const { acreedor, monto, moneda, vencimiento } = payment;
    const relDate = formatRelativeDate(vencimiento, now);
    const formattedDate = formatDate(vencimiento);
    const body = `💰 ${moneda} ${monto.toLocaleString('es-AR')} · 📅 Vence ${relDate} (${formattedDate})`;
    new Notification(`⚠️ Próximo vencimiento: ${acreedor}`, {
        body,
        icon: '/favicon.ico'
    });
}

/**
 * Shows an in-app toast alert for an upcoming payment.
 * Used as a fallback when the browser Notifications API is unavailable or denied
 * (e.g. iOS Safari, or when the user has not granted permission).
 * @param {{acreedor: string, monto: number, moneda: string, vencimiento: string}} payment
 * @param {Date} [now=new Date()]
 */
export function showInAppNotification(payment, now = new Date()) {
    if (typeof window === 'undefined') return;
    const { acreedor, monto, moneda, vencimiento } = payment;
    const relDate = formatRelativeDate(vencimiento, now);
    const formattedDate = formatDate(vencimiento);
    const message = [
        `<strong>⚠️ Próximo vencimiento</strong>`,
        `💰 <strong>${acreedor} — ${moneda} ${monto.toLocaleString('es-AR')}</strong>`,
        `📅 Vence ${relDate} (${formattedDate}) · <a href="/" class="alert-link">Ver detalle</a>`
    ].join('<br>');
    window.dispatchEvent(new CustomEvent('app:notify', {
        detail: { message, type: 'warning' }
    }));
}

/**
 * Sends a single grouped browser notification summarising all upcoming payments.
 * Used when there are more than MAX_INDIVIDUAL_NOTIFICATIONS payments due.
 * Clicking the notification focuses the app window so the user can see the list.
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
 * Shows a single grouped in-app toast summarising all upcoming payments.
 * Used as a fallback when the browser Notifications API is unavailable or denied,
 * and there are more than MAX_INDIVIDUAL_NOTIFICATIONS payments due.
 * Includes a link to the home page where the full debt list is visible.
 * @param {number} count - Number of upcoming payments.
 */
export function showGroupedInAppNotification(count) {
    if (typeof window === 'undefined') return;
    const message = `⚠️ Tenés <strong>${count} pagos próximos a vencer</strong> en los próximos 3 días. <a href="/" class="alert-link">Ver detalle</a>`;
    window.dispatchEvent(new CustomEvent('app:notify', {
        detail: { message, type: 'warning' }
    }));
}

/**
 * Main entry point: requests permission and notifies the user about upcoming payments.
 * - Up to 5 payments: one notification per payment.
 * - More than 5 payments: a single grouped notification.
 * Falls back to in-app toasts when the browser Notifications API is unavailable or
 * the user has not granted permission (e.g. iOS Safari).
 * Should be called when the app loads or becomes visible.
 * @param {Array} deudas - List of debts from the repository.
 */
export async function checkAndNotify(deudas) {
    const now = new Date();
    const payments = getUpcomingPayments(deudas, DAYS_AHEAD, now);
    if (payments.length === 0) return;

    const grouped = payments.length > MAX_INDIVIDUAL_NOTIFICATIONS;

    if (!isNotificationSupported()) {
        grouped ? showGroupedInAppNotification(payments.length) : payments.forEach(p => showInAppNotification(p, now));
        return;
    }

    const permission = await requestPermission();
    if (permission !== 'granted') {
        grouped ? showGroupedInAppNotification(payments.length) : payments.forEach(p => showInAppNotification(p, now));
        return;
    }

    grouped ? sendGroupedNotification(payments.length) : payments.forEach(p => sendPaymentNotification(p, now));
}
