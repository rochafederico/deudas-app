import './Menu.js';
import './DarkToggle.js';
export class DemoBanner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: var(--accent);
          color: #fff;
          font-family: 'Inter', Arial, sans-serif;
          font-size: 1.1em;
          font-weight: 600;
          width: 100vw;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .title {
          font-size: 1.4em;
          font-weight: bold;
          color: #fff;
          letter-spacing: 0.5px;
        }
        .menu {
          margin: 0 24px;
        }
        .right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        body.dark-mode .banner {
          background: var(--accent-hover);
          color: #eaeaea;
          border-bottom: 2px solid #333;
          display: flex;
          flex-wrap: wrap;
        }
      </style>
      <header class="banner">
        <h1 class="title">Nivva</h1>
        <div class="menu"><main-menu></main-menu></div>
        <div class="right"></div>
      </header>
    `;
    // Insertar el botón de modo oscuro en el lado derecho
    // const right = this.shadowRoot.querySelector('.right');
    // if (right) {
    //   right.appendChild(document.createElement('dark-toggle'));
    // }
  }
}
customElements.define('demo-banner', DemoBanner);

export default function DemoBannerComponent() {
  return document.createElement('demo-banner');
}
