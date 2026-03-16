// src/components/AppInput.js
// Input nativo Bootstrap (sin Shadow DOM)

export class AppInput extends HTMLElement {
    static get observedAttributes() {
        return ['type', 'name', 'value', 'label', 'required', 'disabled', 'placeholder'];
    }
    constructor() {
        super();
        this.style.display = 'block';
        this.style.marginBottom = '0.5rem';
    }
    connectedCallback() {
        if (!this._rendered) this.render();
        this._setupListeners();
    }
    attributeChangedCallback() {
        if (this._rendered) this.render();
    }
    get input() {
        return this.querySelector('input, select, textarea');
    }
    _setupListeners() {
        const input = this.input;
        if (!input || this._listenersAttached) return;
        this._listenersAttached = true;
        input.addEventListener('input', e => {
            this.dispatchEvent(new Event(e.type, { bubbles: true, composed: true }));
        });
        input.addEventListener('change', e => {
            this.dispatchEvent(new Event(e.type, { bubbles: true, composed: true }));
        });
    }
    get value() {
        return this.input?.value;
    }
    set value(val) {
        if (this.input) this.input.value = val;
    }
    showError(msg) {
        const input = this.input;
        if (input) input.classList.add('is-invalid');
        let errDiv = this.querySelector('.invalid-feedback');
        if (!errDiv) {
            errDiv = document.createElement('div');
            errDiv.className = 'invalid-feedback';
            errDiv.style.display = 'block';
            this.appendChild(errDiv);
        }
        errDiv.textContent = msg;
        errDiv.style.display = 'block';
    }
    clearError() {
        const input = this.input;
        if (input) input.classList.remove('is-invalid');
        const errDiv = this.querySelector('.invalid-feedback');
        if (errDiv) {
            errDiv.textContent = '';
            errDiv.style.display = 'none';
        }
    }
    render() {
        this._rendered = true;
        this._listenersAttached = false;
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
        this.innerHTML = `
            ${label ? `<label for="${name}" class="form-label">${label}</label>` : ''}
            ${inputHtml}
        `;
        this._setupListeners();
    }
}
customElements.define('app-input', AppInput);
