// src/layout/Menu.js
import routes from '../routes.js';
import '../shared/components/AppLink.js';

export class AppNav extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
    // Re-render on navigation to keep active state in sync
    this._onPopState = () => this.render();
    window.addEventListener('popstate', this._onPopState);
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this._onPopState);
  }

  render() {
    const routeArray = Array.isArray(routes)
      ? routes
      : Object.entries(routes).map(([path, component]) => ({ path, label: path === '/' ? 'Dashboard' : path.replace('/', ''), component }));

    this.innerHTML = `
      <ul class="navbar-nav me-auto mb-2 mb-lg-0" aria-label="Navegación principal" data-tour-step="menu-navegacion">
        ${routeArray.map(r => `
          <li class="nav-item${window.location.pathname === r.path ? ' active' : ''}">
            <app-link href="${r.path}">${r.label}</app-link>
          </li>`).join('')}
      </ul>
    `;
  }
}
customElements.define('app-nav', AppNav);
