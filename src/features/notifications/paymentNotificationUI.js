// src/features/notifications/paymentNotificationUI.js
// UI layer: date formatting, HTML panel rendering, toast/event dispatch

import { MAX_REST_NAMES } from './config/notificationConfig.js';

// ── XSS protection ────────────────────────────────────────────────────────────

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ── Date helpers ──────────────────────────────────────────────────────────────

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

// ── Panel render functions ────────────────────────────────────────────────────

/**
 * Renders a single payment row with an info button.
 * @param {{acreedor: string, monto: number, moneda: string, deudaId?: number}} p
 * @returns {string} HTML list item
 */
function renderPaymentItem(p) {
    const acreedor = escapeHtml(p.acreedor);
    const moneda = escapeHtml(p.moneda);
    const formattedMonto = `${moneda} ${p.monto.toLocaleString('es-AR')}`;
    const deudaIdAttr = p.deudaId != null ? ` data-deuda-id="${escapeHtml(String(p.deudaId))}"` : '';
    return `<li class="mb-1">${acreedor} — <strong>${formattedMonto}</strong> <button type="button" class="btn btn-link btn-sm p-0 text-warning-emphasis ms-1 align-baseline border-0"${deudaIdAttr} title="Ver detalle" aria-label="Ver detalle de ${acreedor}">ℹ️</button></li>`;
}

/**
 * Renders the "Hoy" section (payments due today).
 * @param {Array} payments
 * @returns {string} HTML string or empty string
 */
function renderTodaySection(payments) {
    if (payments.length === 0) return '';
    return `<p class="mb-1 fw-semibold small">📅 Hoy</p>` +
        `<ul class="list-unstyled ms-2 mb-2">${payments.map(renderPaymentItem).join('')}</ul>`;
}

/**
 * Renders the "Mañana" section (payments due tomorrow).
 * @param {Array} payments
 * @returns {string} HTML string or empty string
 */
function renderTomorrowSection(payments) {
    if (payments.length === 0) return '';
    return `<p class="mb-1 fw-semibold small">📅 Mañana</p>` +
        `<ul class="list-unstyled ms-2 mb-2">${payments.map(renderPaymentItem).join('')}</ul>`;
}

/**
 * Renders the "Próximos días" section: comma-separated names, up to MAX_REST_NAMES
 * shown with "y N más" truncation.
 * @param {Array} payments
 * @returns {string} HTML string or empty string
 */
function renderUpcomingSection(payments) {
    if (payments.length === 0) return '';
    const names = payments.map(p => escapeHtml(p.acreedor));
    const restText = names.length <= MAX_REST_NAMES
        ? names.join(', ')
        : `${names.slice(0, MAX_REST_NAMES).join(', ')} y ${names.length - MAX_REST_NAMES} más`;
    return `<p class="mb-1 fw-semibold small">📆 Próximos días</p>` +
        `<p class="mb-0 small">${restText}</p>`;
}

/**
 * Builds the inner HTML for the structured upcoming-payments alert panel.
 * Groups payments into: Hoy / Mañana / Próximos días.
 * @param {Array<{acreedor: string, monto: number, moneda: string, vencimiento: string, deudaId?: number}>} payments
 * @param {Date} [now=new Date()]
 * @returns {string} HTML string for the alert body
 */
export function buildUpcomingPaymentsHTML(payments, now = new Date()) {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const today = [], tomorrow = [], rest = [];

    for (const p of payments) {
        const venc = new Date(p.vencimiento + 'T00:00:00');
        const diffDays = Math.round((venc - todayStart) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) today.push(p);
        else if (diffDays === 1) tomorrow.push(p);
        else rest.push(p);
    }

    return [
        renderTodaySection(today),
        renderTomorrowSection(tomorrow),
        renderUpcomingSection(rest)
    ].join('');
}

// ── Event dispatch ────────────────────────────────────────────────────────────

/**
 * Dispatches an `app:upcoming-panel` event with the structured HTML for the
 * upcoming-payments alert panel.
 * @param {Array} payments
 * @param {Date} [now=new Date()]
 */
export function showInAppPanel(payments, now = new Date()) {
    if (typeof window === 'undefined') return;
    const html = buildUpcomingPaymentsHTML(payments, now);
    window.dispatchEvent(new CustomEvent('app:upcoming-panel', { detail: { html } }));
}

/**
 * Shows an in-app toast alert for a single upcoming payment.
 * Used as a fallback when the browser Notifications API is unavailable or denied.
 * @param {{acreedor: string, monto: number, moneda: string, vencimiento: string}} payment
 * @param {Date} [now=new Date()]
 */
export function showInAppNotification(payment, now = new Date()) {
    if (typeof window === 'undefined') return;
    const { acreedor, monto, moneda, vencimiento } = payment;
    const relDate = formatRelativeDate(vencimiento, now);
    const formattedDate = formatDate(vencimiento);
    const safeAcreedor = escapeHtml(acreedor);
    const safeMoneda = escapeHtml(moneda);
    const message = [
        `<strong>⚠️ Próximo vencimiento</strong>`,
        `💰 <strong>${safeAcreedor} — ${safeMoneda} ${monto.toLocaleString('es-AR')}</strong>`,
        `📅 Vence ${relDate} (${formattedDate}) · <a href="/" class="alert-link">Ver detalle</a>`
    ].join('<br>');
    window.dispatchEvent(new CustomEvent('app:notify', { detail: { message, type: 'warning' } }));
}

/**
 * Shows a single grouped in-app toast summarising all upcoming payments.
 * Used when there are more than MAX_INDIVIDUAL_NOTIFICATIONS payments due.
 * @param {number} count - Number of upcoming payments.
 */
export function showGroupedInAppNotification(count) {
    if (typeof window === 'undefined') return;
    const message = `⚠️ Tenés <strong>${count} pagos próximos a vencer</strong> en los próximos 3 días. <a href="/" class="alert-link">Ver detalle</a>`;
    window.dispatchEvent(new CustomEvent('app:notify', { detail: { message, type: 'warning' } }));
}
