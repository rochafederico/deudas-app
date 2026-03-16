// src/components/DarkToggle.js

class DarkToggle extends HTMLElement {
  constructor() {
    super();
    this.style.display = 'inline-block';
  }

  connectedCallback() {
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
      <button type="button" class="btn btn-outline-secondary btn-sm" style="border-radius:50rem;padding:0.375rem 1rem;font-size:0.9rem;font-weight:500;cursor:pointer;" aria-label="Alternar modo oscuro"></button>
    `;
  }
}
customElements.define('dark-toggle', DarkToggle);

export default function DarkToggleComponent() {
  return document.createElement('dark-toggle');
}
