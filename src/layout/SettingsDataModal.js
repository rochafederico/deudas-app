import '../shared/components/UiModal.js';

const SETTINGS_MODAL_TITLE = 'Configuración';

let _settingsModal = null;

export class SettingsDataModal extends HTMLElement {
  constructor() {
    super();
    this._callbacks = { onExport: null, onImport: null, onDelete: null };
  }

  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    this.render();

    this._modal = this.querySelector('#settings-data-modal');
    this._exportBtn = this.querySelector('#settings-export');
    this._importBtn = this.querySelector('#settings-import');
    this._deleteBtn = this.querySelector('#settings-delete');

    this._exportBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this._modal.close();
      this._callbacks.onExport?.(this._exportBtn);
    });

    this._importBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this._modal.close();
      this._callbacks.onImport?.(this._importBtn);
    });

    this._deleteBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      this._modal.close();
      await this._callbacks.onDelete?.(this._deleteBtn);
    });
  }

  open({ returnFocus, onExport, onImport, onDelete }) {
    this._callbacks.onExport = onExport;
    this._callbacks.onImport = onImport;
    this._callbacks.onDelete = onDelete;
    this._modal.setTitle(SETTINGS_MODAL_TITLE);
    this._modal.returnFocusTo(returnFocus);
    this._modal.open();
  }

  render() {
    this.innerHTML = `
      <ui-modal id="settings-data-modal">
        <p class="text-muted mb-3">Gestioná tus datos desde este espacio dedicado.</p>

        <div class="card mb-3">
          <div class="card-header">
            <h6 class="mb-0">Datos</h6>
          </div>
          <div class="list-group list-group-flush" role="group" aria-label="Acciones de datos">
            <button type="button" id="settings-export" class="list-group-item list-group-item-action d-flex align-items-center gap-2">
              <i class="bi bi-upload" aria-hidden="true"></i>
              <span>Exportar datos</span>
            </button>
            <button type="button" id="settings-import" class="list-group-item list-group-item-action d-flex align-items-center gap-2">
              <i class="bi bi-download" aria-hidden="true"></i>
              <span>Importar datos</span>
            </button>
          </div>
        </div>

        <div class="card border-danger-subtle">
          <div class="card-header text-danger">
            <h6 id="settings-danger-zone-title" class="mb-0">Zona peligrosa</h6>
          </div>
          <div class="list-group list-group-flush" role="group" aria-labelledby="settings-danger-zone-title">
            <button type="button" id="settings-delete" class="list-group-item list-group-item-action list-group-item-danger d-flex align-items-center gap-2">
              <i class="bi bi-trash" aria-hidden="true"></i>
              <span>Eliminar todo</span>
            </button>
          </div>
        </div>
      </ui-modal>
    `;
  }
}

export function openSettingsDataModal(options) {
  if (!_settingsModal?.isConnected) {
    _settingsModal = document.createElement('settings-data-modal');
    document.body.appendChild(_settingsModal);
  }
  _settingsModal.open(options);
}

customElements.define('settings-data-modal', SettingsDataModal);
