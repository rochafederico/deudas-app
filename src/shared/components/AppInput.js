// src/components/AppInput.js
// Componente web <app-input> reutilizable para formularios
export class AppInput extends HTMLElement {
    static get observedAttributes() {
        return ['type', 'name', 'value', 'label', 'required', 'disabled', 'placeholder'];
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }
    attributeChangedCallback() {
        this.render();
    }
    get input() {
        return this.shadowRoot.querySelector('input, select, textarea');
    }
    connectedCallback() {
        this.render();
        const input = this.input;
        if (input) {
            input.addEventListener('input', e => {
                this._emit(e);
                // Validación rápida: limpiar error si el campo ya es válido
                if (this._errorMsg && this.hasAttribute('required') && input.value !== '') {
                    this.clearError();
                }
                if (this._errorMsg && this.getAttribute('type') === 'number' && input.value !== '' && !isNaN(Number(input.value))) {
                    this.clearError();
                }
            });
            input.addEventListener('change', e => {
                this._emit(e);
                // Igual que en input
                if (this._errorMsg && this.hasAttribute('required') && input.value !== '') {
                    this.clearError();
                }
                if (this._errorMsg && this.getAttribute('type') === 'number' && input.value !== '' && !isNaN(Number(input.value))) {
                    this.clearError();
                }
            });
            // Workaround para submit en Shadow DOM al presionar Enter
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                    const form = this.closest('form');
                    if (form && input.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                        if (typeof form.requestSubmit === 'function') {
                            form.requestSubmit();
                        } else {
                            form.submit();
                        }
                    }
                }
            });
        }
    }
    _emit(e) {
        this.value = e.target.value;
        this.dispatchEvent(new Event(e.type, { bubbles: true, composed: true }));
    }
    get value() {
        return this.input?.value;
    }
    set value(val) {
        if (this.input) this.input.value = val;
    }
    showError(msg) {
        this._errorMsg = msg;
        this._renderError();
    }
    clearError() {
        this._errorMsg = '';
        this._renderError();
    }
    _renderError() {
        let errDiv = this.shadowRoot.querySelector('.input-error');
        if (!this._errorMsg) {
            if (errDiv) errDiv.remove();
            return;
        }
        if (!errDiv) {
            errDiv = document.createElement('div');
            errDiv.className = 'input-error';
            errDiv.style.color = 'red';
            errDiv.style.fontSize = '0.95em';
            this.shadowRoot.appendChild(errDiv);
        }
        errDiv.textContent = this._errorMsg;
    }
    render() {
        const type = this.getAttribute('type') || 'text';
        const name = this.getAttribute('name') || '';
        const value = this.getAttribute('value') || '';
        const label = this.getAttribute('label') || '';
        const required = this.hasAttribute('required');
        const disabled = this.hasAttribute('disabled');
        const placeholder = this.getAttribute('placeholder') || '';
        let inputHtml = '';
        if (type === 'textarea') {
            inputHtml = `<textarea id="${name}" name="${name}" ${required ? 'required' : ''} ${disabled ? 'disabled' : ''} placeholder="${placeholder}">${value}</textarea>`;
        } else if (type === 'select') {
            // Para select, espera que el usuario agregue <option> como children
            inputHtml = `<select id="${name}" name="${name}" ${required ? 'required' : ''} ${disabled ? 'disabled' : ''}>${this.innerHTML}</select>`;
        } else {
            // Si es number, agrega step="0.01"
            const stepAttr = type === 'number' ? 'step="0.01" ' : '';
            inputHtml = `<input id="${name}" type="${type}" name="${name}" value="${value}" ${stepAttr}${required ? 'required' : ''} ${disabled ? 'disabled' : ''} placeholder="${placeholder}" />`;
        }
        this.shadowRoot.innerHTML = `
            <style>
                label { display:block; margin-bottom:4px; font-size:0.98em; color:var(--muted-light); }
                input, select, textarea {
                    border: 1px solid var(--border-light);
                    border-radius: 6px;
                    padding: 10px;
                    margin: 6px 0;
                    width: 100%;
                    box-sizing: border-box;
                    font-size: 1em;
                    background: var(--panel-light);
                    color: var(--text-light);
                    transition: background 0.3s, color 0.3s, border 0.3s;
                }
                input:focus, select:focus, textarea:focus {
                    outline: none;
                    border-color: var(--accent);
                }
                :host([disabled]) input, :host([disabled]) select, :host([disabled]) textarea {
                    background: var(--muted-light);
                    color: #aaa;
                    cursor: not-allowed;
                }
            </style>
            ${label ? `<label for="${name}">${label}</label>` : ''}
            ${inputHtml}
        `;
        this._renderError();
    }
}
customElements.define('app-input', AppInput);
