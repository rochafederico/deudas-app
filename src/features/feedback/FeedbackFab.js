// src/features/feedback/FeedbackFab.js
// Floating Action Button always visible on the SPA to open the feedback modal.

import './FeedbackModal.js';

export class FeedbackFab extends HTMLElement {
    connectedCallback() {
        if (!this._rendered) this.render();
        this._btn = this.querySelector('#feedback-fab-btn');
        this._modal = this.querySelector('feedback-modal');
        this._btn?.addEventListener('click', () => {
            this._modal?.open(this._btn);
        });
    }

    render() {
        this._rendered = true;
        this.innerHTML = `
            <button
                id="feedback-fab-btn"
                type="button"
                class="btn btn-primary rounded-circle shadow d-flex align-items-center justify-content-center position-fixed fs-5"
                style="bottom: 80px; right: 16px; width: 48px; height: 48px; z-index: 1040;"
                aria-label="Enviar feedback"
                title="Enviar feedback"
            >
                💬
            </button>
            <feedback-modal></feedback-modal>
        `;
    }
}

customElements.define('feedback-fab', FeedbackFab);

export default function FeedbackFabComponent() {
    return document.createElement('feedback-fab');
}
