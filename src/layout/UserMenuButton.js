import { openSettingsModal } from './dataActions.js';
import { trackEvent } from '../shared/observability/index.js';

export class UserMenuButton extends HTMLElement {
  connectedCallback() {
    this.render();
    this._onPopoverClick = (e) => {
      if (e.target.closest('[data-user-close]')) {
        this._popover?.hide();
        return;
      }
      if (e.target.closest('[data-user-settings]')) {
        e.preventDefault();
        this._popover?.hide();
        trackEvent('shortcut_used', { flow: 'shortcut', status: 'completed', shortcut: 'open_settings', location: 'header' });
        openSettingsModal(this.querySelector('#user-menu-btn') || document.activeElement);
      }
    };
    document.addEventListener('click', this._onPopoverClick);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._onPopoverClick);
    this._popover?.dispose();
    this._popover = null;
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

  _updatePopover() {
    const btn = this.querySelector('#user-menu-btn');
    if (!btn || !window.bootstrap?.Popover) return;
    if (this._popover) this._popover.dispose();
    this._popover = this._createPopover(btn, {
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
      <button id="user-menu-btn" class="btn btn-primary d-inline-flex align-items-center justify-content-center p-2 rounded-3"
        type="button" title="Menú de usuario" aria-label="Abrir menú de usuario">
        <i class="bi bi-person-circle" aria-hidden="true"></i>
      </button>
    `;
    this._updatePopover();
  }
}

customElements.define('user-menu-button', UserMenuButton);
