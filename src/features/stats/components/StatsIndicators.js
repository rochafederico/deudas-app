// src/components/StatsIndicators.js
import StatsCard from './StatsCard.js';
import { getMonthlySummary } from '../statsService.js';

export default function StatsIndicators({ mes } = {}) {
  const container = document.createElement('div');
  container.className = 'row g-2 mb-3';
  container.setAttribute('data-tour-step', 'indicadores');

  const format = n => n == null ? '-' : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

      // Always render ARS and USD rows; show "-" when value is absent or zero
      const CURRENCIES = ['ARS', 'USD'];
      const addValue = (obj) => {
        return CURRENCIES.map(moneda => {
          const monto = obj ? obj[moneda] : undefined;
          const val = (monto == null || monto === 0) ? '-' : `$ ${format(monto)}`;
          return `${moneda}: ${val}`;
        });
      };
      const cards = [
        StatsCard({ title: 'Ingresos' , items: addValue(summary.byCurrency.ingresos), color: 'success' }),
        StatsCard({ title: 'Gastos', items: addValue(summary.byCurrency.egresos), color: 'danger' }),
        StatsCard({ title: 'Balance', items: addValue(summary.byCurrency.saldo), color: 'primary' }),
        StatsCard({ title: 'Total a pagar', items: addValue(summary.byCurrency.pendientes), color: 'warning' }),
        StatsCard({ title: 'Inversiones', items: addValue(summary.inversiones), color: 'info' }),
      ];
      cards.forEach(card => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-4';
        col.appendChild(card);
        container.appendChild(col);
      });
    } catch (err) {
      container.innerHTML = '';
      const errEl = document.createElement('div');
      errEl.className = 'col-12 text-danger px-2';
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
