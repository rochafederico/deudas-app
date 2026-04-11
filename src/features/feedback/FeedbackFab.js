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
        this._btn?.addEventListener('mouseover', () => {
            this._btn.style.transform = 'scale(1.1)';
            this._btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
        });
        this._btn?.addEventListener('mouseout', () => {
            this._btn.style.transform = 'scale(1)';
            this._btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        });
    }

    render() {
        this._rendered = true;
        this.innerHTML = `
            <button
                id="feedback-fab-btn"
                type="button"
                aria-label="Enviar feedback"
                title="Enviar feedback"
                style="
                    position: fixed;
                    bottom: 80px;
                    right: 16px;
                    z-index: 1040;
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: none;
                    background: var(--bs-primary, #0d6efd);
                    color: #fff;
                    font-size: 1.3rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                "
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
