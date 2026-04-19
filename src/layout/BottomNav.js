// src/layout/BottomNav.js
// Fixed bottom navigation bar for mobile screens (hidden on lg+)

import { navItems } from './navConfig.js';

export class BottomNav extends HTMLElement {
  connectedCallback() {
    this.render();
    this._onNavClick = (e) => {
      const item = e.target.closest('[data-path]');
      if (!item) return;
      e.preventDefault();
      const path = item.dataset.path;
      if (path && path !== window.location.pathname) {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      this._updateActive();
    };
    this._onPopState = () => this._updateActive();
    this.querySelector('#bottom-nav-list').addEventListener('click', this._onNavClick);
    window.addEventListener('popstate', this._onPopState);
    this._updateActive();
  }

  disconnectedCallback() {
    this.querySelector('#bottom-nav-list')?.removeEventListener('click', this._onNavClick);
    window.removeEventListener('popstate', this._onPopState);
  }

  _updateActive() {
    const path = window.location.pathname;
    const items = this.querySelectorAll('[data-path]');
    items.forEach(item => {
      const itemPath = item.dataset.path;
      const isActive = path === itemPath || (itemPath !== '/' && path.startsWith(itemPath + '/'));
      item.classList.toggle('active', isActive);
      item.classList.toggle('text-white', isActive);
      item.classList.toggle('text-white-50', !isActive);
      item.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  render() {
    const currentPath = window.location.pathname;
    const navItemsHtml = navItems.map(item => {
      const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path + '/'));
      return `
      <button type="button" class="btn btn-link text-decoration-none text-center flex-fill py-2 px-1 d-flex flex-column align-items-center ${isActive ? 'text-white active' : 'text-white-50'}"
        data-path="${item.path}" data-key="${item.key}" aria-label="${item.label}"
        ${isActive ? 'aria-current="page"' : 'aria-current="false"'}>
        <i class="bi ${item.icon} fs-5 lh-1" aria-hidden="true"></i>
        <small class="d-block lh-1 mt-1">${item.label}</small>
      </button>
    `;
    }).join('');

    this.innerHTML = `
      <nav class="navbar fixed-bottom bg-primary d-lg-none py-0 border-top border-primary-subtle shadow"
        aria-label="Navegación móvil">
        <div id="bottom-nav-list" class="container-fluid justify-content-around px-0" data-tour-step="menu-navegacion">
          ${navItemsHtml}
        </div>
      </nav>
    `;
  }
}

customElements.define('bottom-nav', BottomNav);

export default function BottomNavComponent() {
  return document.createElement('bottom-nav');
}
