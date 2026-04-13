import HomeQuickActions from './HomeQuickActions.js';

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

  container.appendChild(HomeQuickActions());
  return container;
}
