import './DarkToggle.js';
import './NotificationsButton.js';
import './UserMenuButton.js';
import '../shared/components/AppToast.js';
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
    this.querySelector('.navbar-brand').addEventListener('click', this._onBrandClick);
    this.querySelector('#tour-btn').addEventListener('click', this._onTourClick);
    window.addEventListener('data-imported', this._onDataImported);
  }

  disconnectedCallback() {
    this.querySelector('.navbar-brand')?.removeEventListener('click', this._onBrandClick);
    this.querySelector('#tour-btn')?.removeEventListener('click', this._onTourClick);
    window.removeEventListener('data-imported', this._onDataImported);
  }

  render() {
    this.innerHTML = `
      <app-toast></app-toast>
      <nav class="navbar navbar-dark bg-primary px-3 shadow-sm">
        <div class="container-fluid">
          <a class="navbar-brand fw-bold" href="/" aria-label="Inicio" data-tour-step="bienvenida">Nivva</a>
          <div class="ms-auto d-flex align-items-center gap-2">
            <notifications-button></notifications-button>
            <button id="tour-btn" class="btn btn-primary d-inline-flex align-items-center justify-content-center p-2 rounded-3"
              type="button" title="Abrir guía rápida" aria-label="Abrir guía rápida">
              <i class="bi bi-question-circle" aria-hidden="true"></i>
            </button>
            <user-menu-button></user-menu-button>
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

