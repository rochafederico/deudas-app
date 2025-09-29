import { initDB as initDatabase } from './database/initDB.js';

const DB_NAME = 'deudasapp';
const DEUDAS_STORE = 'deudas';
const MONTOS_STORE = 'montos';
const VERSION = 2;

let db;

export default async () => {
    const db = await initDatabase();
    return db
}
