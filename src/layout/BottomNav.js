// src/layout/BottomNav.js
// Fixed bottom navigation bar for mobile screens (hidden on lg+)

import { navItems } from './navConfig.js';
import { openExportModal, openImportModal, deleteAllData } from './dataActions.js';
import { trackEvent } from '../shared/observability/index.js';

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
    this._onExportClick = (e) => {
      e.preventDefault();
      trackEvent('shortcut_used', { flow: 'shortcut', status: 'completed', shortcut: 'export_data', location: 'bottom_nav' });
      openExportModal(this.querySelector('#bottom-nav-ajustes-toggle') || document.activeElement);
    };
    this._onImportClick = (e) => {
      e.preventDefault();
      trackEvent('shortcut_used', { flow: 'shortcut', status: 'completed', shortcut: 'import_data', location: 'bottom_nav' });
      openImportModal(this.querySelector('#bottom-nav-ajustes-toggle') || document.activeElement);
    };
    this._onDeleteClick = (e) => {
      e.preventDefault();
      trackEvent('shortcut_used', { flow: 'shortcut', status: 'completed', shortcut: 'delete_all_data', location: 'bottom_nav' });
      deleteAllData();
    };
    this.querySelector('#bottom-nav-list').addEventListener('click', this._onNavClick);
    this.querySelector('#bottom-nav-export')?.addEventListener('click', this._onExportClick);
    this.querySelector('#bottom-nav-import')?.addEventListener('click', this._onImportClick);
    this.querySelector('#bottom-nav-delete')?.addEventListener('click', this._onDeleteClick);
    window.addEventListener('popstate', this._onPopState);
    this._updateActive();
  }

  disconnectedCallback() {
    this.querySelector('#bottom-nav-list')?.removeEventListener('click', this._onNavClick);
    this.querySelector('#bottom-nav-export')?.removeEventListener('click', this._onExportClick);
    this.querySelector('#bottom-nav-import')?.removeEventListener('click', this._onImportClick);
    this.querySelector('#bottom-nav-delete')?.removeEventListener('click', this._onDeleteClick);
    window.removeEventListener('popstate', this._onPopState);
  }

  _updateActive() {
    const path = window.location.pathname;
    const items = this.querySelectorAll('[data-path]');
    items.forEach(item => {
      const itemPath = item.dataset.path;
      const isActive = itemPath === path;
      item.classList.toggle('active', isActive);
      item.classList.toggle('text-white', isActive);
      item.classList.toggle('text-white-50', !isActive);
      item.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  render() {
    const currentPath = window.location.pathname;
    const navItemsHtml = navItems.map(item => {
      const isActive = item.path === currentPath;
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
          <div class="dropdown dropup flex-fill d-flex justify-content-center">
            <button id="bottom-nav-ajustes-toggle"
              class="btn btn-link text-white text-decoration-none text-center w-100 py-2 px-1 d-flex flex-column align-items-center"
              type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Ajustes">
              <i class="bi bi-gear fs-5 lh-1" aria-hidden="true"></i>
              <small class="d-block lh-1 mt-1">Ajustes</small>
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="bottom-nav-ajustes-toggle">
              <li><a class="dropdown-item" href="#" id="bottom-nav-export"><i class="bi bi-upload" aria-hidden="true"></i> Exportar datos</a></li>
              <li><a class="dropdown-item" href="#" id="bottom-nav-import"><i class="bi bi-download" aria-hidden="true"></i> Importar datos</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="#" id="bottom-nav-delete"><i class="bi bi-trash" aria-hidden="true"></i> Eliminar todo</a></li>
            </ul>
          </div>
        </div>
      </nav>
    `;
  }
}

customElements.define('bottom-nav', BottomNav);

export default function BottomNavComponent() {
  return document.createElement('bottom-nav');
}
