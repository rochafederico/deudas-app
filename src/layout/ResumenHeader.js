// src/layout/ResumenHeader.js
// Global page header: page title + global month selector + subtitle
import './MonthSelector.js';
import { DEFAULT_SUBTITLE } from './navConfig.js';

export default function ResumenHeader({ title = 'Panorama financiero', subtitle = DEFAULT_SUBTITLE } = {}) {
    const el = document.createElement('div');
    el.className = 'mb-3';
    el.id = 'resumen-header';

    const titleEl = document.createElement('h1');
    titleEl.className = 'h3 fw-bold mb-0';
    titleEl.id = 'resumen-header-title';
    titleEl.textContent = title;

    const monthSelector = document.createElement('month-selector');

    const topRow = document.createElement('div');
    topRow.className = 'd-flex justify-content-between align-items-center gap-3 mb-1';
    topRow.appendChild(titleEl);
    topRow.appendChild(monthSelector);

    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'text-body-secondary mb-0';
    subtitleEl.id = 'resumen-header-subtitle';
    subtitleEl.textContent = subtitle;

    el.appendChild(topRow);
    el.appendChild(subtitleEl);

    el.update = ({ title: newTitle, subtitle: newSubtitle, hideMonthSelector } = {}) => {
        if (newTitle !== undefined) {
            el.querySelector('#resumen-header-title').textContent = newTitle;
        }
        if (newSubtitle !== undefined) {
            el.querySelector('#resumen-header-subtitle').textContent = newSubtitle;
        }
        if (hideMonthSelector !== undefined) {
            monthSelector.classList.toggle('d-none', !!hideMonthSelector);
        }
    };

    return el;
}
