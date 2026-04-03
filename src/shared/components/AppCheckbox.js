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
        this.innerHTML = `
            <div class="form-check m-0">
                <input class="form-check-input position-static m-0" type="checkbox" id="${inputId}" aria-label="${ariaLabel}" ${checked ? 'checked' : ''} />
            </div>
        `;
        const checkbox = this.querySelector('input[type="checkbox"]');
        checkbox.checked = checked;
        checkbox.addEventListener('change', () => {
            this.checked = checkbox.checked;
            this.dispatchEvent(new CustomEvent('checkbox-change', {
                detail: { checked: checkbox.checked },
                bubbles: true
            }));
        });
    }
}

customElements.define('app-checkbox', AppCheckbox);
