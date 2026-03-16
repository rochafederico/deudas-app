// src/components/DarkToggle.js
import { injectBootstrap } from '../shared/utils/bootstrapStyles.js';

class DarkToggle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    this.shadowRoot.querySelector('button').addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      this.updateText();
    });
    this.updateText();
  }

  updateText() {
    const btn = this.shadowRoot.querySelector('button');
    btn.textContent = document.body.classList.contains('dark-mode') ? '☀️ Modo claro' : '🌙 Modo oscuro';
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-block; }
        .btn-toggle {
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          background: var(--panel-light);
          color: var(--accent);
          border: 1px solid var(--border-light);
          border-radius: 50rem;
          padding: 0.375rem 1rem;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.3s, color 0.3s;
        }
        :host-context(body.dark-mode) .btn-toggle {
          background: var(--panel-dark);
          color: var(--accent-hover);
          border: 1px solid var(--border-dark);
        }
      </style>
      <button type="button" class="btn-toggle" aria-label="Alternar modo oscuro"></button>
    `;
    injectBootstrap(this.shadowRoot);
  }
}
customElements.define('dark-toggle', DarkToggle);

export default function DarkToggleComponent() {
  return document.createElement('dark-toggle');
}
