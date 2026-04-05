// src/layout/BottomNav.js
// Fixed bottom navigation bar for mobile screens (hidden on lg+)

import '../features/import-export/components/ExportDataModal.js';
import '../features/import-export/components/ImportDataModal.js';

const bottomNavItems = [
  { label: 'Egresos', icon: '💸', path: '/', key: 'egresos' },
  { label: 'Ingresos', icon: '💰', path: '/ingresos', key: 'ingresos' },
  { label: 'Inversiones', icon: '📈', path: '/inversiones', key: 'inversiones' },
];

export class BottomNav extends HTMLElement {
  connectedCallback() {
    this.render();
    this._onNavClick = (e) => {
      const item = e.target.closest('[data-path]');
      if (!item) return;
      e.preventDefault();
      const path = item.dataset.path;
      if (path && path !== window.location.pathname) {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      this._updateActive();
    };
    this._onPopState = () => this._updateActive();
    this._onExportClick = (e) => { e.preventDefault(); this._openExportModal(e.currentTarget); };
    this._onImportClick = (e) => { e.preventDefault(); this._openImportModal(e.currentTarget); };
    this._onDeleteAllClick = (e) => { e.preventDefault(); this._deleteAllData(); };
    this.querySelector('#bottom-nav-list').addEventListener('click', this._onNavClick);
    window.addEventListener('popstate', this._onPopState);
    this.querySelector('#bottom-nav-export')?.addEventListener('click', this._onExportClick);
    this.querySelector('#bottom-nav-import')?.addEventListener('click', this._onImportClick);
    this.querySelector('#bottom-nav-delete')?.addEventListener('click', this._onDeleteAllClick);
    this._updateActive();
  }

  disconnectedCallback() {
    this.querySelector('#bottom-nav-list')?.removeEventListener('click', this._onNavClick);
    window.removeEventListener('popstate', this._onPopState);
    this.querySelector('#bottom-nav-export')?.removeEventListener('click', this._onExportClick);
    this.querySelector('#bottom-nav-import')?.removeEventListener('click', this._onImportClick);
    this.querySelector('#bottom-nav-delete')?.removeEventListener('click', this._onDeleteAllClick);
    this._exportModal?.remove();
    this._exportModal = null;
    this._importModal?.remove();
    this._importModal = null;
  }

  _closeOffcanvas() {
    const offcanvas = this.querySelector('#mas-offcanvas');
    if (offcanvas && window.bootstrap?.Offcanvas) {
      const instance = window.bootstrap.Offcanvas.getInstance(offcanvas);
      instance?.hide();
    }
  }

  _updateActive() {
    const path = window.location.pathname;
    const items = this.querySelectorAll('[data-path]');
    items.forEach(item => {
      const itemPath = item.dataset.path;
      const isActive = itemPath === path;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  _openExportModal() {
    const returnFocus = this.querySelector('[data-bs-toggle="offcanvas"]') || document.activeElement;
    if (!this._exportModal) {
      this._exportModal = document.createElement('export-data-modal');
      document.body.appendChild(this._exportModal);
    }
    this._closeOffcanvas();
    this._exportModal.open(returnFocus);
  }

  _openImportModal() {
    const returnFocus = this.querySelector('[data-bs-toggle="offcanvas"]') || document.activeElement;
    if (!this._importModal) {
      this._importModal = document.createElement('import-data-modal');
      document.body.appendChild(this._importModal);
    }
    this._closeOffcanvas();
    this._importModal.open(returnFocus);
  }

  async _deleteAllData() {
    this._closeOffcanvas();
    const confirmed = confirm('¿Estás seguro de que deseas eliminar todos los datos? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    let stores;
    try {
      const { listDeudas, deleteDeudas } = await import('../features/deudas/deudaRepository.js');
      const { getAll, deleteAllIngresos } = await import('../features/ingresos/ingresoRepository.js');
      const { listInversiones, deleteAllInversiones } = await import('../features/inversiones/inversionRepository.js');
      stores = [
        { name: 'Deudas', list: listDeudas, del: deleteDeudas },
        { name: 'Ingresos', list: getAll, del: deleteAllIngresos },
        { name: 'Inversiones', list: listInversiones, del: deleteAllInversiones },
      ];
    } catch (error) {
      console.error('Error al cargar módulos de datos:', error);
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: '❌ Error al cargar los módulos de datos.', type: 'danger' } }));
      return;
    }

    const results = await Promise.allSettled(stores.map(async (store) => {
      const items = await store.list();
      if (!items.length) return { name: store.name, status: 'empty' };
      await store.del();
      return { name: store.name, status: 'deleted' };
    }));

    window.dispatchEvent(new CustomEvent('ui:refresh'));

    const deleted = results
      .filter(r => r.status === 'fulfilled' && r.value.status === 'deleted')
      .map(r => r.value.name);
    const empty = results
      .filter(r => r.status === 'fulfilled' && r.value.status === 'empty')
      .map(r => r.value.name);
    const failed = results
      .map((r, i) => r.status === 'rejected' ? stores[i].name : null)
      .filter(Boolean);

    if (deleted.length === 0 && failed.length === 0) {
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: '⚠️ No había datos para borrar.', type: 'warning' } }));
      return;
    }

    const parts = [];
    if (deleted.length) parts.push(`✅ Eliminado: ${deleted.join(', ')}.`);
    if (empty.length) parts.push(`ℹ️ Sin registros: ${empty.join(', ')}.`);
    if (failed.length) parts.push(`❌ Error al eliminar: ${failed.join(', ')}.`);

    const type = failed.length ? 'warning' : 'success';
    window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: parts.join(' '), type } }));
  }

  render() {
    const navItems = bottomNavItems.map(item => `
      <button type="button" class="btn btn-link text-white text-decoration-none text-center flex-fill py-2 px-1 d-flex flex-column align-items-center"
        data-path="${item.path}" data-key="${item.key}" aria-label="${item.label}">
        <span class="fs-5 lh-1">${item.icon}</span>
        <small class="d-block lh-1 mt-1">${item.label}</small>
      </button>
    `).join('');

    this.innerHTML = `
      <nav class="navbar fixed-bottom bg-primary d-lg-none py-0 border-top border-primary-subtle shadow"
        aria-label="Navegación móvil">
        <div id="bottom-nav-list" class="container-fluid justify-content-around px-0">
          ${navItems}
          <button type="button"
            class="btn btn-link text-white text-decoration-none text-center flex-fill py-2 px-1 d-flex flex-column align-items-center"
            data-bs-toggle="offcanvas" data-bs-target="#mas-offcanvas"
            aria-controls="mas-offcanvas" aria-label="Configuración">
            <span class="fs-5 lh-1">⚙️</span>
            <small class="d-block lh-1 mt-1">Config</small>
          </button>
        </div>
      </nav>

      <div class="offcanvas offcanvas-bottom" id="mas-offcanvas" tabindex="-1"
        aria-labelledby="mas-offcanvas-label" style="height:auto">
        <div class="offcanvas-header bg-primary text-white">
          <h5 class="offcanvas-title" id="mas-offcanvas-label">Configuración</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
        </div>
        <div class="offcanvas-body pb-4">
          <div class="list-group list-group-flush">
            <a href="#" id="bottom-nav-export" class="list-group-item list-group-item-action d-flex align-items-center gap-2">
              📤 Exportar datos
            </a>
            <a href="#" id="bottom-nav-import" class="list-group-item list-group-item-action d-flex align-items-center gap-2">
              📥 Importar datos
            </a>
            <a href="#" id="bottom-nav-delete" class="list-group-item list-group-item-action text-danger d-flex align-items-center gap-2">
              🗑️ Eliminar todo
            </a>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('bottom-nav', BottomNav);

export default function BottomNavComponent() {
  return document.createElement('bottom-nav');
}
