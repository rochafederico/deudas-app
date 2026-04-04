// src/features/notifications/UpcomingPaymentsPanel.js
// Kept for backward compatibility — the notification panel is now rendered as a
// Bootstrap Popover from the navbar bell icon in AppHeader.js.

export class UpcomingPaymentsPanel extends HTMLElement {}

customElements.define('upcoming-payments-panel', UpcomingPaymentsPanel);
