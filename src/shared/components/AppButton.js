// src/components/AppButton.js
// Botón nativo Bootstrap (sin Shadow DOM)

export class AppButton extends HTMLElement {
    static get observedAttributes() {
        return ['variant', 'disabled'];
    }
    constructor() {
        super();
    }
    connectedCallback() {
        this.style.display = 'inline-block';
        if (!this._rendered) this.render();
    }
    attributeChangedCallback() {
        if (this._rendered) this.render();
    }
    render() {
        this._rendered = true;
        const variant = this.getAttribute('variant') || '';
        const disabled = this.hasAttribute('disabled');
        const type = this.getAttribute('type') || 'button';
        const text = this.textContent.trim();
        const ariaLabel = this.getAttribute('aria-label') || text;
        const title = this.getAttribute('title') || '';

        let btnClass = 'btn btn-primary btn-sm';
        if (variant === 'delete') btnClass = 'btn btn-danger btn-sm';
        else if (variant === 'success') btnClass = 'btn btn-success btn-sm';
        else if (variant === 'secondary') btnClass = 'btn btn-secondary btn-sm';

        this.innerHTML = `<button type="${type}" class="${btnClass}" ${disabled ? 'disabled' : ''} aria-label="${ariaLabel}" ${title ? `title="${title}"` : ''} tabindex="0">${text}</button>`;
    }
}
customElements.define('app-button', AppButton);
