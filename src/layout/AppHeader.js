import './Menu.js';
import './DarkToggle.js';
import '../features/import-export/components/ExportDataModal.js';
import '../features/import-export/components/ImportDataModal.js';
import '../shared/components/AppToast.js';

export class AppHeader extends HTMLElement {
  constructor() {
    super();
    this._exportModal = null;
    this._importModal = null;
  }

  connectedCallback() {
    this.classList.add('d-block');
    this.render();
    this.querySelector('#tour-btn').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('tour:start'));
    });
    this.querySelector('#export-data-nav').addEventListener('click', (e) => {
      e.preventDefault();
      this._openExportModal(e.currentTarget);
    });
    this.querySelector('#import-data-nav').addEventListener('click', (e) => {
      e.preventDefault();
      this._openImportModal(e.currentTarget);
    });
  }

  _openExportModal(opener) {
    if (!this._exportModal) {
      this._exportModal = document.createElement('export-data-modal');
      document.body.appendChild(this._exportModal);
    }
    this._exportModal.open(opener);
  }

  _openImportModal(opener) {
    if (!this._importModal) {
      this._importModal = document.createElement('import-data-modal');
      document.body.appendChild(this._importModal);
      this._importModal.addEventListener('data-imported', () => {
        window.dispatchEvent(new CustomEvent('ui:refresh'));
      });
    }
    this._importModal.open(opener);
  }

  render() {
    this.innerHTML = `
      <app-toast></app-toast>
      <nav class="navbar navbar-dark navbar-expand-lg bg-primary px-3 shadow-sm">
        <div class="container-fluid">
          <a class="navbar-brand fw-bold" href="/" aria-label="Inicio" data-tour-step="bienvenida">Nivva</a>
          <button class="navbar-toggler" type="button"
            data-bs-toggle="collapse" data-bs-target="#main-nav-collapse"
            aria-controls="main-nav-collapse" aria-expanded="false" aria-label="Abrir menú">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="main-nav-collapse" data-tour-step="menu-navegacion">
            <app-nav></app-nav>
            <ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button"
                  data-bs-toggle="dropdown" aria-expanded="false">
                  💾 Datos
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li>
                    <a class="dropdown-item" href="#" id="export-data-nav" data-tour-step="exportar">
                      📤 Exportar
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="#" id="import-data-nav" data-tour-step="importar">
                      📥 Importar
                    </a>
                  </li>
                </ul>
              </li>
              <li class="nav-item">
                <button id="tour-btn" class="btn btn-light btn-sm" type="button" title="Iniciar tour guiado" aria-label="Iniciar tour guiado">
                  ❓ Tour
                </button>
              </li>
            </ul>
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
