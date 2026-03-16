// src/features/tour/components/TourOverlay.js
// Web Component <tour-overlay> - Overlay oscuro con recorte para highlight

export class TourOverlay extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._visible = false;
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 9998;
                    pointer-events: none;
                }
                :host([visible]) {
                    display: block;
                }
                svg {
                    width: 100%;
                    height: 100%;
                }
            </style>
            <svg xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <mask id="tour-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white"/>
                        <rect id="highlight-cutout" x="0" y="0" width="0" height="0" rx="8" ry="8" fill="black"/>
                    </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tour-mask)" pointer-events="all"/>
            </svg>
        `;
    }

    /**
     * Muestra el overlay y recorta el area del elemento target.
     * @param {DOMRect|null} rect - Rectangulo del elemento a destacar, o null para overlay completo.
     * @param {number} padding - Padding alrededor del highlight (px).
     */
    highlight(rect, padding = 8) {
        const cutout = this.shadowRoot.getElementById('highlight-cutout');
        if (!cutout) return;

        if (rect) {
            cutout.setAttribute('x', rect.left - padding);
            cutout.setAttribute('y', rect.top - padding);
            cutout.setAttribute('width', rect.width + padding * 2);
            cutout.setAttribute('height', rect.height + padding * 2);
        } else {
            // Sin target: overlay completo sin recorte
            cutout.setAttribute('x', 0);
            cutout.setAttribute('y', 0);
            cutout.setAttribute('width', 0);
            cutout.setAttribute('height', 0);
        }
    }

    show() {
        this._visible = true;
        this.setAttribute('visible', '');
    }

    hide() {
        this._visible = false;
        this.removeAttribute('visible');
    }
}

customElements.define('tour-overlay', TourOverlay);
