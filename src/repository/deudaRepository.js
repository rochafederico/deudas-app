// src/repository/deudaRepository.js
// Centralized repository for Deuda and Monto CRUD/query operations
// Limpieza final: este archivo solo debe manejar operaciones de Deuda.
// No debe haber lógica de Monto separada aquí, solo la relación para agregar/actualizar/borrar montos asociados a una deuda.
import { getDB } from '../database/initDB.js';
import { DEUDAS_STORE, MONTOS_STORE } from '../database/schema.js';
import { DeudaEntity } from '../entity/DeudaEntity.js';
import { MontoEntity } from '../entity/MontoEntity.js';

export function addDeuda(deudaModel) {
    const db = getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([DEUDAS_STORE, MONTOS_STORE], 'readwrite');
        const deudasStore = transaction.objectStore(DEUDAS_STORE);
        const montosStore = transaction.objectStore(MONTOS_STORE);
        const deudaEntity = new DeudaEntity({
            acreedor: deudaModel.acreedor,
            tipoDeuda: deudaModel.tipoDeuda,
            notas: deudaModel.notas
        });
        const deudaRequest = deudasStore.add(deudaEntity);
        deudaRequest.onsuccess = () => {
            const deudaId = deudaRequest.result;
            if (deudaModel.montos && deudaModel.montos.length > 0) {
                deudaModel.montos.forEach(monto => {
                    const montoEntity = new MontoEntity({
                        deudaId,
                        monto: monto.monto,
                        moneda: monto.moneda,
                        vencimiento: monto.vencimiento
                    });
                    montosStore.add(montoEntity);
                });
            }
            resolve(deudaId);
        };
        deudaRequest.onerror = (event) => {
            reject('Error adding deuda: ' + event.target.errorCode);
        };
    });
}

export function updateDeuda(deudaModel) {
    // Validación: el id debe existir
    if (!deudaModel.id) {
        throw new Error('updateDeuda: El id de la deuda es requerido');
    }
    const db = getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([DEUDAS_STORE, MONTOS_STORE], 'readwrite');
        const deudasStore = transaction.objectStore(DEUDAS_STORE);
        const montosStore = transaction.objectStore(MONTOS_STORE);
        const deudaEntity = new DeudaEntity({
            id: deudaModel.id,
            acreedor: deudaModel.acreedor,
            tipoDeuda: deudaModel.tipoDeuda,
            notas: deudaModel.notas
        });
        const deudaRequest = deudasStore.put(deudaEntity);
        deudaRequest.onsuccess = () => {
            // Obtener todos los montos actuales de la deuda
            const index = montosStore.index('by_deudaId');
            const getMontos = index.getAll(deudaModel.id);
            getMontos.onsuccess = () => {
                const montosActuales = getMontos.result || [];
                const nuevosMontos = deudaModel.montos || [];
                // Montos a eliminar: los que están en la BD pero no en la nueva lista
                const nuevosIds = nuevosMontos.filter(m => m.id).map(m => m.id);
                montosActuales.forEach(montoBD => {
                    if (!nuevosIds.includes(montoBD.id)) {
                        montosStore.delete(montoBD.id);
                    }
                });
                // Montos a agregar o actualizar
                nuevosMontos.forEach(monto => {
                    // Si tiene id, actualizar; si no, agregar
                    const montoEntity = new MontoEntity({
                        deudaId: deudaModel.id,
                        monto: monto.monto,
                        moneda: monto.moneda,
                        vencimiento: monto.vencimiento,
                        periodo: monto.periodo
                    });
                    if (monto.id) {
                        montoEntity.id = monto.id;
                        montosStore.put(montoEntity);
                    } else {
                        montosStore.add(montoEntity);
                    }
                });
                resolve();
            };
            getMontos.onerror = (event) => {
                reject('Error updating montos: ' + event.target.errorCode);
            };
        };
        deudaRequest.onerror = (event) => {
            reject('Error updating deuda: ' + event.target.errorCode);
        };
    });
}

export function deleteDeuda(id) {
    const db = getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([DEUDAS_STORE, MONTOS_STORE], 'readwrite');
        const deudasStore = transaction.objectStore(DEUDAS_STORE);
        const montosStore = transaction.objectStore(MONTOS_STORE);
        const deudaRequest = deudasStore.delete(id);
        deudaRequest.onsuccess = () => {
            const index = montosStore.index('by_deudaId');
            const getMontos = index.getAllKeys(id);
            getMontos.onsuccess = () => {
                const keys = getMontos.result;
                keys.forEach(key => montosStore.delete(key));
                resolve();
            };
            getMontos.onerror = (event) => {
                reject('Error deleting montos: ' + event.target.errorCode);
            };
        };
        deudaRequest.onerror = (event) => {
            reject('Error deleting deuda: ' + event.target.errorCode);
        };
    });
}

export function getDeuda(id) {
    const db = getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([DEUDAS_STORE, MONTOS_STORE], 'readonly');
        const deudasStore = transaction.objectStore(DEUDAS_STORE);
        const montosStore = transaction.objectStore(MONTOS_STORE);
        const deudaRequest = deudasStore.get(id);
        deudaRequest.onsuccess = () => {
            const deuda = deudaRequest.result;
            if (!deuda) {
                resolve(null);
                return;
            }
            const index = montosStore.index('by_deudaId');
            const montosRequest = index.getAll(id);
            montosRequest.onsuccess = () => {
                deuda.montos = montosRequest.result;
                resolve(deuda);
            };
            montosRequest.onerror = (event) => {
                reject('Error getting montos: ' + event.target.errorCode);
            };
        };
        deudaRequest.onerror = (event) => {
            reject('Error getting deuda: ' + event.target.errorCode);
        };
    });
}

export function listDeudas() {
    const db = getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([DEUDAS_STORE, MONTOS_STORE], 'readonly');
        const deudasStore = transaction.objectStore(DEUDAS_STORE);
        const montosStore = transaction.objectStore(MONTOS_STORE);
        const deudasRequest = deudasStore.getAll();
        deudasRequest.onsuccess = () => {
            const deudas = deudasRequest.result;
            const montosRequest = montosStore.getAll();
            montosRequest.onsuccess = () => {
                const montos = montosRequest.result;
                const montosPorDeuda = {};
                montos.forEach(m => {
                    if (!montosPorDeuda[m.deudaId]) montosPorDeuda[m.deudaId] = [];
                    montosPorDeuda[m.deudaId].push(m);
                });
                deudas.forEach(d => {
                    d.montos = montosPorDeuda[d.id] || [];
                });
                resolve(deudas);
            };
            montosRequest.onerror = (event) => {
                reject('Error getting montos: ' + event.target.errorCode);
            };
        };
        deudasRequest.onerror = (event) => {
            reject('Error getting deudas: ' + event.target.errorCode);
        };
    });
}
