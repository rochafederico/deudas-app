// src/features/tour/tourState.js
// Gestiona el estado del tour en localStorage

const TOUR_KEY = 'nivva_tour_completed';

/**
 * Verifica si el tour ya fue completado.
 * @returns {boolean}
 */
export function isTourCompleted() {
    return localStorage.getItem(TOUR_KEY) === 'true';
}

/**
 * Marca el tour como completado en localStorage.
 */
export function markTourCompleted() {
    localStorage.setItem(TOUR_KEY, 'true');
}

/**
 * Resetea el estado del tour (util para testing/debug).
 */
export function resetTourState() {
    localStorage.removeItem(TOUR_KEY);
}
