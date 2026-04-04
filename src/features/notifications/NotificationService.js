// src/features/notifications/NotificationService.js
// Barrel re-export: maintains the original public API while delegating to
// focused sub-modules. Consumers should prefer importing directly from:
//   - ./config/notificationConfig.js   — constants
//   - ./notificationPermissions.js     — browser permission handling
//   - ./paymentNotificationUI.js       — date helpers, panel/toast rendering
//   - ./paymentNotificationService.js  — business logic & native notifications

export * from './config/notificationConfig.js';
export * from './notificationPermissions.js';
export * from './paymentNotificationUI.js';
export * from './paymentNotificationService.js';
