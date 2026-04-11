import './Menu.js';
import './DarkToggle.js';
import '../shared/components/AppToast.js';
import { openExportModal, openImportModal, deleteAllData } from './dataActions.js';
import { trackEvent } from '../shared/observability/index.js';

export class AppHeader extends HTMLElement {
  connectedCallback() {
    this.classList.add('d-block');
    this.render();
    this._onBrandClick = (e) => {
      e.preventDefault();
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    };
    this._onTourClick = () => {
      trackEvent('shortcut_used', { flow: 'shortcut', status: 'completed', shortcut: 'tour', location: 'header' });
      window.dispatchEvent(new CustomEvent('tour:start'));
    };
    this._onDataImported = () => window.dispatchEvent(new CustomEvent('ui:refresh'));
    this._onUpcomingPanel = (e) => this._updateNotificationPopover(e.detail.html, e.detail.todayCount);
    this._onNotifPopoverClick = (e) => {
      const link = e.target.closest('[data-notif-navigate]');
      if (link) {
        e.preventDefault();
        this._popover?.hide();
        const path = new URL(link.href).pathname;
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
        return;
      }
      if (e.target.closest('[data-notif-close]')) {
        this._popover?.hide();
      }
    };
    this._onDesktopExportClick = (e) => {
      e.preventDefault();
      trackEvent('shortcut_used', { flow: 'shortcut', status: 'completed', shortcut: 'export_data', location: 'header' });
      openExportModal(this.querySelector('#desktop-datos-toggle') || document.activeElement);
    };
    this._onDesktopImportClick = (e) => {
      e.preventDefault();
      trackEvent('shortcut_used', { flow: 'shortcut', status: 'completed', shortcut: 'import_data', location: 'header' });
      openImportModal(this.querySelector('#desktop-datos-toggle') || document.activeElement);
    };
    this._onDesktopDeleteClick = (e) => {
      e.preventDefault();
      trackEvent('shortcut_used', { flow: 'shortcut', status: 'completed', shortcut: 'delete_all_data', location: 'header' });
      deleteAllData();
    };
    this.querySelector('.navbar-brand').addEventListener('click', this._onBrandClick);
    this.querySelector('#tour-btn').addEventListener('click', this._onTourClick);
    this.querySelector('#desktop-export')?.addEventListener('click', this._onDesktopExportClick);
    this.querySelector('#desktop-import')?.addEventListener('click', this._onDesktopImportClick);
    this.querySelector('#desktop-delete')?.addEventListener('click', this._onDesktopDeleteClick);
    window.addEventListener('data-imported', this._onDataImported);
    window.addEventListener('app:upcoming-panel', this._onUpcomingPanel);
    document.addEventListener('click', this._onNotifPopoverClick);
  }

  disconnectedCallback() {
    this.querySelector('.navbar-brand')?.removeEventListener('click', this._onBrandClick);
    this.querySelector('#tour-btn')?.removeEventListener('click', this._onTourClick);
    this.querySelector('#desktop-export')?.removeEventListener('click', this._onDesktopExportClick);
    this.querySelector('#desktop-import')?.removeEventListener('click', this._onDesktopImportClick);
    this.querySelector('#desktop-delete')?.removeEventListener('click', this._onDesktopDeleteClick);
    window.removeEventListener('data-imported', this._onDataImported);
    window.removeEventListener('app:upcoming-panel', this._onUpcomingPanel);
    document.removeEventListener('click', this._onNotifPopoverClick);
    this._popover?.dispose();
    this._popover = null;
  }

  _updateNotificationPopover(html, todayCount = 0) {
    const btn = this.querySelector('#notifications-btn');
    if (!btn || !window.bootstrap?.Popover) return;
    if (this._popover) this._popover.dispose();
    this._popover = new window.bootstrap.Popover(btn, {
      html: true,
      title: '<div class="d-flex justify-content-between align-items-center w-100">' +
        '<strong>⚠️ Vencimientos próximos</strong>' +
        '<button type="button" class="btn-close btn-sm ms-3" data-notif-close aria-label="Cerrar"></button>' +
        '</div>',
      content: html,
      trigger: 'click',
      placement: 'bottom',
      container: 'body',
    });
    let badge = btn.querySelector('.notif-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'notif-badge badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle border border-primary';
      badge.setAttribute('aria-label', 'Hay vencimientos próximos');
      btn.appendChild(badge);
    }
    if (todayCount > 0) {
      badge.textContent = todayCount;
      badge.style.padding = '';
    } else {
      badge.textContent = '';
      badge.style.padding = '0.25em 0.4em';
    }
  }

  render() {
    this.innerHTML = `
      <app-toast></app-toast>
      <nav class="navbar navbar-dark navbar-expand-lg bg-primary px-3 shadow-sm">
        <div class="container-fluid">
          <a class="navbar-brand fw-bold" href="/" aria-label="Inicio" data-tour-step="bienvenida">Nivva</a>
          <div class="d-none d-lg-flex align-items-center flex-grow-1 ms-3">
            <app-nav></app-nav>
            <ul class="navbar-nav align-items-center ms-auto">
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle px-2" href="#" id="desktop-datos-toggle" role="button"
                  data-bs-toggle="dropdown" aria-expanded="false" data-tour-step="config">⚙️ Ajustes</a>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item" href="#" id="desktop-export">📤 Exportar datos</a></li>
                  <li><a class="dropdown-item" href="#" id="desktop-import">📥 Importar datos</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger" href="#" id="desktop-delete">🗑️ Eliminar todo</a></li>
                </ul>
              </li>
            </ul>
          </div>
          <div class="ms-auto ms-lg-3 d-flex align-items-center gap-2">
            <button id="notifications-btn" class="btn btn-outline-light fs-5 p-1 position-relative" type="button" title="Vencimientos próximos" aria-label="Ver vencimientos próximos">🔔</button>
            <button id="tour-btn" class="btn btn-light btn-sm" type="button" title="Abrir guía rápida" aria-label="Abrir guía rápida">❓</button>
          </div>
        </div>
      </nav>
    `;
  }
}
customElements.define('app-header', AppHeader);

export default function AppHeaderComponent() {
  return document.createElement('app-header');
}
