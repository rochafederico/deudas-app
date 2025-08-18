// src/main.js
import initDB from './db.js';
import { on } from './events.js';

// Initialize the IndexedDB
initDB().then((db) => {
    window.db = db;

    // Banner superior demo
    const banner = document.createElement('div');
    banner.id = 'demo-banner';
    banner.style.cssText = `
        width: 100vw;
        background: #ff4081;
        color: #fff;
        padding: 16px 0;
        text-align: center;
        font-size: 1.1em;
        font-weight: bold;
        border-bottom: 2px solid #fff;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1000;
    `;
    banner.innerHTML = `
        <span style="font-size:1.5em;">🧑‍💻💸 DEMO local (IndexedDB). No sube datos.</span><br>
        <span style="font-size:1em;font-weight:normal;">Este proyecto nació porque tuve problemas con deudas impagas. Usé Excel, pero pensé: <b>¿por qué no hacer un sistema gratuito y simple que ayude a todos a organizar sus deudas?</b> <br>¡Ojalá te sirva! 🙌 <span style='font-size:1.2em;'>#DeudasCero</span></span>
    `;
    document.body.prepend(banner);

    // Wrapper para el contenido principal
    const wrapper = document.createElement('div');
    wrapper.id = 'app-wrapper';
    wrapper.style.cssText = 'margin-top:80px;';
    const appShell = document.createElement('app-shell');
    wrapper.appendChild(appShell);
    document.body.appendChild(wrapper);
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