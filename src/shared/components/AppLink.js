// src/components/AppLink.js
// Web Component <app-link> para navegación SPA universal
import { injectBootstrap } from '../utils/bootstrapStyles.js';

class AppLink extends HTMLElement {
  static get observedAttributes() {
    return ['href'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.handleClick = this.handleClick.bind(this);
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.addEventListener('click', this.handleClick);
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this.handleClick);
  }

  attributeChangedCallback() {
    this.render();
  }

  handleClick(e) {
    e.preventDefault();
    const href = this.getAttribute('href');
    const currentPath = window.location.pathname + window.location.search + window.location.hash;
    if (href && href !== currentPath) {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  render() {
    const href = this.getAttribute('href') || '#';
    const label = this.textContent || this.getAttribute('label') || href;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-block; }
        a {
          color: inherit;
          text-decoration: none;
          cursor: pointer;
          font: inherit;
          border-radius: 0.375rem;
          padding: 0.375rem 0.75rem;
          transition: background 0.2s, color 0.2s;
        }
        a:hover {
          background: rgba(255,255,255,0.15);
        }
      </style>
      <a href="${href}" class="nav-link">${label}</a>
    `;
    injectBootstrap(this.shadowRoot);
  }
}

customElements.define('app-link', AppLink);
