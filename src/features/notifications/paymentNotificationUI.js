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

function isSameMonthAndYear(year, month, now) {
    return year === now.getFullYear() && month === now.getMonth() + 1;
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
 * @returns {string} 'hoy', 'mañana', 'ayer', 'hace N días', or 'en N días'
 */
export function formatRelativeDate(dateStr, now = new Date()) {
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const [y, m, d] = dateStr.split('-').map(Number);
    const vencUTC = Date.UTC(y, m - 1, d);
    const diffDays = (vencUTC - todayUTC) / (1000 * 60 * 60 * 24);
    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'mañana';
    if (diffDays === -1) return 'ayer';
    if (diffDays < 0) return `hace ${Math.abs(diffDays)} días`;
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
    return `<li class="mb-1">${acreedor} — <strong>${formattedMonto}</strong></li>`;
}

/**
 * Renders a labeled section with a title and HTML body.
 * @param {string} titulo - Section label (e.g. 'Hoy', 'Mañana')
 * @param {string} html - Inner HTML for the section body
 * @returns {string} HTML string
 */
function renderItemDetail(titulo, html) {
    return `<p class="mb-1 fw-semibold small">📅 ${titulo}</p>${html}`;
}

/**
 * Renders the "Vencidos del mes" section (payments overdue in the current month).
 * @param {Array} payments
 * @returns {string} HTML string or empty string
 */
function renderOverdueSection(payments) {
    if (payments.length === 0) return '';
    return renderItemDetail('Vencidos del mes', `<ul class="list-unstyled ms-2 mb-2">${payments.map(renderPaymentItem).join('')}</ul>`);
}

/**
 * Renders the "Hoy" section (payments due today).
 * @param {Array} payments
 * @returns {string} HTML string or empty string
 */
function renderTodaySection(payments) {
    if (payments.length === 0) return '';
    return renderItemDetail('Hoy', `<ul class="list-unstyled ms-2 mb-2">${payments.map(renderPaymentItem).join('')}</ul>`);
}

/**
 * Renders the "Mañana" section (payments due tomorrow).
 * @param {Array} payments
 * @returns {string} HTML string or empty string
 */
function renderTomorrowSection(payments) {
    if (payments.length === 0) return '';
    return renderItemDetail('Mañana', `<ul class="list-unstyled ms-2 mb-2">${payments.map(renderPaymentItem).join('')}</ul>`);
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
    return renderItemDetail('Próximos días', `<p class="mb-0 small">${restText}</p>`);
}

/**
 * Builds the inner HTML for the structured upcoming-payments alert panel.
 * Groups payments into: Vencidos del mes / Hoy / Mañana / Próximos días.
 * @param {Array<{acreedor: string, monto: number, moneda: string, vencimiento: string, deudaId?: number}>} payments
 * @param {Date} [now=new Date()]
 * @returns {string} HTML string for the alert body
 */
export function buildUpcomingPaymentsHTML(payments, now = new Date()) {
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const overdue = [], today = [], tomorrow = [], rest = [];

    for (const p of payments) {
        const [y, m, d] = p.vencimiento.split('-').map(Number);
        const vencUTC = Date.UTC(y, m - 1, d);
        const diffDays = (vencUTC - todayUTC) / (1000 * 60 * 60 * 24);
        if (diffDays < 0) {
            if (isSameMonthAndYear(y, m, now)) overdue.push(p);
            continue;
        }
        if (diffDays === 0) today.push(p);
        else if (diffDays === 1) tomorrow.push(p);
        else rest.push(p);
    }

    return {
        html: [
            renderOverdueSection(overdue),
            renderTodaySection(today),
            renderTomorrowSection(tomorrow),
            renderUpcomingSection(rest)
        ].join(''),
        todayCount: today.length,
    };
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
    const { html, todayCount } = buildUpcomingPaymentsHTML(payments, now);
    window.dispatchEvent(new CustomEvent('app:upcoming-panel', { detail: { html, todayCount } }));
}

/**
 * Shows an in-app toast alert for a single payment.
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
    const overdue = relDate === 'ayer' || relDate.startsWith('hace ');
    const title = overdue ? '⚠️ Vencimiento pendiente' : '⚠️ Próximo vencimiento';
    const verb = overdue ? 'Venció' : 'Vence';
    const message = [
        `<strong>${title}</strong>`,
        `💰 <strong>${safeAcreedor} — ${safeMoneda} ${monto.toLocaleString('es-AR')}</strong>`,
        `📅 ${verb} ${relDate} (${formattedDate}) · <a href="/" class="alert-link">Ver detalle</a>`
    ].join('<br>');
    window.dispatchEvent(new CustomEvent('app:notify', { detail: { message, type: 'warning' } }));
}

/**
 * Shows a single grouped in-app toast summarising all pending payments.
 * Used when there are more than MAX_INDIVIDUAL_NOTIFICATIONS payments due.
 * @param {number} count - Number of pending payments.
 */
export function showGroupedInAppNotification(count) {
    if (typeof window === 'undefined') return;
    const message = `⚠️ Tenés <strong>${count} pagos vencidos o por vencer</strong>. <a href="/" class="alert-link">Ver detalle</a>`;
    window.dispatchEvent(new CustomEvent('app:notify', { detail: { message, type: 'warning' } }));
}
