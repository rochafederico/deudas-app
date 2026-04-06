// src/layout/BottomNav.js
// Fixed bottom navigation bar for mobile screens (hidden on lg+)

import { openExportModal, openImportModal, deleteAllData } from './dataActions.js';

const bottomNavItems = [
  { label: 'Egresos', icon: '💸', path: '/', key: 'egresos' },
  { label: 'Ingresos', icon: '💰', path: '/ingresos', key: 'ingresos' },
  { label: 'Inversiones', icon: '📈', path: '/inversiones', key: 'inversiones' },
];

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
      const returnFocus = this.querySelector('[data-bs-toggle="offcanvas"]') || document.activeElement;
      this._closeOffcanvas();
      openExportModal(returnFocus);
    };
    this._onImportClick = (e) => {
      e.preventDefault();
      const returnFocus = this.querySelector('[data-bs-toggle="offcanvas"]') || document.activeElement;
      this._closeOffcanvas();
      openImportModal(returnFocus);
    };
    this._onDeleteAllClick = (e) => {
      e.preventDefault();
      this._closeOffcanvas();
      deleteAllData();
    };
    this.querySelector('#bottom-nav-list').addEventListener('click', this._onNavClick);
    window.addEventListener('popstate', this._onPopState);
    this.querySelector('#bottom-nav-export')?.addEventListener('click', this._onExportClick);
    this.querySelector('#bottom-nav-import')?.addEventListener('click', this._onImportClick);
    this.querySelector('#bottom-nav-delete')?.addEventListener('click', this._onDeleteAllClick);
    this._updateActive();
  }

  disconnectedCallback() {
    this.querySelector('#bottom-nav-list')?.removeEventListener('click', this._onNavClick);
    window.removeEventListener('popstate', this._onPopState);
    this.querySelector('#bottom-nav-export')?.removeEventListener('click', this._onExportClick);
    this.querySelector('#bottom-nav-import')?.removeEventListener('click', this._onImportClick);
    this.querySelector('#bottom-nav-delete')?.removeEventListener('click', this._onDeleteAllClick);
  }

  _closeOffcanvas() {
    const offcanvas = this.querySelector('#mas-offcanvas');
    if (offcanvas && window.bootstrap?.Offcanvas) {
      const instance = window.bootstrap.Offcanvas.getInstance(offcanvas);
      instance?.hide();
    }
  }

  _updateActive() {
    const path = window.location.pathname;
    const items = this.querySelectorAll('[data-path]');
    items.forEach(item => {
      const itemPath = item.dataset.path;
      const isActive = itemPath === path;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  render() {
    const navItems = bottomNavItems.map(item => `
      <button type="button" class="btn btn-link text-white text-decoration-none text-center flex-fill py-2 px-1 d-flex flex-column align-items-center"
        data-path="${item.path}" data-key="${item.key}" aria-label="${item.label}">
        <span class="fs-5 lh-1">${item.icon}</span>
        <small class="d-block lh-1 mt-1">${item.label}</small>
      </button>
    `).join('');

    this.innerHTML = `
      <nav class="navbar fixed-bottom bg-primary d-lg-none py-0 border-top border-primary-subtle shadow"
        aria-label="Navegación móvil">
        <div id="bottom-nav-list" class="container-fluid justify-content-around px-0">
          ${navItems}
          <button type="button"
            class="btn btn-link text-white text-decoration-none text-center flex-fill py-2 px-1 d-flex flex-column align-items-center"
            data-bs-toggle="offcanvas" data-bs-target="#mas-offcanvas"
            aria-controls="mas-offcanvas" aria-label="Configuración">
            <span class="fs-5 lh-1">⚙️</span>
            <small class="d-block lh-1 mt-1">Config</small>
          </button>
        </div>
      </nav>

      <div class="offcanvas offcanvas-bottom" id="mas-offcanvas" tabindex="-1"
        aria-labelledby="mas-offcanvas-label" style="height:auto">
        <div class="offcanvas-header bg-primary text-white">
          <h5 class="offcanvas-title" id="mas-offcanvas-label">Configuración</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
        </div>
        <div class="offcanvas-body pb-4">
          <div class="list-group list-group-flush">
            <a href="#" id="bottom-nav-export" class="list-group-item list-group-item-action d-flex align-items-center gap-2">
              📤 Exportar datos
            </a>
            <a href="#" id="bottom-nav-import" class="list-group-item list-group-item-action d-flex align-items-center gap-2">
              📥 Importar datos
            </a>
            <a href="#" id="bottom-nav-delete" class="list-group-item list-group-item-action text-danger d-flex align-items-center gap-2">
              🗑️ Eliminar todo
            </a>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('bottom-nav', BottomNav);

export default function BottomNavComponent() {
  return document.createElement('bottom-nav');
}
