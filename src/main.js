// src/main.js
import initDB from './db.js';
import { on } from './events.js';

// Initialize the IndexedDB
initDB().then((db) => {
    window.db = db;
    
    // Append the app-shell component to the body
    const appShell = document.createElement('app-shell');
    document.body.appendChild(appShell);
});

// Event listeners for custom events
on('db:ready', () => {
    console.log('Database is ready');
});

on('deuda:added', () => {
    console.log('Debt added');
});

on('deuda:updated', () => {
    console.log('Debt updated');
});

on('deuda:deleted', () => {
    console.log('Debt deleted');
});