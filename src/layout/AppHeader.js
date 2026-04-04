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
    this._onBrandClick = (e) => {
      e.preventDefault();
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    };
    this._onTourClick = () => window.dispatchEvent(new CustomEvent('tour:start'));
    this._onExportClick = (e) => { e.preventDefault(); this._openExportModal(e.currentTarget); };
    this._onImportClick = (e) => { e.preventDefault(); this._openImportModal(e.currentTarget); };
    this._onDeleteAllClick = (e) => { e.preventDefault(); this._deleteAllData(); };
    this._onDataImported = () => window.dispatchEvent(new CustomEvent('ui:refresh'));
    this.querySelector('.navbar-brand').addEventListener('click', this._onBrandClick);
    this.querySelector('#tour-btn').addEventListener('click', this._onTourClick);
    this.querySelector('#export-data-nav').addEventListener('click', this._onExportClick);
    this.querySelector('#import-data-nav').addEventListener('click', this._onImportClick);
    this.querySelector('#delete-all-nav').addEventListener('click', this._onDeleteAllClick);
    window.addEventListener('data-imported', this._onDataImported);
  }

  disconnectedCallback() {
    this.querySelector('.navbar-brand')?.removeEventListener('click', this._onBrandClick);
    this.querySelector('#tour-btn')?.removeEventListener('click', this._onTourClick);
    this.querySelector('#export-data-nav')?.removeEventListener('click', this._onExportClick);
    this.querySelector('#import-data-nav')?.removeEventListener('click', this._onImportClick);
    this.querySelector('#delete-all-nav')?.removeEventListener('click', this._onDeleteAllClick);
    window.removeEventListener('data-imported', this._onDataImported);
  }

  async _deleteAllData() {
    const confirmed = confirm('¿Estás seguro de que deseas eliminar todos los datos? Esta acción no se puede deshacer.');
    if (!confirmed) return;
    try {
      const { listDeudas, deleteDeudas } = await import('../features/deudas/deudaRepository.js');
      const { getAll, deleteAllIngresos } = await import('../features/ingresos/ingresoRepository.js');
      const { listInversiones, deleteAllInversiones } = await import('../features/inversiones/inversionRepository.js');
      const [deudas, ingresos, inversiones] = await Promise.all([listDeudas(), getAll(), listInversiones()]);
      if (!deudas.length && !ingresos.length && !inversiones.length) {
        window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: '⚠️ No hay datos para borrar.', type: 'warning' } }));
        return;
      }
      await Promise.all([deleteDeudas(), deleteAllIngresos(), deleteAllInversiones()]);
    } catch (error) {
      console.error('Error al eliminar los datos:', error);
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Error al eliminar los datos.', type: 'danger' } }));
      return;
    }
    window.dispatchEvent(new CustomEvent('ui:refresh'));
    window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: '✅ Todos los datos fueron eliminados.', type: 'success' } }));
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
                  <li><hr class="dropdown-divider"></li>
                  <li>
                    <a class="dropdown-item text-danger" href="#" id="delete-all-nav">
                      🗑️ Eliminar todo
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
