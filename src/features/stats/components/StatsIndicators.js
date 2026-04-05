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

      // Row 1: Balance + Total a pagar
      const row1 = document.createElement('div');
      row1.className = 'row g-3 mb-3';

      const balanceCol = document.createElement('div');
      balanceCol.className = 'col-12 col-md-6';
      balanceCol.appendChild(StatsCard({ title: 'Balance', items: addValue(summary.byCurrency.saldo), color: 'primary' }));
      row1.appendChild(balanceCol);

      const totalCol = document.createElement('div');
      totalCol.className = 'col-12 col-md-6';
      totalCol.appendChild(StatsCard({ title: 'Total a pagar', items: addValue(summary.byCurrency.pendientes), color: 'warning' }));
      row1.appendChild(totalCol);

      // Row 2: Ingresos + Gastos + Inversiones
      const row2 = document.createElement('div');
      row2.className = 'row g-3';

      const ingresosCol = document.createElement('div');
      ingresosCol.className = 'col-12 col-md-4';
      ingresosCol.appendChild(StatsCard({ title: 'Ingresos', items: addValue(summary.byCurrency.ingresos), color: 'success' }));
      row2.appendChild(ingresosCol);

      const gastosCol = document.createElement('div');
      gastosCol.className = 'col-12 col-md-4';
      gastosCol.appendChild(StatsCard({ title: 'Gastos', items: addValue(summary.byCurrency.egresos), color: 'danger' }));
      row2.appendChild(gastosCol);

      const inversionesCol = document.createElement('div');
      inversionesCol.className = 'col-12 col-md-4';
      inversionesCol.appendChild(StatsCard({ title: 'Inversiones', items: addValue(summary.inversiones), color: 'info' }));
      row2.appendChild(inversionesCol);

      container.appendChild(row1);
      container.appendChild(row2);
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
