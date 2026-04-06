// test/tour.test.js
// Tests del tour guiado - flujo E2E desde estado hasta UI
import { assert } from './setup.js';
import '../src/layout/MonthSelector.js';
import '../src/layout/HeaderBar.js';
import { isTourCompleted, markTourCompleted, resetTourState } from '../src/features/tour/tourState.js';
import { tourSteps, findTourTarget, findVisibleTourTarget } from '../src/features/tour/tourConfig.js';

// Provide localStorage polyfill for happy-dom if missing
if (!global.localStorage) {
    const store = {};
    global.localStorage = {
        getItem: (key) => store[key] ?? null,
        setItem: (key, val) => { store[key] = String(val); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    };
}

export const tests = [

    // --- tourState ---
    async function tourState_initiallyNotCompleted() {
        console.log('  tourState: initially not completed');
        resetTourState();
        assert(!isTourCompleted(), 'Tour should not be completed initially');
    },

    async function tourState_markAndCheck() {
        console.log('  tourState: mark completed and check');
        resetTourState();
        markTourCompleted();
        assert(isTourCompleted(), 'Tour should be completed after marking');
    },

    async function tourState_resetClears() {
        console.log('  tourState: reset clears state');
        markTourCompleted();
        resetTourState();
        assert(!isTourCompleted(), 'Tour should not be completed after reset');
    },

    // --- tourConfig ---
    async function tourConfig_has8Steps() {
        console.log('  tourConfig: has 8 steps');
        assert(tourSteps.length === 8, `Expected 8 steps, got ${tourSteps.length}`);
    },

    async function tourConfig_stepsHaveRequiredFields() {
        console.log('  tourConfig: all steps have required fields');
        for (const step of tourSteps) {
            assert(typeof step.id === 'string' && step.id.length > 0, `Step missing id`);
            assert(typeof step.title === 'string' && step.title.length > 0, `Step ${step.id} missing title`);
            assert(typeof step.text === 'string' && step.text.length > 0, `Step ${step.id} missing text`);
            assert(typeof step.getTarget === 'function', `Step ${step.id} missing getTarget function`);
            assert(['top', 'bottom', 'left', 'right', 'center'].includes(step.position), `Step ${step.id} has invalid position: ${step.position}`);
        }
    },

    async function tourConfig_stepIdsAreUnique() {
        console.log('  tourConfig: step ids are unique');
        const ids = tourSteps.map(s => s.id);
        const uniqueIds = new Set(ids);
        assert(ids.length === uniqueIds.size, 'Step ids must be unique');
    },

    async function tourConfig_stepsInCorrectOrder() {
        console.log('  tourConfig: steps are in the correct order');
        const expectedOrder = ['bienvenida', 'resumen-principal', 'indicadores', 'navegacion-mes', 'acciones-rapidas', 'menu-navegacion', 'accesos-secundarios', 'privacidad'];
        for (let i = 0; i < expectedOrder.length; i++) {
            assert(tourSteps[i].id === expectedOrder[i], `Step ${i} should be "${expectedOrder[i]}", got "${tourSteps[i].id}"`);
        }
    },

    async function tourConfig_lastStepHasNoTarget() {
        console.log('  tourConfig: last step (privacidad) has no target');
        const lastStep = tourSteps[tourSteps.length - 1];
        assert(lastStep.id === 'privacidad', 'Last step should be privacidad');
        assert(lastStep.getTarget() === null, 'Privacidad step should return null target');
        assert(lastStep.position === 'center', 'Privacidad step should be centered');
    },

    async function tourConfig_lastStepText() {
        console.log('  tourConfig: last step has privacy message');
        const lastStep = tourSteps[tourSteps.length - 1];
        assert(lastStep.text.includes('navegador'), 'Privacidad text should mention "navegador"');
        assert(lastStep.text.includes('servidor'), 'Privacidad text should mention "servidor"');
    },

    // --- findTourTarget ---
    async function findTourTarget_returnsNullForMissingElement() {
        console.log('  findTourTarget: returns null for missing element');
        const result = findTourTarget([
            { selector: 'nonexistent-element', shadow: true },
            { selector: '[data-tour-step="bienvenida"]' }
        ]);
        assert(result === null, 'Should return null when element is not found');
    },

    async function findTourTarget_returnsNullForEmptyPath() {
        console.log('  findTourTarget: returns null for empty path');
        const result = findTourTarget([]);
        assert(result === null, 'Should return null for empty path');
    },

    async function findVisibleTourTarget_skipsHiddenTargets() {
        console.log('  findVisibleTourTarget: skips hidden targets');
        document.body.innerHTML = `
            <div id="hidden-target" style="display:none"></div>
            <div id="visible-target"></div>
        `;
        const result = findVisibleTourTarget(['#hidden-target', '#visible-target']);
        assert(result?.id === 'visible-target', 'Should return the visible target');
    },

    async function tourConfig_targetsDesktopElementsWhenVisible() {
        console.log('  tourConfig: targets desktop selectors when visible');
        document.body.innerHTML = `
            <app-header>
                <a data-tour-step="bienvenida">Nivva</a>
                <app-nav><ul data-tour-step="menu-navegacion"></ul></app-nav>
                <a id="desktop-datos-toggle" href="#">Config</a>
            </app-header>
            <div id="app-wrapper">
                <section id="summary"></section>
                <div data-tour-step="indicadores"></div>
                <app-shell>
                    <header-bar></header-bar>
                </app-shell>
            </div>
            <month-selector></month-selector>
            <bottom-nav>
                <nav aria-label="Navegación móvil" style="display:none"></nav>
                <button type="button" data-bs-target="#mas-offcanvas" style="display:none"></button>
            </bottom-nav>
        `;

        const getStepTarget = (id) => tourSteps.find(step => step.id === id)?.getTarget();

        assert(getStepTarget('bienvenida')?.getAttribute('data-tour-step') === 'bienvenida', 'Bienvenida should target brand');
        assert(getStepTarget('resumen-principal')?.id === 'summary', 'Resumen principal should target summary header');
        assert(getStepTarget('indicadores')?.getAttribute('data-tour-step') === 'indicadores', 'Indicadores should target KPI container');
        assert(getStepTarget('navegacion-mes')?.getAttribute('data-tour-step') === 'navegacion-mes', 'Month navigation should target selector');
        assert(getStepTarget('acciones-rapidas')?.classList.contains('d-flex'), 'Quick actions should target actions container');
        assert(getStepTarget('menu-navegacion')?.getAttribute('data-tour-step') === 'menu-navegacion', 'Navigation should target desktop menu when visible');
        assert(getStepTarget('accesos-secundarios')?.id === 'desktop-datos-toggle', 'Secondary access should target desktop config when visible');
    },

    async function tourConfig_targetsMobileFallbacksWhenDesktopIsHidden() {
        console.log('  tourConfig: targets mobile fallbacks when desktop is hidden');
        document.body.innerHTML = `
            <app-header>
                <a data-tour-step="bienvenida">Nivva</a>
                <app-nav style="display:none"><ul data-tour-step="menu-navegacion"></ul></app-nav>
                <a id="desktop-datos-toggle" href="#" style="display:none">Config</a>
            </app-header>
            <div id="app-wrapper">
                <section id="summary"></section>
                <div data-tour-step="indicadores"></div>
                <app-shell>
                    <header-bar></header-bar>
                </app-shell>
            </div>
            <month-selector></month-selector>
            <bottom-nav>
                <nav aria-label="Navegación móvil"></nav>
                <button type="button" id="mobile-config" data-bs-target="#mas-offcanvas"></button>
            </bottom-nav>
        `;

        const navigationTarget = tourSteps.find(step => step.id === 'menu-navegacion')?.getTarget();
        const secondaryTarget = tourSteps.find(step => step.id === 'accesos-secundarios')?.getTarget();

        assert(navigationTarget?.getAttribute('aria-label') === 'Navegación móvil', 'Navigation should fallback to mobile nav');
        assert(secondaryTarget?.id === 'mobile-config', 'Secondary access should fallback to mobile config button');
    },
];
