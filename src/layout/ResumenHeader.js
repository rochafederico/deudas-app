// src/layout/ResumenHeader.js
// Global page header: "Resumen" + month selector + subtitle
import './MonthSelector.js';

export default function ResumenHeader() {
    const el = document.createElement('div');
    el.className = 'mb-3';
    el.innerHTML = `
        <div class="d-flex justify-content-between align-items-center gap-3 mb-1">
            <h1 class="h3 fw-bold mb-0">Panorama financiero</h1>
            <month-selector></month-selector>
        </div>
        <p class="text-body-secondary mb-0">Tu panorama financiero del mes.</p>
    `;
    return el;
}
