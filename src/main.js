// src/main.js
import initDB from './db.js';
import routes from './routes.js';
import DemoBanner from './components/DemoBanner.js';

// Wrapper para el contenido principal
document.body.appendChild(DemoBanner());

const wrapper = document.createElement('div');
wrapper.id = 'app-wrapper';
wrapper.style.cssText = '';

// Contenedor para rutas dinámicas
const app = document.createElement('div');
app.id = 'app';
wrapper.appendChild(app);

document.body.appendChild(wrapper);

// Initialize the IndexedDB and only after DB is ready render indicators + initial route
initDB().then(async (db) => {
    window.db = db;
    try {
      const { default: StatsIndicators } = await import('./components/StatsIndicators.js');
      const indicatorsNode = StatsIndicators();
      // Insert indicators above the app container
      wrapper.insertBefore(indicatorsNode, app);
    } catch (err) {
      console.warn('No se pudo cargar StatsIndicators:', err);
    }
    // Inicialización de rutas después que DB esté lista y los indicadores hayan pedido datos
    renderRoute(window.location.pathname);
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