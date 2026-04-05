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
    this._onUpcomingPanel = (e) => this._updateNotificationPopover(e.detail.html, e.detail.todayCount);
    this.querySelector('.navbar-brand').addEventListener('click', this._onBrandClick);
    this.querySelector('#tour-btn').addEventListener('click', this._onTourClick);
    this.querySelector('#export-data-nav').addEventListener('click', this._onExportClick);
    this.querySelector('#import-data-nav').addEventListener('click', this._onImportClick);
    this.querySelector('#delete-all-nav').addEventListener('click', this._onDeleteAllClick);
    window.addEventListener('data-imported', this._onDataImported);
    window.addEventListener('app:upcoming-panel', this._onUpcomingPanel);
  }

  disconnectedCallback() {
    this.querySelector('.navbar-brand')?.removeEventListener('click', this._onBrandClick);
    this.querySelector('#tour-btn')?.removeEventListener('click', this._onTourClick);
    this.querySelector('#export-data-nav')?.removeEventListener('click', this._onExportClick);
    this.querySelector('#import-data-nav')?.removeEventListener('click', this._onImportClick);
    this.querySelector('#delete-all-nav')?.removeEventListener('click', this._onDeleteAllClick);
    window.removeEventListener('data-imported', this._onDataImported);
    window.removeEventListener('app:upcoming-panel', this._onUpcomingPanel);
    this._popover?.dispose();
    this._popover = null;
  }

  _updateNotificationPopover(html, todayCount = 0) {
    const btn = this.querySelector('#notifications-btn');
    if (!btn || !window.bootstrap?.Popover) return;
    if (this._popover) this._popover.dispose();
    this._popover = new window.bootstrap.Popover(btn, {
      html: true,
      title: '<strong>⚠️ Vencimientos próximos</strong>',
      content: html,
      trigger: 'click',
      placement: 'bottom',
      container: 'body',
    });
    let badge = btn.querySelector('.notif-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'notif-badge badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle border border-primary';
      badge.setAttribute('aria-label', 'Hay vencimientos próximos');
      btn.appendChild(badge);
    }
    if (todayCount > 0) {
      badge.textContent = todayCount;
      badge.style.padding = '';
    } else {
      badge.textContent = '';
      badge.style.padding = '0.25em 0.4em';
    }
  }

  async _deleteAllData() {
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
          <div class="collapse navbar-collapse" id="main-nav-collapse" data-tour-step="menu-navegacion">
            <app-nav></app-nav>
            <ul class="navbar-nav ms-auto mb-2 mb-lg-0 d-flex align-items-lg-center gap-2">
              <li class="nav-item">
                <button id="notifications-btn" class="btn btn-outline-light fs-5 p-1 position-relative" type="button" title="Vencimientos próximos" aria-label="Ver vencimientos próximos">
                  🔔
                </button>
              </li>
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle px-2" href="#" role="button"
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
              <li class="nav-item py-1 py-lg-0 d-flex align-items-center">
                <button id="tour-btn" class="btn btn-light btn-sm px-3" type="button" title="Iniciar tour guiado" aria-label="Iniciar tour guiado">
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
