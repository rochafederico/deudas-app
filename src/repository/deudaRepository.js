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
                        vencimiento: monto.vencimiento,
                        pagado: !!monto.pagado
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

/**
 * Agrega una deuda o, si existe una deuda con el mismo acreedor+tipoDeuda,
 * fusiona los montos evitando duplicados.
 * Retorna el id de la deuda (nuevo o existente).
 */
export function addOrMergeDeuda(deudaModel) {
    const db = getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([DEUDAS_STORE, MONTOS_STORE], 'readwrite');
        const deudasStore = transaction.objectStore(DEUDAS_STORE);
        const montosStore = transaction.objectStore(MONTOS_STORE);

        // Obtener todas las deudas para buscar coincidencia por acreedor+tipoDeuda
        const getAllReq = deudasStore.getAll();
        getAllReq.onsuccess = () => {
            const existing = (getAllReq.result || []).find(d => {
                const a = (d.acreedor || '').toString().trim().toLowerCase();
                const t = (d.tipoDeuda || '').toString().trim().toLowerCase();
                const a2 = (deudaModel.acreedor || '').toString().trim().toLowerCase();
                const t2 = (deudaModel.tipoDeuda || '').toString().trim().toLowerCase();
                return a === a2 && t === t2;
            });

            if (!existing) {
                // No existe: delegar a addDeuda para evitar duplicar la lógica de inserción
                // addDeuda retornará una promesa que resuelve con el id creado
                addDeuda(deudaModel).then(resolve).catch(reject);
                return;
            }

            // Si existe: obtener montos actuales y fusionar usando updateDeuda
            const existingId = existing.id;
            const index = montosStore.index('by_deudaId');
            const getMontosReq = index.getAll(existingId);
            getMontosReq.onsuccess = () => {
                const montosActuales = getMontosReq.result || [];
                const incoming = deudaModel.montos || [];

                // Helper para comparar igualdad de montos (monto, moneda, periodo/vencimiento)
                const montoEqual = (a, b) => {
                    const ma = Number(a.monto);
                    const mb = Number(b.monto);
                    if (ma !== mb) return false;
                    if ((a.moneda || 'ARS') !== (b.moneda || 'ARS')) return false;
                    const pa = a.periodo || (a.vencimiento ? a.vencimiento.slice(0,7) : '');
                    const pb = b.periodo || (b.vencimiento ? b.vencimiento.slice(0,7) : '');
                    if (pa && pb) {
                        if (pa === pb) return true;
                    }
                    // Fallback: comparar vencimiento exacto
                    if (a.vencimiento && b.vencimiento && a.vencimiento === b.vencimiento) return true;
                    return false;
                };

                // Filtrar incoming para quedarnos sólo con montos que no están en montosActuales
                const nuevosMontos = incoming.filter(inc => {
                    return !montosActuales.some(actual => montoEqual(actual, inc));
                });

                // Construir la unión: montos actuales (con id) + nuevos montos (sin id)
                const unionMontos = montosActuales.concat(nuevosMontos.map(m => ({
                    monto: m.monto,
                    moneda: m.moneda,
                    vencimiento: m.vencimiento,
                    periodo: m.periodo,
                    pagado: !!m.pagado
                })));

                // Delegar la lógica de sincronización/actualización a updateDeuda
                updateDeuda({
                    id: existingId,
                    acreedor: deudaModel.acreedor,
                    tipoDeuda: deudaModel.tipoDeuda,
                    notas: deudaModel.notas,
                    montos: unionMontos
                }).then(() => {
                    resolve(existingId);
                }).catch(err => {
                    reject(err);
                });
            };
            getMontosReq.onerror = (event) => {
                reject('Error getting montos for merge: ' + event.target.errorCode);
            };
        };
        getAllReq.onerror = (event) => {
            reject('Error reading deudas: ' + event.target.errorCode);
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
                        periodo: monto.periodo,
                        pagado: !!monto.pagado
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

export function deleteDeudas() {
    return new Promise((resolve, reject) => {

        const transaction = db.transaction([DEUDAS_STORE, MONTOS_STORE], 'readwrite');
        const deudasStore = transaction.objectStore(DEUDAS_STORE);
        const montosStore = transaction.objectStore(MONTOS_STORE);

        const clearMontosRequest = montosStore.clear();
        clearMontosRequest.onsuccess = () => {
            const clearDeudasRequest = deudasStore.clear();
            clearDeudasRequest.onsuccess = () => {
                resolve();
            };
            clearDeudasRequest.onerror = (event) => {
                reject('Error clearing deudas: ' + event.target.errorCode);
            };
        };
        clearMontosRequest.onerror = (event) => {
            reject('Error clearing montos: ' + event.target.errorCode);
        }
    });
}