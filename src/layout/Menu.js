// src/components/Menu.js
import routes from '../routes.js';
import { injectBootstrap } from '../shared/utils/bootstrapStyles.js';

export class Menu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener('click', (e) => {
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

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        nav {
          display: flex;
          gap: 0.5rem;
        }
      </style>
      <nav class="nav" aria-label="Navegación principal" data-tour-step="menu-navegacion">
        ${routeArray.map(r => `<app-link href="${r.path}" aria-current="${window.location.pathname === r.path ? 'page' : undefined}">${r.label}</app-link>`).join('')}
      </nav>
    `;
    injectBootstrap(this.shadowRoot);
  }
}
customElements.define('main-menu', Menu);
