// test/month-filter.test.js
// Tests for the global MonthFilter module
import { assert } from './setup.js';
import {
    getSelectedMonth,
    setSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    formatMonthLabel,
} from '../src/shared/MonthFilter.js';

// ===================================================================
// UC1: getSelectedMonth returns a valid YYYY-MM string
// ===================================================================
async function testGetSelectedMonthReturnsValidFormat() {
    console.log('  UC1: getSelectedMonth retorna un string con formato YYYY-MM válido');
    const month = getSelectedMonth();
    assert(typeof month === 'string', 'getSelectedMonth debe retornar un string');
    assert(/^\d{4}-\d{2}$/.test(month), 'getSelectedMonth debe retornar formato YYYY-MM');
}

// ===================================================================
// UC2: setSelectedMonth updates state and dispatches ui:month event
// ===================================================================
async function testSetSelectedMonthDispatchesEvent() {
    console.log('  UC2: setSelectedMonth actualiza el estado y dispara ui:month');
    let received = null;
    const handler = (e) => { received = e.detail.mes; };
    window.addEventListener('ui:month', handler);

    setSelectedMonth('2025-06');
    assert(getSelectedMonth() === '2025-06', 'getSelectedMonth debe retornar el mes establecido');
    assert(received === '2025-06', 'ui:month debe dispararse con el mes correcto');

    window.removeEventListener('ui:month', handler);
    // Reset to a known state
    setSelectedMonth(new Date().toISOString().slice(0, 7));
}

// ===================================================================
// UC3: goToPreviousMonth decrements month correctly
// ===================================================================
async function testGoToPreviousMonth() {
    console.log('  UC3: goToPreviousMonth retrocede el mes correctamente');
    setSelectedMonth('2026-03');
    goToPreviousMonth();
    assert(getSelectedMonth() === '2026-02', 'goToPreviousMonth debe pasar de 2026-03 a 2026-02');

    setSelectedMonth('2026-01');
    goToPreviousMonth();
    assert(getSelectedMonth() === '2025-12', 'goToPreviousMonth debe pasar de enero a diciembre del año anterior');
}

// ===================================================================
// UC4: goToNextMonth increments month correctly
// ===================================================================
async function testGoToNextMonth() {
    console.log('  UC4: goToNextMonth avanza el mes correctamente');
    setSelectedMonth('2026-03');
    goToNextMonth();
    assert(getSelectedMonth() === '2026-04', 'goToNextMonth debe pasar de 2026-03 a 2026-04');

    setSelectedMonth('2025-12');
    goToNextMonth();
    assert(getSelectedMonth() === '2026-01', 'goToNextMonth debe pasar de diciembre a enero del año siguiente');
}

// ===================================================================
// UC5: formatMonthLabel returns human-readable label in Spanish
// ===================================================================
async function testFormatMonthLabel() {
    console.log('  UC5: formatMonthLabel retorna etiqueta legible en español');
    const label = formatMonthLabel('2026-04');
    assert(typeof label === 'string', 'formatMonthLabel debe retornar un string');
    assert(label.includes('2026'), 'formatMonthLabel debe incluir el año');
    // The month name should be non-empty (locale-dependent)
    assert(label.length > 4, 'formatMonthLabel debe retornar una etiqueta con el nombre del mes');
}

// ===================================================================
// UC6: goToPreviousMonth and goToNextMonth dispatch ui:month events
// ===================================================================
async function testNavigationDispatchesEvents() {
    console.log('  UC6: goToPreviousMonth y goToNextMonth disparan ui:month');
    setSelectedMonth('2026-06');

    let prevReceived = null;
    let nextReceived = null;

    const handlerPrev = (e) => { prevReceived = e.detail.mes; };
    window.addEventListener('ui:month', handlerPrev);
    goToPreviousMonth();
    window.removeEventListener('ui:month', handlerPrev);
    assert(prevReceived === '2026-05', 'goToPreviousMonth debe disparar ui:month con el mes anterior');

    const handlerNext = (e) => { nextReceived = e.detail.mes; };
    window.addEventListener('ui:month', handlerNext);
    goToNextMonth();
    window.removeEventListener('ui:month', handlerNext);
    assert(nextReceived === '2026-06', 'goToNextMonth debe disparar ui:month con el mes siguiente');
}

export const tests = [
    testGetSelectedMonthReturnsValidFormat,
    testSetSelectedMonthDispatchesEvent,
    testGoToPreviousMonth,
    testGoToNextMonth,
    testFormatMonthLabel,
    testNavigationDispatchesEvents,
];
