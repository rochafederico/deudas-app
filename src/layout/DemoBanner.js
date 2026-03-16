import './Menu.js';
import './DarkToggle.js';

export class DemoBanner extends HTMLElement {
  constructor() {
    super();
    this.style.display = 'block';
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <nav class="navbar navbar-dark navbar-expand" style="background-color:var(--accent, rgb(61, 121, 130));padding:0.75rem 1.5rem;width:100vw;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <span class="navbar-brand mb-0 h1" style="font-size:1.4em;font-weight:bold;color:#fff;letter-spacing:0.5px;" data-tour-step="bienvenida">Nivva</span>
        <div style="margin:0 1.5rem;" data-tour-step="menu-navegacion"><main-menu></main-menu></div>
        <div class="ms-auto"></div>
      </nav>
    `;
  }
}
customElements.define('demo-banner', DemoBanner);

export default function DemoBannerComponent() {
  return document.createElement('demo-banner');
}
