// src/utils/stats.js
// Utilities to compute monthly financial summaries using existing repositories
export async function getMonthlySummary(mes) {
  // mes expected as 'YYYY-MM' string. If not provided, use current month
  const periodo = mes || new Date().toISOString().slice(0, 7);
  const { sumIngresosByMonth } = await import('../repository/ingresoRepository.js');
  const { countMontosByMes } = await import('../repository/montoRepository.js');
  const { listInversiones } = await import('../repository/inversionRepository.js');

  const ingresos = await sumIngresosByMonth({ mes: periodo });
  const montos = await countMontosByMes({ mes: periodo });
  const inversiones = await listInversiones();

  // Totales por moneda (desglose)
  const monedas = new Set([
    ...Object.keys(ingresos || {}),
    ...Object.keys(montos.totalesPagados || {}),
    ...Object.keys(montos.totalesPendientes || {})
  ]);

  const ingresosByCurrency = {};
  const egresosByCurrency = {};
  const saldoByCurrency = {};
  const pagadosByCurrency = {};
  const pendientesByCurrency = {};
  monedas.forEach(m => {
    const ing = Number(ingresos[m] || 0);
    const pag = Number((montos.totalesPagados && montos.totalesPagados[m]) || 0);
    const pen = Number((montos.totalesPendientes && montos.totalesPendientes[m]) || 0);
    const eg = pag + pen;
    ingresosByCurrency[m] = ing;
    egresosByCurrency[m] = eg;
    saldoByCurrency[m] = ing - eg;
    pagadosByCurrency[m] = pag;
    pendientesByCurrency[m] = pen;
  });

  const totalInversiones = inversiones.reduce((sum, inv) => {
    if (inv.moneda) {
      sum[inv.moneda] = (sum[inv.moneda] || 0) + inv.valorInicial;
    } else {
      sum.ARS = sum.ARS + inv.valorInicial;
    }
    return sum;
  }, { ARS: 0, USD: 0 });

  const totalInversionesActual = inversiones.reduce((sum, inv) => {
    if (inv.historialValores.length === 0) {
      sum.ARS = sum.ARS + inv.valorInicial;
      return sum;
    }
    const lastValor = inv.historialValores[inv.historialValores.length - 1].valor;
    if (inv.moneda) {
      sum[inv.moneda] = (sum[inv.moneda] || 0) + lastValor;
    } else {
      sum.ARS = sum.ARS +lastValor;
    }
    return sum
  }, { ARS: 0, USD: 0 });
debugger
  return {
    periodo,
    raw: { ingresos, totalesPagados: montos.totalesPagados, totalesPendientes: montos.totalesPendientes },
    byCurrency: {
      ingresos: ingresosByCurrency,
      egresos: egresosByCurrency,
      saldo: saldoByCurrency,
      pagados: pagadosByCurrency,
      pendientes: pendientesByCurrency
    },
    inversiones: {
      ARS: totalInversionesActual.ARS - totalInversiones.ARS,
      USD: totalInversionesActual.USD - totalInversiones.USD
    }
  };
}
