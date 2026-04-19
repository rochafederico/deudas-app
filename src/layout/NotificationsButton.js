import { createNavbarPopover } from './navbarPopoversController.js';

export class NotificationsButton extends HTMLElement {
  connectedCallback() {
    this.render();
    const btn = this.querySelector('#notifications-btn');
    this._popoverController = document.createElement('navbar-popover-controller');
    this._popoverController._button = btn;
    this._popoverController._getPopover = () => this._popover;
    this._popoverController._onShown = () => this._bindPopoverActions();
    this._popoverController._onHidden = () => this._unbindPopoverActions();
    this.appendChild(this._popoverController);
    this._onUpcomingPanel = (e) => this._updatePopover(e.detail.html, e.detail.todayCount, e.detail.overdueCount);
    window.addEventListener('app:upcoming-panel', this._onUpcomingPanel);
  }

  disconnectedCallback() {
    this._popoverController = null;
    window.removeEventListener('app:upcoming-panel', this._onUpcomingPanel);
    this._popover?.dispose();
    this._popover = null;
  }

  _bindPopoverActions() {
    const btn = this.querySelector('#notifications-btn');
    const popoverId = btn?.getAttribute('aria-describedby');
    const popoverElement = popoverId ? document.getElementById(popoverId) : null;
    if (!popoverElement) return;
    this._popoverElement = popoverElement;
    this._onPopoverClick = (e) => {
      const link = e.target.closest('[data-notif-navigate]');
      if (link) {
        e.preventDefault();
        this._popover?.hide();
        const href = link.getAttribute('href');
        if (href) {
          window.history.pushState({}, '', href);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        return;
      }
      if (e.target.closest('[data-notif-close]')) {
        this._popover?.hide();
      }
    };
    this._popoverElement.addEventListener('click', this._onPopoverClick);
  }

  _unbindPopoverActions() {
    if (this._popoverElement && this._onPopoverClick) {
      this._popoverElement.removeEventListener('click', this._onPopoverClick);
    }
    this._popoverElement = null;
    this._onPopoverClick = null;
  }

  _updatePopover(html, _todayCount = 0, overdueCount = 0) {
    const btn = this.querySelector('#notifications-btn');
    if (!btn || !window.bootstrap?.Popover) return;
    if (this._popover) this._popover.dispose();
    this._popover = createNavbarPopover(btn, {
      html: true,
      title: '<div class="d-flex justify-content-between align-items-center w-100">' +
        '<strong class="text-nowrap me-3">⚠️ Vencimientos próximos</strong>' +
        '<button type="button" class="btn-close btn-sm flex-shrink-0" data-notif-close aria-label="Cerrar"></button>' +
        '</div>',
      content: html,
      allowList: {
        ...window.bootstrap.Popover.Default.allowList,
        button: ['type', 'class', 'aria-label', 'data-notif-close'],
        a: [...(window.bootstrap.Popover.Default.allowList.a || []), 'data-notif-navigate'],
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

  render() {
    this.innerHTML = `
      <button id="notifications-btn" class="btn btn-primary d-inline-flex align-items-center justify-content-center p-2 rounded-3 position-relative"
        type="button" title="Vencimientos próximos" aria-label="Ver vencimientos próximos">
        <i class="bi bi-bell" aria-hidden="true"></i>
      </button>
    `;
  }
}

customElements.define('notifications-button', NotificationsButton);
