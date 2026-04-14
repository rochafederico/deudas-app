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
    if (opts.style) node.setAttribute('style', opts.style);
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

function getFieldLabel(input) {
    return input.dataset.label || input.getAttribute('name') || 'Este campo';
}

function getRequiredErrorMessage(input) {
    if (input.dataset.requiredMessage) return input.dataset.requiredMessage;
    return `El campo ${getFieldLabel(input)} es obligatorio.`;
}

function getNumberErrorMessage(input) {
    if (input.dataset.numberMessage) return input.dataset.numberMessage;
    return 'Ingresá un número válido.';
}

function getMinErrorMessage(input) {
    if (input.dataset.minMessage) return input.dataset.minMessage;
    const label = getFieldLabel(input).toLowerCase();
    return `Ingresá un valor válido para ${label}.`;
}

export function validateFormControl(input) {
    const value = input.value;

    if (input.hasAttribute('required') && (value === '' || value == null)) {
        return { valid: false, error: getRequiredErrorMessage(input) };
    }

    if (input.getAttribute('type') === 'number' && value !== '') {
        const numberValue = Number(value);
        if (Number.isNaN(numberValue)) {
            return { valid: false, error: getNumberErrorMessage(input) };
        }
        const min = input.getAttribute('min');
        if (min !== null && numberValue < Number(min)) {
            return { valid: false, error: getMinErrorMessage(input) };
        }
    }

    return { valid: true, error: '' };
}

/**
 * Obtiene los valores de todos los inputs nativos de un formulario y valida los campos requeridos.
 * @param {HTMLElement} form - El formulario o contenedor padre
 * @returns {{ values: Object, valid: boolean, errors: Object }}
 */
export function getFormValuesAndValidate(form) {
    const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
    const values = {};
    const errors = {};
    let valid = true;
    inputs.forEach(input => {
        const name = input.getAttribute('name');
        if (!name) return;
        const value = input.value;
        values[name] = value;
        const result = validateFormControl(input);
        if (!result.valid) {
            valid = false;
            errors[name] = result.error;
        }
    });
    return { values, valid, errors };
}
