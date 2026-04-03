import './Menu.js';
import './DarkToggle.js';

export class AppHeader extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.classList.add('d-block');
    this.render();
    this.querySelector('#tour-btn').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('tour:start'));
    });
  }

  render() {
    this.innerHTML = `
      <nav class="navbar navbar-dark navbar-expand-lg bg-primary px-3 shadow-sm" data-tour-step="bienvenida">
        <div class="container-fluid">
          <a class="navbar-brand fw-bold" href="/" aria-label="Inicio">Nivva</a>
          <button class="navbar-toggler" type="button"
            data-bs-toggle="collapse" data-bs-target="#main-nav-collapse"
            aria-controls="main-nav-collapse" aria-expanded="false" aria-label="Abrir menú">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="main-nav-collapse" data-tour-step="menu-navegacion">
            <app-nav></app-nav>
          </div>
          <button id="tour-btn" class="btn btn-outline-light btn-sm ms-lg-2 flex-shrink-0" type="button" title="Iniciar tour guiado" aria-label="Iniciar tour guiado">
            ❓ Tour
          </button>
        </div>
      </nav>
    `;
  }
}
customElements.define('app-header', AppHeader);

export default function AppHeaderComponent() {
  return document.createElement('app-header');
}
