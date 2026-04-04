// src/features/notifications/notificationPermissions.js
// Handles browser Notifications API permission negotiation and localStorage persistence

import { NOTIFICATION_PERM_KEY } from './config/notificationConfig.js';

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
 * - Stores 'granted' or 'denied'; leaves localStorage unchanged when the user
 *   dismisses the prompt without choosing ('default').
 * @returns {Promise<string>} - The permission status: 'granted', 'denied', or 'default'.
 */
export async function requestPermission() {
    if (!isNotificationSupported()) return 'denied';

    const stored = getStoredPermission();
    if (stored === 'denied') return 'denied';

    if (Notification.permission === 'granted') {
        setStoredPermission('granted');
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        setStoredPermission('denied');
        return 'denied';
    }

    const result = await Notification.requestPermission();
    if (result !== 'default') setStoredPermission(result);
    return result;
}
