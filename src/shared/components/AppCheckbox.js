// src/components/AppCheckbox.js
export class AppCheckbox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['checked', 'id'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'checked') {
            this.render();
        }
        if (name === 'id') {
            this.render();
        }
    }

    connectedCallback() {
        this.render();
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
        const checked = this.checked;
        const inputId = this.inputId || 'app-checkbox';
        this.shadowRoot.innerHTML = `
            <style>
                .wrapper { display: inline-block; position: relative; }
                input[type="checkbox"] {
                    opacity: 0;
                    position: absolute;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    margin: 0;
                }
                label {
                    display: inline-block;
                    width: 24px;
                    height: 24px;
                    border: 2px solid var(--accent, #007bff);
                    border-radius: 6px;
                    background: ${checked ? 'var(--accent, #007bff)' : '#fff'};
                    cursor: pointer;
                    transition: background 0.2s;
                    position: relative;
                }
                .check {
                    color: #fff;
                    font-size: 18px;
                    position: absolute;
                    top: 2px;
                    left: 5px;
                }
            </style>
            <span class="wrapper">
                <input type="checkbox" id="${inputId}" ${checked ? 'checked' : ''} />
                <label for="${inputId}">
                    ${checked ? '<span class="check">✓</span>' : ''}
                </label>
            </span>
        `;
        const checkbox = this.shadowRoot.querySelector('input[type="checkbox"]');
        checkbox.checked = checked;
        checkbox.addEventListener('change', e => {
            this.checked = checkbox.checked;
            this.dispatchEvent(new CustomEvent('checkbox-change', {
                detail: { checked: checkbox.checked },
                bubbles: true
            }));
        });
    }
}

customElements.define('app-checkbox', AppCheckbox);
