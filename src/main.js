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

// Initialize the IndexedDB
initDB().then((db) => {
    window.db = db;
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

function navigateTo(path) {
  window.history.pushState({}, '', path);
  renderRoute(path);
}

window.addEventListener('popstate', () => {
  renderRoute(window.location.pathname);
});

document.addEventListener('click', function(e) {
  const link = e.target.closest('[app-link]');
  if (link) {
    e.preventDefault();
    navigateTo(link.getAttribute('href'));
  }
});

// Inicialización
renderRoute(window.location.pathname);