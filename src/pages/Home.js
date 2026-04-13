function navigate(path) {
  if (path !== window.location.pathname) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

export default function Home() {
  const container = document.createElement('div');
  container.className = 'd-flex flex-column gap-3';

  const statsSlot = document.createElement('div');
  container.appendChild(statsSlot);

  import('../features/stats/components/StatsIndicators.js')
    .then(({ default: StatsIndicators }) => {
      statsSlot.appendChild(StatsIndicators());
    })
    .catch(() => {
      statsSlot.innerHTML = '<p class="text-muted small">No se pudieron cargar los indicadores.</p>';
    });

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-body">
      <h5 class="card-title"><i class="bi bi-lightning-charge" aria-hidden="true"></i> Acciones rápidas</h5>
      <p class="card-text text-body-secondary">Elegí qué querés hacer hoy</p>
      <div class="d-flex justify-content-start flex-wrap gap-3 mt-3">
        <a href="/ingresos" class="btn btn-outline-success"><i class="bi bi-plus-circle" aria-hidden="true"></i> Agregar ingreso</a>
        <a href="/gastos" class="btn btn-outline-danger"><i class="bi bi-plus-circle" aria-hidden="true"></i> Agregar egreso</a>
        <a href="/inversiones" class="btn btn-outline-primary"><i class="bi bi-graph-up" aria-hidden="true"></i> Ver inversiones</a>
      </div>
    </div>
  `;
  card.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.getAttribute('href'));
    });
  });

  container.appendChild(card);
  return container;
}
