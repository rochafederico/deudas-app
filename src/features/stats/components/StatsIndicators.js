// src/components/StatsIndicators.js
import StatsCard from './StatsCard.js';
import { getMonthlySummary } from '../statsService.js';

export default function StatsIndicators({ mes } = {}) {
  const container = document.createElement('div');
  container.className = 'row row-cols-1 row-cols-md-3 row-cols-lg-5 g-3 stats-row';
  container.setAttribute('data-tour-step', 'indicadores');

  const format = n => n == null ? '-' : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Render helper
  async function render(periodo) {
    container.innerHTML = '';
    const loading = document.createElement('div');
    loading.className = 'stats-loading';
    loading.textContent = 'Cargando resumen...';
    container.appendChild(loading);

    try {
      const summary = await getMonthlySummary(periodo);
      container.innerHTML = '';

      // Only show per-currency breakdowns (no aggregated totals)
      const addValue = (obj) => {
        return Object.entries(obj || {})
          .map(([moneda, monto]) => `${moneda}: $ ${format(monto)}`)
          .join('<br/>');
      }
      const cards = [
        StatsCard({ title: 'Ingresos' , value: addValue(summary.byCurrency.ingresos), color: 'var(--success)' }),
        StatsCard({ title: 'Gastos', value: addValue(summary.byCurrency.egresos), color: '#d9534f' }),
        StatsCard({ title: 'Balance', value: addValue(summary.byCurrency.saldo), color: 'var(--dark)' }),
        StatsCard({ title: 'Total a pagar', value: addValue(summary.byCurrency.pendientes), color: '#f0ad4e' }),
        StatsCard({ title: 'Inversiones', value: addValue(summary.inversiones), color: '#5bc0de' }),
      ];
      cards.forEach(card => {
        const col = document.createElement('div');
        col.className = 'col';
        col.appendChild(card);
        container.appendChild(col);
      });
    } catch (err) {
      container.innerHTML = '';
      const errEl = document.createElement('div');
      errEl.className = 'stats-error';
      errEl.textContent = 'Error cargando resumen';
      container.appendChild(errEl);
      console.error('Error getMonthlySummary', err);
    }
  }

  const initialPeriodo = mes || new Date().toISOString().slice(0, 7);
  render(initialPeriodo);

  // Avoid adding multiple global listeners if this module is imported more than once
  if (!window.__statsIndicatorsMonthListenerAdded) {
    window.addEventListener('month-change', (e) => {
      const nuevo = (e && e.detail && e.detail.mes) ? e.detail.mes : new Date().toISOString().slice(0, 7);
      render(nuevo);
    });
    window.__statsIndicatorsMonthListenerAdded = true;
  }

  return container;
}
