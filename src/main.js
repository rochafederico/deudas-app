// src/main.js
import initDB from './db.js';
import { on } from './events.js';

// Toggle dark mode button
const darkToggle = document.createElement('button');
darkToggle.id = 'dark-toggle';
darkToggle.textContent = '🌙 Modo oscuro';
darkToggle.onclick = () => {
    document.body.classList.toggle('dark-mode');
    darkToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️ Modo claro' : '🌙 Modo oscuro';
};

// Banner superior demo
const banner = document.createElement('div');
banner.id = 'demo-banner';
banner.style.cssText = '';
banner.innerHTML = `
    <span style="font-size:1.5em;">💡 DEMO local</span><br>
    <span style="font-size:1em;font-weight:normal;">Tus datos quedan solo en este navegador.<br>Creado para ayudar a organizar deudas. 🙌</span>
`;

// Wrapper para el contenido principal
const wrapper = document.createElement('div');
wrapper.id = 'app-wrapper';
wrapper.style.cssText = '';
const appShell = document.createElement('app-shell');
wrapper.appendChild(appShell);

// Estructura ordenada: banner arriba, toggle dentro del banner, luego contenido
document.body.appendChild(banner);
document.body.appendChild(darkToggle);
document.body.appendChild(wrapper);

// Initialize the IndexedDB
initDB().then((db) => {
    window.db = db;
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