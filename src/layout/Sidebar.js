// src/layout/Sidebar.js
// Desktop-only left sidebar navigation (hidden on mobile, visible on lg+)

import { navItems } from './navConfig.js';
import { openExportModal, openImportModal, deleteAllData } from './dataActions.js';
import { trackEvent } from '../shared/observability/index.js';

export class AppSidebar extends HTMLElement {
  connectedCallback() {
    this.classList.add('d-none', 'd-lg-flex', 'flex-column', 'h-100');
    this.render();
    this._onNavClick = (e) => {
      const link = e.target.closest('[data-path]');
      if (!link) return;
      e.preventDefault();
      const path = link.dataset.path;
      if (path && path !== window.location.pathname) {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      this._updateActive();
    };
    this._onPopState = () => this._updateActive();
    this._onExportClick = (e) => {
      e.preventDefault();
      trackEvent('shortcut_used', { flow: 'shortcut', status: 'completed', shortcut: 'export_data', location: 'sidebar' });
      openExportModal(this.querySelector('#sidebar-ajustes-toggle') || document.activeElement);
    };
    this._onImportClick = (e) => {
      e.preventDefault();
      trackEvent('shortcut_used', { flow: 'shortcut', status: 'completed', shortcut: 'import_data', location: 'sidebar' });
      openImportModal(this.querySelector('#sidebar-ajustes-toggle') || document.activeElement);
    };
    this._onDeleteClick = (e) => {
      e.preventDefault();
      trackEvent('shortcut_used', { flow: 'shortcut', status: 'completed', shortcut: 'delete_all_data', location: 'sidebar' });
      deleteAllData();
    };
    this.querySelector('#sidebar-nav').addEventListener('click', this._onNavClick);
    this.querySelector('#sidebar-export')?.addEventListener('click', this._onExportClick);
    this.querySelector('#sidebar-import')?.addEventListener('click', this._onImportClick);
    this.querySelector('#sidebar-delete')?.addEventListener('click', this._onDeleteClick);
    window.addEventListener('popstate', this._onPopState);
    this._updateActive();
  }

  disconnectedCallback() {
    this.querySelector('#sidebar-nav')?.removeEventListener('click', this._onNavClick);
    this.querySelector('#sidebar-export')?.removeEventListener('click', this._onExportClick);
    this.querySelector('#sidebar-import')?.removeEventListener('click', this._onImportClick);
    this.querySelector('#sidebar-delete')?.removeEventListener('click', this._onDeleteClick);
    window.removeEventListener('popstate', this._onPopState);
  }

  _updateActive() {
    const path = window.location.pathname;
    this.querySelectorAll('[data-path]').forEach(item => {
      const itemPath = item.dataset.path;
      const isActive = path === itemPath || (itemPath !== '/' && path.startsWith(itemPath + '/'));
      item.classList.toggle('active', isActive);
      item.classList.toggle('text-body', !isActive);
      if (isActive) {
        item.setAttribute('aria-current', 'page');
      } else {
        item.removeAttribute('aria-current');
      }
    });
  }

  render() {
    const currentPath = window.location.pathname;
    const navHtml = navItems.map(item => {
      const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path + '/'));
      return `
      <li class="nav-item">
        <a href="${item.path}"
          class="nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3${isActive ? ' active' : ' text-body'}"
          data-path="${item.path}" data-key="${item.key}" aria-label="${item.label}"
          ${isActive ? 'aria-current="page"' : ''}>
          <i class="bi ${item.icon} fs-5" aria-hidden="true"></i>
          <span>${item.label}</span>
        </a>
      </li>
    `;
    }).join('');

    this.innerHTML = `
      <nav id="sidebar-nav" class="flex-grow-1 py-3 px-2"
        aria-label="Navegación principal" data-tour-step="menu-navegacion">
        <ul class="nav nav-pills flex-column gap-1 list-unstyled mb-0">
          ${navHtml}
        </ul>
      </nav>
      <div class="border-top px-2 py-3">
        <div class="dropdown dropup">
          <button id="sidebar-ajustes-toggle"
            class="nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-body w-100 bg-transparent border-0"
            type="button" data-bs-toggle="dropdown" aria-expanded="false"
            data-tour-step="config" aria-label="Ajustes">
            <i class="bi bi-gear fs-5" aria-hidden="true"></i>
            <span>Ajustes</span>
          </button>
          <ul class="dropdown-menu" aria-labelledby="sidebar-ajustes-toggle">
            <li><a class="dropdown-item" href="#" id="sidebar-export"><i class="bi bi-upload" aria-hidden="true"></i> Exportar datos</a></li>
            <li><a class="dropdown-item" href="#" id="sidebar-import"><i class="bi bi-download" aria-hidden="true"></i> Importar datos</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" id="sidebar-delete"><i class="bi bi-trash" aria-hidden="true"></i> Eliminar todo</a></li>
          </ul>
        </div>
      </div>
    `;
  }
}

customElements.define('app-sidebar', AppSidebar);

export default function SidebarComponent() {
  return document.createElement('app-sidebar');
}
