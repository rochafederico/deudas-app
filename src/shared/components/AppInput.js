// src/components/AppInput.js
// Componente web <app-input> reutilizable para formularios
import { injectBootstrap } from '../utils/bootstrapStyles.js';

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
            inputHtml = `<textarea id="${name}" name="${name}" class="form-control" ${required ? 'required' : ''} ${disabled ? 'disabled' : ''} placeholder="${placeholder}">${value}</textarea>`;
        } else if (type === 'select') {
            inputHtml = `<select id="${name}" name="${name}" class="form-select" ${required ? 'required' : ''} ${disabled ? 'disabled' : ''}>${this.innerHTML}</select>`;
        } else {
            const stepAttr = type === 'number' ? 'step="0.01" ' : '';
            inputHtml = `<input id="${name}" type="${type}" name="${name}" value="${value}" class="form-control" ${stepAttr}${required ? 'required' : ''} ${disabled ? 'disabled' : ''} placeholder="${placeholder}" />`;
        }
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; margin-bottom: 0.5rem; }
                label { display:block; margin-bottom:4px; font-size:0.98em; color:var(--muted-light); }
            </style>
            ${label ? `<label for="${name}" class="form-label">${label}</label>` : ''}
            ${inputHtml}
        `;
        injectBootstrap(this.shadowRoot);
        this._renderError();
    }
}
customElements.define('app-input', AppInput);
