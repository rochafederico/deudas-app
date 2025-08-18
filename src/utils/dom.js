// src/utils/dom.js
// Utilidad para crear y agregar elementos dinámicamente en componentes

/**
 * Crea un elemento y le asigna propiedades y listeners.
 * @param {string} tag - Etiqueta del elemento (ej: 'td', 'button')
 * @param {Object} opts - Opciones: {text, html, className, attrs, on, children}
 * @returns {HTMLElement}
 */
export function el(tag, opts = {}) {
    const node = document.createElement(tag);
    if (opts.text) node.textContent = opts.text;
    if (opts.html) node.innerHTML = opts.html;
    if (opts.className) node.className = opts.className;
    if (opts.attrs) {
        Object.entries(opts.attrs).forEach(([k, v]) => node.setAttribute(k, v));
    }
    if (opts.on) {
        Object.entries(opts.on).forEach(([ev, fn]) => node.addEventListener(ev, fn));
    }
    if (opts.children) {
        opts.children.forEach(child => node.appendChild(child));
    }
    return node;
}

/**
 * Agrega una lista de celdas a una fila
 * @param {HTMLTableRowElement} row
 * @param {Array} cells - [{text, ...opts}]
 */
export function appendCells(row, cells) {
    cells.forEach(cellOpts => row.appendChild(el('td', cellOpts)));
}
