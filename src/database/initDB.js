// src/database/initDB.js
import { DEUDAS_STORE, MONTOS_STORE, DB_NAME, VERSION } from './schema.js';

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
        };
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
        request.onerror = (event) => {
            reject('Error opening database: ' + event.target.errorCode);
        };
    });
}
