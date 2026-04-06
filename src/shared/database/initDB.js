// src/database/initDB.js
import {
    DEUDAS_STORE,
    MONTOS_STORE,
    INGRESOS_STORE,
    INVERSIONES_STORE,
    ANALYTICS_EVENTS_STORE,
    DB_NAME,
    VERSION
} from './schema.js';

let db;

export function getDB() {
    return db;
}

export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, VERSION);
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(DEUDAS_STORE)) {
                db.createObjectStore(DEUDAS_STORE, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(MONTOS_STORE)) {
                const montosStore = db.createObjectStore(MONTOS_STORE, { keyPath: 'id', autoIncrement: true });
                montosStore.createIndex('by_deudaId', 'deudaId');
                montosStore.createIndex('by_periodo', 'periodo');
            }
            // Crear store para ingresos
            if (!db.objectStoreNames.contains(INGRESOS_STORE)) {
                const ingresosStore = db.createObjectStore(INGRESOS_STORE, { keyPath: 'id', autoIncrement: true });
                ingresosStore.createIndex('by_periodo', 'periodo');
                ingresosStore.createIndex('by_fecha', 'fecha');
            }
            // Crear store para inversiones
            if (!db.objectStoreNames.contains(INVERSIONES_STORE)) {
                db.createObjectStore(INVERSIONES_STORE, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(ANALYTICS_EVENTS_STORE)) {
                const analyticsStore = db.createObjectStore(ANALYTICS_EVENTS_STORE, { keyPath: 'id' });
                analyticsStore.createIndex('by_eventName', 'eventName');
                analyticsStore.createIndex('by_flow', 'flow');
                analyticsStore.createIndex('by_status', 'status');
                analyticsStore.createIndex('by_timestamp', 'timestamp');
            }
        };
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
        request.onerror = (event) => {
            reject(new Error('Error opening database: ' + event.target.errorCode));
        };
    });
}
