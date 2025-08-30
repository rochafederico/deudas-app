// src/repository/montoRepository.js
// Repository for Monto CRUD/query operations
import { getDB } from '../database/initDB.js';
import { MONTOS_STORE } from '../database/schema.js';
import { MontoEntity } from '../entity/MontoEntity.js';

export function addMonto(montoModel) {
    const db = getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MONTOS_STORE, 'readwrite');
        const montosStore = transaction.objectStore(MONTOS_STORE);
        const montoEntity = new MontoEntity(montoModel);
        const request = montosStore.add(montoEntity);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject('Error adding monto: ' + event.target.errorCode);
    });
}

export function updateMonto(montoModel) {
    const db = getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MONTOS_STORE, 'readwrite');
        const montosStore = transaction.objectStore(MONTOS_STORE);
        const montoEntity = new MontoEntity(montoModel);
        const request = montosStore.put(montoEntity);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject('Error updating monto: ' + event.target.errorCode);
    });
}

export function deleteMonto(id) {
    const db = getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MONTOS_STORE, 'readwrite');
        const montosStore = transaction.objectStore(MONTOS_STORE);
        const request = montosStore.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject('Error deleting monto: ' + event.target.errorCode);
    });
}

export function getMonto(id) {
    const db = getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MONTOS_STORE, 'readonly');
        const montosStore = transaction.objectStore(MONTOS_STORE);
        const request = montosStore.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject('Error getting monto: ' + event.target.errorCode);
    });
}

export function listMontos({ mes } = {}) {
    const db = getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MONTOS_STORE, 'readonly');
        const montosStore = transaction.objectStore(MONTOS_STORE);
        const index = montosStore.index('by_periodo');
        const request = mes ? index.getAll(mes):index.getAll();
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = (event) => reject('Error listing montos: ' + event.target.errorCode);
    });
}

// Add more Monto-specific repository methods here as needed.

export function setPagado(id, pagado) {
    const db = getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MONTOS_STORE, 'readwrite');
        const montosStore = transaction.objectStore(MONTOS_STORE);
        const getRequest = montosStore.get(id);
        getRequest.onsuccess = () => {
            const monto = getRequest.result;
            if (!monto) return reject('Monto no encontrado');
            monto.pagado = pagado;
            const putRequest = montosStore.put(monto);
            putRequest.onsuccess = () => resolve(monto);
            putRequest.onerror = (event) => reject('Error actualizando pagado: ' + event.target.errorCode);
        };
        getRequest.onerror = (event) => reject('Error obteniendo monto: ' + event.target.errorCode);
    });
}

// Devuelve totales pagados y pendientes por moneda para un mes dado
export function countMontosByMes({ mes } = {}) {
    const db = getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MONTOS_STORE, 'readonly');
        const montosStore = transaction.objectStore(MONTOS_STORE);
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
        request.onerror = (event) => reject('Error contando montos: ' + event.target.errorCode);
    });
}
