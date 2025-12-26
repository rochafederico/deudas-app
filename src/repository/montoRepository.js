// src/repository/montoRepository.js
// Repository for Monto CRUD/query operations
import { getDB } from '../database/initDB.js';
import { MONTOS_STORE } from '../database/schema.js';
import { MontoEntity } from '../entity/MontoEntity.js';

function _getMontosStore(mode = 'readonly') {
    const db = getDB();
    const transaction = db.transaction(MONTOS_STORE, mode);
    return transaction.objectStore(MONTOS_STORE);
}

function _withMontosStore(mode, fn) {
    return new Promise((resolve, reject) => {
        const montosStore = _getMontosStore(mode);
        fn(montosStore, resolve, reject);
    });
}

export function addMonto(montoModel) {
    return _withMontosStore('readwrite', (montosStore, resolve, reject) => {
        const montoEntity = new MontoEntity(montoModel);
        const request = montosStore.add(montoEntity);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(new Error('Error adding monto: ' + event.target.errorCode));
    });
}

export function updateMonto(montoModel) {
    return _withMontosStore('readwrite', (montosStore, resolve, reject) => {
        const montoEntity = new MontoEntity(montoModel);
        const request = montosStore.put(montoEntity);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(new Error('Error updating monto: ' + event.target.errorCode));
    });
}

export function deleteMonto(id) {
    return _withMontosStore('readwrite', (montosStore, resolve, reject) => {
        const request = montosStore.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(new Error('Error deleting monto: ' + event.target.errorCode));
    });
}

export function getMonto(id) {
    return _withMontosStore('readonly', (montosStore, resolve, reject) => {
        const request = montosStore.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(new Error('Error getting monto: ' + event.target.errorCode));
    });
}

export function listMontos({ mes } = {}) {
    return _withMontosStore('readonly', (montosStore, resolve, reject) => {
        const index = montosStore.index('by_periodo');
        const request = mes ? index.getAll(mes):index.getAll();
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = (event) => reject(new Error('Error listing montos: ' + event.target.errorCode));
    });
}

export function setPagado(id, pagado) {
    return _withMontosStore('readwrite', (montosStore, resolve, reject) => {
        const getRequest = montosStore.get(id);
        getRequest.onsuccess = () => {
            const monto = getRequest.result;
            if (!monto) return reject(new Error('Monto no encontrado'));
            monto.pagado = pagado;
            const putRequest = montosStore.put(monto);
            putRequest.onsuccess = () => resolve(monto);
            putRequest.onerror = (event) => reject(new Error('Error actualizando pagado: ' + event.target.errorCode));
        };
        getRequest.onerror = (event) => reject(new Error('Error obteniendo monto: ' + event.target.errorCode));
    });
}

// Devuelve totales pagados y pendientes por moneda para un mes dado
export function countMontosByMes({ mes } = {}) {
    return _withMontosStore('readonly', (montosStore, resolve, reject) => {
        const index = montosStore.index('by_periodo');
        const request = mes ? index.getAll(mes) : index.getAll();
        request.onsuccess = () => {
            const montos = request.result;
            const totalesPendientes = {};
            const totalesPagados = {};
            montos.forEach(row => {
                if (row.pagado) {
                    totalesPagados[row.moneda] = (totalesPagados[row.moneda] || 0) + (Number(row.monto) || 0);
                } else {
                    totalesPendientes[row.moneda] = (totalesPendientes[row.moneda] || 0) + (Number(row.monto) || 0);
                }
            });
            resolve({ totalesPendientes, totalesPagados });
        };
        request.onerror = (event) => reject(new Error('Error contando montos: ' + event.target.errorCode));
    });
}
