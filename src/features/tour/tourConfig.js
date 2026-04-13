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

/**
 * Helper para buscar un elemento con data-tour-step dentro del DOM,
 * verificando que el elemento sea visible (tamaño no nulo).
 * @param {Array<{selector: string}>} path
 * @returns {HTMLElement|null}
 */
export function findVisibleTourTarget(path) {
    const el = findTourTarget(path);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    return el;
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
        text: 'Organizá tus compromisos financieros en un solo lugar.',
        getTarget: () => findTourTarget([
            { selector: 'app-header' },
            { selector: '[data-tour-step="bienvenida"]' }
        ]),
        position: 'bottom'
    },
    {
        id: 'indicadores',
        title: 'Indicadores',
        text: 'Acá vas a ver tu resumen mensual de un vistazo',
        getTarget: () => document.querySelector('[data-tour-step="indicadores"]'),
        position: 'bottom'
    },
    {
        id: 'navegacion-mes',
        title: 'Navegación por mes',
        text: 'Navegá entre meses para ver tus pagos pasados y futuros',
        getTarget: () => document.querySelector('[data-tour-step="navegacion-mes"]'),
        position: 'bottom'
    },
    {
        id: 'nueva-deuda',
        title: 'Nueva deuda',
        text: 'Cargá tus egresos: tarjeta, alquiler, préstamos y servicios.',
        getTarget: () => findTourTarget([
            { selector: 'app-shell' },
            { selector: 'header-bar' },
            { selector: '[data-tour-step="nueva-deuda"]' }
        ]),
        position: 'bottom'
    },
    {
        id: 'datos-backup',
        title: 'Exportar e importar datos',
        text: 'Desde Ajustes podés hacer una copia de seguridad o restaurar tus datos.',
        getTarget: () =>
            findVisibleTourTarget([{ selector: 'app-header' }, { selector: '[data-tour-step="config"]' }]) ||
            findVisibleTourTarget([{ selector: 'bottom-nav' }, { selector: '[data-tour-step="config"]' }]),
        position: 'bottom'
    },
    {
        id: 'menu-navegacion',
        title: 'Menú de navegación',
        text: 'Explorá las distintas secciones desde acá',
        getTarget: () =>
            findVisibleTourTarget([{ selector: 'app-header' }, { selector: '[data-tour-step="menu-navegacion"]' }]) ||
            findVisibleTourTarget([{ selector: 'bottom-nav' }, { selector: '[data-tour-step="menu-navegacion"]' }]),
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
