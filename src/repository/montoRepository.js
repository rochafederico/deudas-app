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
