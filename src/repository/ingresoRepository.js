// src/repository/ingresoRepository.js
import { getDB } from '../database/initDB.js';
import { INGRESOS_STORE } from '../database/schema.js';
import { IngresoEntity } from '../entity/IngresoEntity.js';

function _getIngresosStore(mode = 'readonly') {
    const db = getDB();
    const transaction = db.transaction(INGRESOS_STORE, mode);
    return transaction.objectStore(INGRESOS_STORE);
}

function _withIngresosStore(mode, fn) {
    return new Promise((resolve, reject) => {
        const store = _getIngresosStore(mode);
        fn(store, resolve, reject);
    });
}

export function addIngreso(ingresoModel) {
    return _withIngresosStore('readwrite', (store, resolve, reject) => {
        const entity = new IngresoEntity(ingresoModel);
        const request = store.add(entity);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(new Error('Error adding ingreso: ' + e.target.errorCode));
    });
}

export function listIngresos({ mes } = {}) {
    return _withIngresosStore('readonly', (store, resolve, reject) => {
        try {
            const index = store.index('by_periodo');
            const req = mes ? index.getAll(mes) : index.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(new Error('Error listing ingresos: ' + e.target.errorCode));
        } catch (err) {
            // Fallback: no índice
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(new Error('Error listing ingresos: ' + e.target.errorCode));
        }
    });
}

export function getAll() {
    return _withIngresosStore('readonly', (store, resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(new Error('Error getting all ingresos: ' + e.target.errorCode));
    });
}

export function sumIngresosByMonth({ mes } = {}) {
    return _withIngresosStore('readonly', (store, resolve, reject) => {
        const index = store.index('by_periodo');
        const request = mes ? index.getAll(mes) : index.getAll();
        request.onsuccess = () => {
            const rows = request.result || [];
            const totals = {};
            rows.forEach(r => {
                totals[r.moneda] = (totals[r.moneda] || 0) + (Number(r.monto) || 0);
            });
            resolve(totals);
        };
        request.onerror = (e) => reject(new Error('Error summing ingresos: ' + e.target.errorCode));
    });
}

