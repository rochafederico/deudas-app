// src/components/AppLink.js
// Web Component <app-link> para navegación SPA (sin Shadow DOM)

class AppLink extends HTMLElement {
  static get observedAttributes() {
    return ['href'];
  }

  constructor() {
    super();
    this.handleClick = this.handleClick.bind(this);
  }

  connectedCallback() {
    this.classList.add('d-inline-block');
    if (!this._rendered) this.render();
    this.addEventListener('click', this.handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
  }

  attributeChangedCallback() {
    if (this._rendered) this.render();
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
    this._rendered = true;
    const href = this.getAttribute('href') || '#';
    const label = this._originalText || this.textContent.trim() || this.getAttribute('label') || href;
    if (!this._originalText) this._originalText = label;
    this.innerHTML = `<a href="${href}" class="link-light link-underline link-underline-opacity-0 link-underline-opacity-75-hover rounded px-3 py-2 d-inline-block">${label}</a>`;
  }
}

customElements.define('app-link', AppLink);
