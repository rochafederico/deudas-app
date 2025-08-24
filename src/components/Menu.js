// src/components/Menu.js
import routes from '../routes.js';

export class Menu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener('click', (e) => {
      const link = e.target.closest('[app-link]');
      if (link) {
        e.preventDefault();
        window.history.pushState({}, '', link.getAttribute('href'));
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    });
  }

  render() {
    // Si las rutas son un objeto, conviértelas a array
    const routeArray = Array.isArray(routes)
      ? routes
      : Object.entries(routes).map(([path, component]) => ({ path, label: path === '/' ? 'Dashboard' : path.replace('/', ''), component }));

    this.shadowRoot.innerHTML = `
      <style>
        nav {
          display: flex;
          gap: 18px;
        }
        a {
          color: #fff;
          text-decoration: none;
          font-weight: 500;
          font-size: 1em;
          padding: 4px 10px;
          border-radius: 6px;
          transition: background 0.2s, color 0.2s;
        }
        a:hover {
          background: rgba(255,255,255,0.12);
        }
      </style>
      <nav>
        ${routeArray.map(r => `<app-link href="${r.path}">${r.label}</app-link>`).join('')}
      </nav>
    `;
  }
}
customElements.define('main-menu', Menu);