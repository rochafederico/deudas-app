// src/components/Menu.js
import routes from '../routes.js';

export class Menu extends HTMLElement {
  constructor() {
    super();
    this.style.display = 'block';
  }

  connectedCallback() {
    this.render();
    this.addEventListener('click', (e) => {
      const link = e.target.closest('[app-link]');
      if (link) {
        e.preventDefault();
        window.history.pushState({}, '', link.getAttribute('href'));
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    });
  }

  render() {
    const routeArray = Array.isArray(routes)
      ? routes
      : Object.entries(routes).map(([path, component]) => ({ path, label: path === '/' ? 'Dashboard' : path.replace('/', ''), component }));

    this.innerHTML = `
      <nav class="nav d-flex gap-2" aria-label="Navegación principal" data-tour-step="menu-navegacion">
        ${routeArray.map(r => `<app-link href="${r.path}" aria-current="${window.location.pathname === r.path ? 'page' : undefined}">${r.label}</app-link>`).join('')}
      </nav>
    `;
  }
}
customElements.define('main-menu', Menu);
