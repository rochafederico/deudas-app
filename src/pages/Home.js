import StatsIndicators from '../features/stats/components/StatsIndicators.js';

export default function Home() {
  const container = document.createElement('div');
  container.className = 'd-flex flex-column gap-3';

  container.appendChild(StatsIndicators());

  const msg = document.createElement('p');
  msg.className = 'text-center text-muted mb-0';
  msg.textContent = 'Bienvenido. Usá el menú para navegar.';

  container.appendChild(msg);
  return container;
}
