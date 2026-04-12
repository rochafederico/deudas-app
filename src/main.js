// src/main.js
import { initDB } from './shared/database/initDB.js';
import routes from './routes.js';
import AppHeader from './layout/AppHeader.js';
import BottomNav from './layout/BottomNav.js';
import ResumenHeader from './layout/ResumenHeader.js';
import { navItems } from './layout/navConfig.js';
import { TourManager } from './features/tour/TourManager.js';
import { checkAndNotify } from './features/notifications/NotificationService.js';
import { listDeudas } from './features/deudas/deudaRepository.js';
import FeedbackFabComponent from './features/feedback/FeedbackFab.js';

// Wrapper para el contenido principal
document.body.appendChild(AppHeader());
document.body.classList.add('bg-body-tertiary');
// Add bottom padding on mobile so content is not hidden behind the fixed bottom nav
document.body.classList.add('pb-5', 'pb-lg-0');

const wrapper = document.createElement('div');
wrapper.id = 'app-wrapper';
wrapper.className = 'container-xl my-4 p-4 rounded-4 bg-body shadow-sm';

// Global title row: page title + month selector + subtitle
const pageHeader = ResumenHeader();
wrapper.appendChild(pageHeader);

// Contenedor para rutas dinámicas
const app = document.createElement('div');
app.id = 'app';
app.className = 'mt-3';
wrapper.appendChild(app);


document.body.appendChild(wrapper);
document.body.appendChild(BottomNav());
document.body.appendChild(FeedbackFabComponent());

// Initialize the IndexedDB and only after DB is ready render the initial route
initDB().then(async (db) => {
    window.db = db;

    // Inicialización de rutas después que DB esté lista
    renderRoute(window.location.pathname);

    // Verificar y enviar notificaciones de pagos próximos a vencer
    async function runNotificationCheck() {
        try {
            const deudas = await listDeudas();
            await checkAndNotify(deudas);
        } catch (err) {
            console.warn('No se pudo verificar notificaciones:', err);
        }
    }

    await runNotificationCheck();

    // Volver a verificar cada vez que el usuario regresa a la pestaña
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            runNotificationCheck();
        }
    });

    // Iniciar tour guiado en la primera visita (con delay para que el DOM esté listo)
    setTimeout(() => {
        const tour = new TourManager();
        tour.start();
        // Botón "Tour" en el header puede forzar el tour en cualquier momento
        window.addEventListener('tour:start', () => {
            tour._cleanup();
            tour.forceStart();
        });
    }, 500);
});


function renderRoute(path) {
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML = '';

  // Update page header based on current route
  const navItem = navItems.find(item => item.path === path) || navItems[0];
  if (navItem && pageHeader.update) {
    pageHeader.update({ title: navItem.title, subtitle: navItem.subtitle });
  }

  const route = routes.find(r => r.path === path) || routes[0];
  const Component = route.component;
  const node = typeof Component === 'function' ? Component() : Component;
  root.appendChild(node);
}

window.addEventListener('popstate', () => {
  renderRoute(window.location.pathname);
});

// Note: initial renderRoute is triggered after DB init above
