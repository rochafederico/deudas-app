// src/components/StatsIndicators.js
import StatsCard from './StatsCard.js';
import { getMonthlySummary } from '../utils/stats.js';

export default function StatsIndicators({ mes } = {}) {
  const container = document.createElement('div');
  container.className = 'stats-row';

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
      const ingresosCard = StatsCard({ title: 'Ingresos del mes', subtitle: 'Total registrado por moneda', value: addValue(summary.byCurrency.ingresos), color: 'var(--success)' });
      const egresosCard = StatsCard({ title: 'Gastos del mes', subtitle: 'Gastos acumulados por moneda', value: addValue(summary.byCurrency.egresos), color: '#d9534f' });
      const saldoCard = StatsCard({ title: 'Balance del mes', subtitle: 'Diferencia entre ingresos y egresos', value: addValue(summary.byCurrency.saldo), color: 'var(--dark)' });
      const pendienteCard = StatsCard({ title: 'Total a pagar', subtitle: 'Compromisos pendientes de pago', value: addValue(summary.byCurrency.pendientes), color: '#f0ad4e' });

      container.appendChild(ingresosCard);
      container.appendChild(egresosCard);
      container.appendChild(saldoCard);
      container.appendChild(pendienteCard);
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
