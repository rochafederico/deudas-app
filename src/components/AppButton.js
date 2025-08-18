// src/components/AppButton.js
export class AppButton extends HTMLElement {
    static get observedAttributes() {
        return ['variant', 'disabled'];
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }
    attributeChangedCallback() {
        this.render();
    }
    render() {
        const variant = this.getAttribute('variant') || '';
        const disabled = this.hasAttribute('disabled');
        this.shadowRoot.innerHTML = `
            <style>
                button {
                    background-color: var(--accent);
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    padding: 7px 16px;
                    margin: 4px 2px;
                    font-size: 1em;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s, color 0.2s;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
                    outline: none;
                    display: inline-block;
                }
                button:hover {
                    background-color: var(--accent-hover);
                }
                button:active {
                    filter: brightness(0.95);
                }
                button:disabled {
                    background-color: var(--muted-light);
                    color: #eee;
                    cursor: not-allowed;
                    opacity: 0.7;
                }
                :host([variant="delete"]) button {
                    background-color: var(--error);
                }
                :host([variant="delete"]) button:hover {
                    background-color: #b52a1a;
                }
                :host([variant="success"]) button {
                    background-color: var(--success);
                }
                :host([variant="success"]) button:hover {
                    background-color: #449d44;
                }
                /* Dark mode support: invert to darker buttons */
                :host-context(body.dark-mode) button {
                    background-color: #222a3a;
                    color: #eaeaea;
                }
                :host-context(body.dark-mode) button:hover {
                    background-color: #181a1b;
                }
                :host-context(body.dark-mode) button:disabled {
                    background-color: var(--muted-dark);
                    color: #444;
                }
                :host-context(body.dark-mode)[variant="delete"] button {
                    background-color: #7a1810;
                    color: #fff;
                }
                :host-context(body.dark-mode)[variant="delete"] button:hover {
                    background-color: #d9534f;
                }
                :host-context(body.dark-mode)[variant="success"] button {
                    background-color: #234d23;
                    color: #fff;
                }
                :host-context(body.dark-mode)[variant="success"] button:hover {
                    background-color: #5cb85c;
                }
            </style>
            <button type="button" ${disabled ? 'disabled' : ''}><slot></slot></button>
        `;
    }
}
customElements.define('app-button', AppButton);
