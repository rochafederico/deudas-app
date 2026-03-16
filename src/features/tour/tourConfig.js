// src/features/tour/tourConfig.js
// Definicion de los pasos del tour guiado

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
        getTarget: () => document.querySelector('demo-banner'),
        position: 'bottom'
    },
    {
        id: 'indicadores',
        title: 'Indicadores',
        text: 'Acá vas a ver tu resumen mensual de un vistazo',
        getTarget: () => document.querySelector('.stats-row'),
        position: 'bottom'
    },
    {
        id: 'navegacion-mes',
        title: 'Navegación por mes',
        text: 'Navegá entre meses para ver tus pagos pasados y futuros',
        getTarget: () => {
            const appShell = document.querySelector('app-shell');
            if (!appShell || !appShell.shadowRoot) return null;
            const header = appShell.shadowRoot.querySelector('header-bar');
            if (!header || !header.shadowRoot) return null;
            return header.shadowRoot.querySelector('.month-nav');
        },
        position: 'bottom'
    },
    {
        id: 'nueva-deuda',
        title: 'Nueva deuda',
        text: 'Cargá tus deudas: tarjeta, alquiler, préstamos, servicios',
        getTarget: () => {
            const appShell = document.querySelector('app-shell');
            if (!appShell || !appShell.shadowRoot) return null;
            const header = appShell.shadowRoot.querySelector('header-bar');
            if (!header || !header.shadowRoot) return null;
            return header.shadowRoot.querySelector('#add-debt');
        },
        position: 'bottom'
    },
    {
        id: 'nuevo-ingreso',
        title: 'Nuevo ingreso',
        text: 'Registrá tus ingresos para ver si te alcanza el mes',
        getTarget: () => {
            const appShell = document.querySelector('app-shell');
            if (!appShell || !appShell.shadowRoot) return null;
            const header = appShell.shadowRoot.querySelector('header-bar');
            if (!header || !header.shadowRoot) return null;
            return header.shadowRoot.querySelector('#add-income');
        },
        position: 'bottom'
    },
    {
        id: 'menu-navegacion',
        title: 'Menú de navegación',
        text: 'Explorá las distintas secciones desde acá',
        getTarget: () => {
            const banner = document.querySelector('demo-banner');
            if (!banner || !banner.shadowRoot) return null;
            return banner.shadowRoot.querySelector('main-menu');
        },
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
