// src/shared/MonthFilter.js
// Global month filter state — shared across all screens (in-memory only)

function _getCurrentMonth() {
    return new Date().toISOString().slice(0, 7);
}

let _selectedMonth = _getCurrentMonth();

export function getSelectedMonth() {
    return _selectedMonth;
}

export function setSelectedMonth(month) {
    _selectedMonth = month;
    window.dispatchEvent(new CustomEvent('ui:month', { detail: { mes: month } }));
}

export function goToPreviousMonth() {
    const d = new Date(_selectedMonth + '-01T12:00:00');
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
}

export function goToNextMonth() {
    const d = new Date(_selectedMonth + '-01T12:00:00');
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
}

export function formatMonthLabel(month) {
    const [year, mon] = month.split('-');
    const date = new Date(parseInt(year), parseInt(mon) - 1, 1);
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

export function formatMonthTitleParts(month) {
    const [year, mon] = month.split('-');
    const date = new Date(parseInt(year), parseInt(mon) - 1, 1);
    const mes = date.toLocaleDateString('es-AR', { month: 'long' });
    return { mes, year };
}
