
import { getDB } from '../database/initDB.js';
import { INVERSIONES_STORE } from '../database/schema.js';
import { InversionEntity } from '../entity/InversionEntity.js';

function _getInversionesStore(mode = 'readonly') {
  const db = getDB();
  const transaction = db.transaction(INVERSIONES_STORE, mode);
  return transaction.objectStore(INVERSIONES_STORE);
}

function _withInversionesStore(mode, fn) {
  return new Promise((resolve, reject) => {
    const store = _getInversionesStore(mode);
    fn(store, resolve, reject);
  });
}

export function addInversion(inversionModel) {
  return _withInversionesStore('readwrite', (store, resolve, reject) => {
    const entity = new InversionEntity(inversionModel);
    const request = store.add(entity);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(new Error('Error adding inversion: ' + e.target.errorCode));
  });
}

export function listInversiones() {
  return _withInversionesStore('readonly', (store, resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(new Error('Error listing inversiones: ' + e.target.errorCode));
  });
}

export function getInversionById(id) {
  return _withInversionesStore('readonly', (store, resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(new Error('Error getting inversion: ' + e.target.errorCode));
  });
}

export function addValorToInversion(id, { fecha, valor }) {
  return getInversionById(id).then(inv => {
    if (!inv) throw new Error('Inversión no encontrada');
    inv.historialValores = inv.historialValores || [];
    inv.historialValores.push({ fecha, valor });
    return _withInversionesStore('readwrite', (store, resolve, reject) => {
      const req = store.put(inv);
      req.onsuccess = () => resolve(inv);
      req.onerror = (e) => reject(new Error('Error actualizando inversión: ' + e.target.errorCode));
    });
  });
}
