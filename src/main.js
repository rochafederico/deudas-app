// src/main.js
import { initDB } from './shared/database/initDB.js';
import routes from './routes.js';
import DemoBanner from './layout/DemoBanner.js';
import { TourManager } from './features/tour/TourManager.js';

// Wrapper para el contenido principal
document.body.appendChild(DemoBanner());
document.body.classList.add('bg-body-tertiary');

const wrapper = document.createElement('div');
wrapper.id = 'app-wrapper';
wrapper.className = 'container-xl my-4 p-4 rounded-4 bg-body shadow-sm';

// Contenedor para rutas dinámicas
const app = document.createElement('div');
app.id = 'app';
app.className = 'mt-3';
wrapper.appendChild(app);


document.body.appendChild(wrapper);

// Initialize the IndexedDB and only after DB is ready render indicators + initial route
initDB().then(async (db) => {
    window.db = db;
    try {
      const { default: StatsIndicators } = await import('./features/stats/components/StatsIndicators.js');
      const indicatorsNode = StatsIndicators();
      // Insert indicators above the app container
      wrapper.insertBefore(indicatorsNode, app);
    } catch (err) {
      console.warn('No se pudo cargar StatsIndicators:', err);
    }
    // Inicialización de rutas después que DB esté lista y los indicadores hayan pedido datos
    renderRoute(window.location.pathname);

    // Iniciar tour guiado en la primera visita (con delay para que el DOM esté listo)
    setTimeout(() => {
        const tour = new TourManager();
        tour.start();
        // Botón "Tour" en el header puede forzar el tour en cualquier momento
        window.addEventListener('tour:start', () => new TourManager().forceStart());
    }, 500);
});


function renderRoute(path) {
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML = '';
  const route = routes.find(r => r.path === path) || routes[0];
  const Component = route.component;
  const node = typeof Component === 'function' ? Component() : Component;
  root.appendChild(node);
}

window.addEventListener('popstate', () => {
  renderRoute(window.location.pathname);
});

// Note: initial renderRoute is triggered after DB init above
