import StatsIndicators from '../features/stats/components/StatsIndicators.js';

function navigate(path) {
  if (path !== window.location.pathname) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

export default function Home() {
  const container = document.createElement('div');
  container.className = 'd-flex flex-column gap-3';

  container.appendChild(StatsIndicators());

  const card = document.createElement('div');
  card.className = 'card text-center';
  card.innerHTML = `
    <div class="card-body">
      <h5 class="card-title">⚡ Acciones rápidas</h5>
      <p class="card-text">Elegí qué querés hacer hoy</p>
      <a href="/egresos" class="btn btn-primary">💳 Gestionar gastos</a>
      <a href="/ingresos" class="btn btn-primary">💰 Registrar ingresos</a>
      <a href="/inversiones" class="btn btn-primary">📈 Seguimiento de inversiones</a>
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
