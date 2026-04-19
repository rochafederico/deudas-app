import '../shared/components/UiModal.js';

const SETTINGS_MODAL_TITLE = 'Configuración';

let _settingsModal = null;

function createSettingsModal() {
  const host = document.createElement('div');
  host.innerHTML = `
    <ui-modal id="settings-data-modal">
      <div class="mb-3">
        <p class="text-muted mb-2">Gestioná tus datos desde este espacio dedicado.</p>
        <div class="list-group" role="group" aria-label="Acciones de datos">
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
      <div class="pt-2 border-top">
        <h6 id="settings-danger-zone-title" class="text-danger mb-2">Zona peligrosa</h6>
        <div class="list-group" role="group" aria-labelledby="settings-danger-zone-title">
          <button type="button" id="settings-delete" class="list-group-item list-group-item-action list-group-item-danger d-flex align-items-center gap-2">
            <i class="bi bi-trash" aria-hidden="true"></i>
            <span>Eliminar todo</span>
          </button>
        </div>
      </div>
    </ui-modal>
  `;
  document.body.appendChild(host);

  const modal = host.querySelector('#settings-data-modal');
  const exportBtn = host.querySelector('#settings-export');
  const importBtn = host.querySelector('#settings-import');
  const deleteBtn = host.querySelector('#settings-delete');

  const callbacks = { onExport: null, onImport: null, onDelete: null };

  exportBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    modal.close();
    callbacks.onExport?.(exportBtn);
  });

  importBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    modal.close();
    callbacks.onImport?.(importBtn);
  });

  deleteBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    modal.close();
    await callbacks.onDelete?.(deleteBtn);
  });

  return {
    host,
    modal,
    open({ returnFocus, onExport, onImport, onDelete }) {
      callbacks.onExport = onExport;
      callbacks.onImport = onImport;
      callbacks.onDelete = onDelete;
      modal.setTitle(SETTINGS_MODAL_TITLE);
      modal.returnFocusTo(returnFocus);
      modal.open();
    },
  };
}

export function openSettingsDataModal(options) {
  if (!_settingsModal?.host?.isConnected) {
    _settingsModal = createSettingsModal();
  }
  _settingsModal.open(options);
}

