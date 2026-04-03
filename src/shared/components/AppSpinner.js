export class AppSpinner extends HTMLElement {
    static get observedAttributes() { return ['label']; }

    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.render(); }

    render() {
        const label = this.getAttribute('label') || 'Cargando...';
        this.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">${label}</span>
                </div>
                <p class="mt-2 text-muted small">${label}</p>
            </div>
        `;
    }
}

customElements.define('app-spinner', AppSpinner);
