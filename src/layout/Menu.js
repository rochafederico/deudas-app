// src/layout/Menu.js
import { navItems } from './navConfig.js';
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
    this.innerHTML = `
      <ul class="navbar-nav me-auto mb-2 mb-lg-0" aria-label="Navegación principal" data-tour-step="menu-navegacion">
        ${navItems.map(r => {
          const isActive = window.location.pathname === r.path;
          return `
          <li class="nav-item${isActive ? ' active' : ''}"${isActive ? ' aria-current="page"' : ''}>
            <app-link href="${r.path}" variant="light"><span class="fs-5 lh-1">${r.icon}</span> ${r.label}</app-link>
          </li>`;
        }).join('')}
      </ul>
    `;
  }
}
customElements.define('app-nav', AppNav);
