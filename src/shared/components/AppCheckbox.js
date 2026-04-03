// src/components/AppCheckbox.js
// Checkbox nativo Bootstrap (sin Shadow DOM)

export class AppCheckbox extends HTMLElement {
    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['checked', 'id'];
    }

    attributeChangedCallback() {
        if (this._rendered) this.render();
    }

    connectedCallback() {
        this.classList.add('d-inline-block');
        if (!this._rendered) this.render();
    }

    set checked(val) {
        this.setAttribute('checked', val ? 'true' : '');
    }
    get checked() {
        return this.getAttribute('checked') === 'true';
    }

    set inputId(val) {
        this.setAttribute('id', val);
    }
    get inputId() {
        return this.getAttribute('id');
    }

    render() {
        this._rendered = true;
        const checked = this.checked;
        const inputId = this.inputId || 'app-checkbox';
        const ariaLabel = this.getAttribute('aria-label') || this.getAttribute('title') || 'Seleccionar opción';
        this.replaceChildren();
        const wrapper = document.createElement('div');
        wrapper.className = 'form-check';
        const checkboxInput = document.createElement('input');
        checkboxInput.className = 'form-check-input';
        checkboxInput.type = 'checkbox';
        checkboxInput.id = inputId;
        checkboxInput.setAttribute('aria-label', ariaLabel);
        checkboxInput.checked = checked;
        checkboxInput.addEventListener('change', () => {
            this.checked = checkboxInput.checked;
            this.dispatchEvent(new CustomEvent('checkbox-change', {
                detail: { checked: checkboxInput.checked },
                bubbles: true
            }));
        });
        wrapper.appendChild(checkboxInput);
        this.appendChild(wrapper);
    }
}

customElements.define('app-checkbox', AppCheckbox);
