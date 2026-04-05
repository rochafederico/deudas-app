import './Menu.js';
import './DarkToggle.js';
import '../shared/components/AppToast.js';

export class AppHeader extends HTMLElement {
  connectedCallback() {
    this.classList.add('d-block');
    this.render();
    this._onBrandClick = (e) => {
      e.preventDefault();
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    };
    this._onTourClick = () => window.dispatchEvent(new CustomEvent('tour:start'));
    this._onDataImported = () => window.dispatchEvent(new CustomEvent('ui:refresh'));
    this._onUpcomingPanel = (e) => this._updateNotificationPopover(e.detail.html, e.detail.todayCount);
    this.querySelector('.navbar-brand').addEventListener('click', this._onBrandClick);
    this.querySelector('#tour-btn').addEventListener('click', this._onTourClick);
    window.addEventListener('data-imported', this._onDataImported);
    window.addEventListener('app:upcoming-panel', this._onUpcomingPanel);
  }

  disconnectedCallback() {
    this.querySelector('.navbar-brand')?.removeEventListener('click', this._onBrandClick);
    this.querySelector('#tour-btn')?.removeEventListener('click', this._onTourClick);
    window.removeEventListener('data-imported', this._onDataImported);
    window.removeEventListener('app:upcoming-panel', this._onUpcomingPanel);
    this._popover?.dispose();
    this._popover = null;
  }

  _updateNotificationPopover(html, todayCount = 0) {
    const btn = this.querySelector('#notifications-btn');
    if (!btn || !window.bootstrap?.Popover) return;
    if (this._popover) this._popover.dispose();
    this._popover = new window.bootstrap.Popover(btn, {
      html: true,
      title: '<strong>⚠️ Vencimientos próximos</strong>',
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
          <div class="ms-auto d-flex align-items-center gap-2">
            <button id="notifications-btn" class="btn btn-outline-light fs-5 p-1 position-relative" type="button" title="Vencimientos próximos" aria-label="Ver vencimientos próximos">🔔</button>
            <button id="tour-btn" class="btn btn-light btn-sm" type="button" title="Iniciar tour guiado" aria-label="Iniciar tour guiado">❓</button>
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
