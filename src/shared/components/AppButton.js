// src/components/AppButton.js
import { injectBootstrap } from '../utils/bootstrapStyles.js';

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
        const type = this.getAttribute('type') || 'button';

        // Mapear variantes a clases Bootstrap
        let btnClass = 'btn btn-primary';
        if (variant === 'delete') btnClass = 'btn btn-danger';
        else if (variant === 'success') btnClass = 'btn btn-success';
        else if (variant === 'secondary') btnClass = 'btn btn-secondary';

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: inline-block; }
                button {
                    margin: 2px;
                    font-size: 0.95em;
                    white-space: nowrap;
                }
                /* Dark mode adjustments */
                :host-context(body.dark-mode) .btn-primary {
                    background-color: #222a3a;
                    border-color: #222a3a;
                    color: #eaeaea;
                }
                :host-context(body.dark-mode) .btn-primary:hover {
                    background-color: #181a1b;
                    border-color: #181a1b;
                }
                :host-context(body.dark-mode) .btn-danger {
                    background-color: #7a1810;
                    border-color: #7a1810;
                }
                :host-context(body.dark-mode) .btn-danger:hover {
                    background-color: #d9534f;
                    border-color: #d9534f;
                }
                :host-context(body.dark-mode) .btn-success {
                    background-color: #234d23;
                    border-color: #234d23;
                }
                :host-context(body.dark-mode) .btn-success:hover {
                    background-color: #5cb85c;
                    border-color: #5cb85c;
                }
            </style>
            <button type="${type}" class="${btnClass} btn-sm" ${disabled ? 'disabled' : ''} aria-label="${this.getAttribute('aria-label') || this.textContent}" tabindex="0"><slot></slot></button>
        `;
        injectBootstrap(this.shadowRoot);
        // Workaround para submit en Shadow DOM
        const btn = this.shadowRoot.querySelector('button');
        if (type === 'submit') {
            btn.addEventListener('click', (e) => {
                const form = this.closest('form');
                if (form) {
                    e.preventDefault();
                    if (typeof form.requestSubmit === 'function') {
                        form.requestSubmit();
                    } else {
                        form.submit();
                    }
                }
            });
        }
    }
}
customElements.define('app-button', AppButton);
