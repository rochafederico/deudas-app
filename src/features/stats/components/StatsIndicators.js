// src/components/StatsIndicators.js
import StatsCard from './StatsCard.js';
import { getMonthlySummary } from '../statsService.js';
import { addValue } from '../utils/formatCurrency.js';
import { getSelectedMonth } from '../../../shared/MonthFilter.js';

// Module-level ref so only one ui:month listener is active at a time.
// Each call to StatsIndicators() replaces the previous listener with one
// that renders into the current (newly created) container node.
let _monthHandler = null;

export default function StatsIndicators({ mes } = {}) {
  const container = document.createElement('div');
  container.className = 'mb-4';
  container.setAttribute('data-tour-step', 'indicadores');

  // Render helper
  async function render(periodo) {
    container.innerHTML = '';
    const loading = document.createElement('div');
    loading.className = 'col-12 text-body-secondary px-2';
    loading.textContent = 'Cargando resumen...';
    container.appendChild(loading);

    try {
      const summary = await getMonthlySummary(periodo);
      container.innerHTML = '';

      const row = document.createElement('div');
      row.className = 'row row-cols-1 g-3';

      const cards = [
        { title: 'Ingresos',   icon: 'bi-cash-stack',     items: addValue(summary.byCurrency.ingresos),   color: 'success' },
        { title: 'Gastos',     icon: 'bi-wallet2',         items: addValue(summary.byCurrency.egresos),    color: 'danger' },
        { title: 'Balance',    icon: 'bi-briefcase',       items: addValue(summary.byCurrency.saldo),      color: 'primary' },
        { title: 'Pendientes', icon: 'bi-hourglass-split', items: addValue(summary.byCurrency.pendientes), color: 'warning' },
      ];

      for (const cardProps of cards) {
        const col = document.createElement('div');
        col.className = 'col';
        col.appendChild(StatsCard(cardProps));
        row.appendChild(col);
      }

      container.appendChild(row);
    } catch (err) {
      container.innerHTML = '';
      const errEl = document.createElement('div');
      errEl.className = 'col-12 text-danger px-2';
      errEl.textContent = 'Error cargando resumen';
      container.appendChild(errEl);
      console.error('Error getMonthlySummary', err);
    }
  }

  const initialPeriodo = mes || getSelectedMonth();
  render(initialPeriodo);

  // Remove the previous listener (if any) so navigating away and back does
  // not leave stale handlers that render into detached nodes.
  if (_monthHandler) {
    window.removeEventListener('ui:month', _monthHandler);
  }
  _monthHandler = (e) => {
    const nuevo = (e && e.detail && e.detail.mes) ? e.detail.mes : getSelectedMonth();
    render(nuevo);
  };
  window.addEventListener('ui:month', _monthHandler);

  return container;
}
