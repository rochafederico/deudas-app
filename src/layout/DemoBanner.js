import './Menu.js';
import './DarkToggle.js';

export class DemoBanner extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.classList.add('d-block');
    this.render();
  }

  render() {
    this.innerHTML = `
      <nav class="navbar navbar-dark navbar-expand bg-primary px-4 py-3 shadow-sm">
        <span class="navbar-brand fs-4 fw-bold mb-0 text-white" data-tour-step="bienvenida">Nivva</span>
        <div class="mx-4" data-tour-step="menu-navegacion"><main-menu></main-menu></div>
        <div class="ms-auto"></div>
      </nav>
    `;
  }
}
customElements.define('demo-banner', DemoBanner);

export default function DemoBannerComponent() {
  return document.createElement('demo-banner');
}
