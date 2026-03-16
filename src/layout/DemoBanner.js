import './Menu.js';
import './DarkToggle.js';
import { injectBootstrap } from '../shared/utils/bootstrapStyles.js';

export class DemoBanner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .navbar {
          background-color: var(--accent, rgb(61, 121, 130)) !important;
          padding: 0.75rem 1.5rem;
          width: 100vw;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .navbar-brand {
          font-size: 1.4em;
          font-weight: bold;
          color: #fff !important;
          letter-spacing: 0.5px;
        }
        .nav-section {
          margin: 0 1.5rem;
        }
        :host-context(body.dark-mode) .navbar {
          background-color: var(--accent-hover, rgb(51, 101, 110)) !important;
          border-bottom: 2px solid #333;
        }
      </style>
      <nav class="navbar navbar-dark navbar-expand">
        <span class="navbar-brand mb-0 h1" data-tour-step="bienvenida">Nivva</span>
        <div class="nav-section" data-tour-step="menu-navegacion"><main-menu></main-menu></div>
        <div class="ms-auto"></div>
      </nav>
    `;
    injectBootstrap(this.shadowRoot);
  }
}
customElements.define('demo-banner', DemoBanner);

export default function DemoBannerComponent() {
  return document.createElement('demo-banner');
}
