// src/components/DarkToggle.js

class DarkToggle extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.classList.add('d-inline-block');
    this.render();
    this.querySelector('button').addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      this.updateText();
    });
    this.updateText();
  }

  updateText() {
    const btn = this.querySelector('button');
    btn.textContent = document.body.classList.contains('dark-mode') ? '☀️ Modo claro' : '🌙 Modo oscuro';
  }

  render() {
    this.innerHTML = `
      <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-medium" aria-label="Alternar modo oscuro"></button>
    `;
  }
}
customElements.define('dark-toggle', DarkToggle);

export default function DarkToggleComponent() {
  return document.createElement('dark-toggle');
}
