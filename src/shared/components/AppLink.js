// src/components/AppLink.js
// Web Component <app-link> para navegación SPA universal
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
        a {
          color: inherit;
          text-decoration: none;
          cursor: pointer;
          font: inherit;
          border-radius: 6px;
          padding: 4px 10px;
          transition: background 0.2s, color 0.2s;
        }
        a:hover {
          background: rgba(0,0,0,0.08);
        }
      </style>
      <a href="${href}">${label}</a>
    `;
  }
}

customElements.define('app-link', AppLink);
