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
        this.style.display = 'inline-block';
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
        this.innerHTML = `
            <div class="form-check" style="margin:0;padding:0;min-height:auto;">
                <input class="form-check-input" type="checkbox" id="${inputId}" ${checked ? 'checked' : ''} style="width:1.4em;height:1.4em;cursor:pointer;margin:0;" />
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
