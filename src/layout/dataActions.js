// Shared data action helpers — used by AppHeader (desktop) and BottomNav (mobile)
import '../features/import-export/components/ExportDataModal.js';
import '../features/import-export/components/ImportDataModal.js';
import '../features/feedback/FeedbackModal.js';

let _exportModal = null;
let _importModal = null;
let _feedbackModal = null;

export function openExportModal(returnFocus) {
  if (!_exportModal) {
    _exportModal = document.createElement('export-data-modal');
    document.body.appendChild(_exportModal);
  }
  _exportModal.open(returnFocus);
}

export function openImportModal(returnFocus) {
  if (!_importModal) {
    _importModal = document.createElement('import-data-modal');
    document.body.appendChild(_importModal);
  }
  _importModal.open(returnFocus);
}

export function openFeedbackModal(returnFocus) {
  if (!_feedbackModal) {
    _feedbackModal = document.createElement('feedback-modal');
    document.body.appendChild(_feedbackModal);
  }
  _feedbackModal.open(returnFocus);
}

export async function deleteAllData() {
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
