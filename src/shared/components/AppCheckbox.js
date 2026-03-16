// src/components/AppCheckbox.js
import { injectBootstrap } from '../utils/bootstrapStyles.js';

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
                :host { display: inline-block; }
                .form-check { margin: 0; padding: 0; min-height: auto; }
                .form-check-input {
                    width: 1.4em;
                    height: 1.4em;
                    cursor: pointer;
                    margin: 0;
                }
                .form-check-input:checked {
                    background-color: var(--accent, rgb(61, 121, 130));
                    border-color: var(--accent, rgb(61, 121, 130));
                }
            </style>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="${inputId}" ${checked ? 'checked' : ''} />
            </div>
        `;
        injectBootstrap(this.shadowRoot);
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
