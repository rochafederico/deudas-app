// src/features/tour/tourConfig.js
// Definicion de los pasos del tour guiado

/**
 * Helper para buscar un elemento con data-tour-step dentro del DOM.
 * Recorre el path de custom elements buscando selectores anidados.
 * @param {Array<{selector: string}>} path - Array de pasos para llegar al elemento.
 * @returns {HTMLElement|null}
 */
export function findTourTarget(path) {
    if (!path || path.length === 0) return null;
    let current = document;
    for (const step of path) {
        const node = current.querySelector(step.selector);
        if (!node) return null;
        current = node;
    }
    return current;
}

function isVisibleTarget(element) {
    let current = element;
    while (current && current.nodeType === 1) {
        const style = window.getComputedStyle(current);
        if (
            current.hidden ||
            current.getAttribute('aria-hidden') === 'true' ||
            style.display === 'none' ||
            style.visibility === 'hidden'
        ) {
            return false;
        }
        current = current.parentElement;
    }
    return true;
}

/**
 * Busca el primer selector que tenga exactamente un target visible.
 * Retorna null si no hay matches visibles o si todos los selectores resultan ambiguos.
 * @param {string[]} selectors
 * @returns {HTMLElement|null}
 */
export function findVisibleTourTarget(selectors = []) {
    for (const selector of selectors) {
        const matches = Array.from(document.querySelectorAll(selector)).filter(isVisibleTarget);
        if (matches.length === 1) return matches[0];
    }
    return null;
}

/**
 * Cada paso tiene:
 * - id: Identificador unico
 * - title: Titulo del paso
 * - text: Descripcion del paso
 * - getTarget: Funcion que retorna el elemento DOM a destacar (o null si no hay target)
 * - position: Posicion preferida del tooltip ('bottom', 'top', 'left', 'right', 'center')
 */
export const tourSteps = [
    {
        id: 'bienvenida',
        title: 'Bienvenida',
        text: 'Organizá tus deudas y gastos fijos en un solo lugar',
        getTarget: () => findVisibleTourTarget([
            'app-header [data-tour-step="bienvenida"]'
        ]),
        position: 'bottom'
    },
    {
        id: 'resumen-principal',
        title: 'Resumen principal',
        text: 'Acá tenés el panorama general del mes antes de entrar al detalle',
        getTarget: () => findVisibleTourTarget([
            '#app-wrapper > .mb-3'
        ]),
        position: 'bottom'
    },
    {
        id: 'indicadores',
        title: 'Cards KPI',
        text: 'Estas tarjetas resumen balance, gastos, ingresos, pendientes e inversiones',
        getTarget: () => findVisibleTourTarget([
            '[data-tour-step="indicadores"]'
        ]),
        position: 'bottom'
    },
    {
        id: 'navegacion-mes',
        title: 'Navegación por mes',
        text: 'Navegá entre meses para ver tus pagos pasados y futuros',
        getTarget: () => findVisibleTourTarget([
            'month-selector [data-tour-step="navegacion-mes"]'
        ]),
        position: 'bottom'
    },
    {
        id: 'acciones-rapidas',
        title: 'Acciones rápidas',
        text: 'Desde acá podés crear movimientos nuevos y acceder rápido a las acciones principales',
        getTarget: () => findVisibleTourTarget([
            'app-shell header-bar .card-header > .d-flex.gap-2.flex-wrap:not(.align-items-center)'
        ]),
        position: 'bottom'
    },
    {
        id: 'menu-navegacion',
        title: 'Menú de navegación',
        text: 'Movete entre Egresos, Ingresos e Inversiones desde la navegación principal visible en tu dispositivo',
        getTarget: () => findVisibleTourTarget([
            'app-header app-nav [data-tour-step="menu-navegacion"]',
            'bottom-nav nav[aria-label="Navegación móvil"]'
        ]),
        position: 'bottom'
    },
    {
        id: 'accesos-secundarios',
        title: 'Accesos secundarios',
        text: 'En Config encontrás exportar, importar y otras acciones de mantenimiento de tus datos',
        getTarget: () => findVisibleTourTarget([
            'app-header #desktop-datos-toggle',
            'bottom-nav [data-bs-target="#mas-offcanvas"]'
        ]),
        position: 'bottom'
    },
    {
        id: 'privacidad',
        title: 'Privacidad',
        text: 'Tus datos se guardan solo en tu navegador. Nunca se envían a ningún servidor.',
        getTarget: () => null,
        position: 'center'
    }
];
