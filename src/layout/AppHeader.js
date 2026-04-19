import './DarkToggle.js';
import '../shared/components/AppToast.js';
import { trackEvent } from '../shared/observability/index.js';
import { openSettingsModal } from './dataActions.js';

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
    this._onUpcomingPanel = (e) => this._updateNotificationPopover(e.detail.html, e.detail.todayCount, e.detail.overdueCount);
    this._onPopoverClick = (e) => {
      const link = e.target.closest('[data-notif-navigate]');
      if (link) {
        e.preventDefault();
        this._notificationsPopover?.hide();
        const href = link.getAttribute('href');
        if (href) {
          window.history.pushState({}, '', href);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        return;
      }
      if (e.target.closest('[data-notif-close]')) {
        this._notificationsPopover?.hide();
        return;
      }
      if (e.target.closest('[data-user-close]')) {
        this._userMenuPopover?.hide();
        return;
      }
      if (e.target.closest('[data-user-settings]')) {
        e.preventDefault();
        this._userMenuPopover?.hide();
        trackEvent('shortcut_used', { flow: 'shortcut', status: 'completed', shortcut: 'open_settings', location: 'header' });
        openSettingsModal(this.querySelector('#user-menu-btn') || document.activeElement);
      }
    };
    this.querySelector('.navbar-brand').addEventListener('click', this._onBrandClick);
    this.querySelector('#tour-btn').addEventListener('click', this._onTourClick);
    window.addEventListener('data-imported', this._onDataImported);
    window.addEventListener('app:upcoming-panel', this._onUpcomingPanel);
    document.addEventListener('click', this._onPopoverClick);
  }

  disconnectedCallback() {
    this.querySelector('.navbar-brand')?.removeEventListener('click', this._onBrandClick);
    this.querySelector('#tour-btn')?.removeEventListener('click', this._onTourClick);
    window.removeEventListener('data-imported', this._onDataImported);
    window.removeEventListener('app:upcoming-panel', this._onUpcomingPanel);
    document.removeEventListener('click', this._onPopoverClick);
    this._notificationsPopover?.dispose();
    this._notificationsPopover = null;
    this._userMenuPopover?.dispose();
    this._userMenuPopover = null;
  }

  _updateNotificationPopover(html, _todayCount = 0, overdueCount = 0) {
    const btn = this.querySelector('#notifications-btn');
    if (!btn || !window.bootstrap?.Popover) return;
    if (this._notificationsPopover) this._notificationsPopover.dispose();
    this._notificationsPopover = this._createPopover(btn, {
      html: true,
      title: '<div class="d-flex justify-content-between align-items-center w-100">' +
        '<strong class="text-nowrap me-3">⚠️ Vencimientos próximos</strong>' +
        '<button type="button" class="btn-close btn-sm flex-shrink-0" data-notif-close aria-label="Cerrar"></button>' +
        '</div>',
      content: html,
      trigger: 'click',
      placement: 'bottom',
      container: 'body',
      allowList: {
        ...window.bootstrap.Popover.Default.allowList,
        button: ['type', 'class', 'aria-label', 'data-notif-close'],
        a: [...(window.bootstrap.Popover.Default.allowList.a || []), 'data-notif-navigate'],
      },
      popperConfig(defaultConfig) {
        defaultConfig.placement = 'bottom-end';
        return defaultConfig;
      },
    });
    let badge = btn.querySelector('.notif-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'notif-badge badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle border border-primary';
      badge.setAttribute('aria-label', 'Hay vencimientos próximos');
      btn.appendChild(badge);
    }
    if (overdueCount > 0) {
      badge.textContent = overdueCount;
      badge.classList.remove('p-1');
    } else {
      badge.textContent = '';
      badge.classList.add('p-1');
    }
  }

  _createPopover(btn, options) {
    if (!window.bootstrap?.Popover) return null;
    return new window.bootstrap.Popover(btn, {
      trigger: 'click',
      placement: 'bottom',
      container: 'body',
      popperConfig(defaultConfig) {
        defaultConfig.placement = 'bottom-end';
        return defaultConfig;
      },
      ...options,
    });
  }

  _updateUserMenuPopover() {
    const btn = this.querySelector('#user-menu-btn');
    if (!btn || !window.bootstrap?.Popover) return;
    if (this._userMenuPopover) this._userMenuPopover.dispose();
    this._userMenuPopover = this._createPopover(btn, {
      html: true,
      title: '<div class="d-flex justify-content-between align-items-center w-100">' +
        '<strong class="text-nowrap me-3">👤 Usuario</strong>' +
        '<button type="button" class="btn-close btn-sm flex-shrink-0" data-user-close aria-label="Cerrar"></button>' +
        '</div>',
      content: '<div class="list-group list-group-flush">' +
        '<button type="button" class="list-group-item list-group-item-action" data-user-settings>Configuración</button>' +
        '</div>',
      allowList: {
        ...window.bootstrap.Popover.Default.allowList,
        button: ['type', 'class', 'aria-label', 'data-user-close', 'data-user-settings'],
      },
    });
  }

  render() {
    this.innerHTML = `
      <app-toast></app-toast>
      <nav class="navbar navbar-dark bg-primary px-3 shadow-sm">
        <div class="container-fluid">
          <a class="navbar-brand fw-bold" href="/" aria-label="Inicio" data-tour-step="bienvenida">Nivva</a>
          <div class="ms-auto d-flex align-items-center gap-2">
            <button id="notifications-btn" class="btn btn-primary d-inline-flex align-items-center justify-content-center p-2 rounded-3 position-relative"
              type="button" title="Vencimientos próximos" aria-label="Ver vencimientos próximos">
              <i class="bi bi-bell" aria-hidden="true"></i>
            </button>
            <button id="tour-btn" class="btn btn-primary d-inline-flex align-items-center justify-content-center p-2 rounded-3"
              type="button" title="Abrir guía rápida" aria-label="Abrir guía rápida">
              <i class="bi bi-question-circle" aria-hidden="true"></i>
            </button>
            <button id="user-menu-btn" class="btn btn-primary d-inline-flex align-items-center justify-content-center p-2 rounded-3"
              type="button" title="Menú de usuario" aria-label="Abrir menú de usuario">
              <i class="bi bi-person-circle" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </nav>
    `;
    this._updateUserMenuPopover();
  }
}
customElements.define('app-header', AppHeader);

export default function AppHeaderComponent() {
  return document.createElement('app-header');
}
