// src/components/StatsIndicators.js
import StatsCard from './StatsCard.js';
import { getMonthlySummary } from '../statsService.js';
import { addValue } from '../utils/formatCurrency.js';
import { getSelectedMonth } from '../../../shared/MonthFilter.js';

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
      row.className = 'row row-cols-2 row-cols-md-2 row-cols-lg-5 g-3';

      const cards = [
        { title: '💼 Balance',      items: addValue(summary.byCurrency.saldo),      color: 'primary' },
        { title: '💳 Pagos pendientes del mes', items: addValue(summary.byCurrency.pendientes), color: 'warning' },
        { title: '📈 Ingresos',     items: addValue(summary.byCurrency.ingresos),    color: 'success' },
        { title: '📉 Gastos',       items: addValue(summary.byCurrency.egresos),     color: 'danger' },
        { title: '📊 Inversiones',  items: addValue(summary.inversiones),            color: 'info' },
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

  // Avoid adding multiple global listeners if this module is imported more than once
  if (!window.__statsIndicatorsMonthListenerAdded) {
    window.addEventListener('ui:month', (e) => {
      const nuevo = (e && e.detail && e.detail.mes) ? e.detail.mes : getSelectedMonth();
      render(nuevo);
    });
    window.__statsIndicatorsMonthListenerAdded = true;
  }

  return container;
}
