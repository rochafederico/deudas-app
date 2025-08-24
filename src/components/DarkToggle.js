// src/components/DarkToggle.js
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
        button {
          margin-top: 12px;
          margin-bottom: 8px;
          background: var(--panel-light);
          color: var(--accent);
          border: 1px solid var(--border-light);
          border-radius: 50px;
          padding: 8px 18px;
          font-size: 1em;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
          transition: background 0.3s, color 0.3s;
        }
        :host-context(body.dark-mode) button {
          background: var(--panel-dark);
          color: var(--accent-hover);
          border: 1px solid var(--border-dark);
        }
      </style>
      <button type="button"></button>
    `;
  }
}
customElements.define('dark-toggle', DarkToggle);

export default function DarkToggleComponent() {
  return document.createElement('dark-toggle');
}
