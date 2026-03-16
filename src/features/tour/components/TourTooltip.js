// src/features/tour/components/TourTooltip.js
// Web Component <tour-tooltip> - Tooltip/popover del tour con botones de navegacion

export class TourTooltip extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._currentStep = 0;
        this._totalSteps = 0;
        this.render();
    }

    connectedCallback() {
        this.shadowRoot.getElementById('btn-prev').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('tour:prev', { bubbles: true, composed: true }));
        });
        this.shadowRoot.getElementById('btn-next').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('tour:next', { bubbles: true, composed: true }));
        });
        this.shadowRoot.getElementById('btn-skip').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('tour:skip', { bubbles: true, composed: true }));
        });
    }

    /**
     * Actualiza el contenido del tooltip.
     * @param {object} step - Paso actual { title, text }
     * @param {number} index - Indice del paso actual (0-based)
     * @param {number} total - Total de pasos
     */
    setStep(step, index, total) {
        this._currentStep = index;
        this._totalSteps = total;

        const title = this.shadowRoot.getElementById('tour-title');
        const text = this.shadowRoot.getElementById('tour-text');
        const counter = this.shadowRoot.getElementById('tour-counter');
        const btnPrev = this.shadowRoot.getElementById('btn-prev');
        const btnNext = this.shadowRoot.getElementById('btn-next');

        title.textContent = step.title;
        text.textContent = step.text;
        counter.textContent = `${index + 1} / ${total}`;

        // Mostrar/ocultar boton "Anterior"
        btnPrev.style.display = index === 0 ? 'none' : '';

        // Cambiar texto del boton siguiente en el ultimo paso
        const isLast = index === total - 1;
        btnNext.textContent = isLast ? '¡Empezar!' : 'Siguiente';
    }

    /**
     * Posiciona el tooltip relativo a un rectangulo target.
     * @param {DOMRect|null} rect - Rectangulo del target o null para centrar.
     * @param {string} position - 'top', 'bottom', 'left', 'right', 'center'
     */
    positionAt(rect, position) {
        this.style.position = 'fixed';
        this.style.zIndex = '9999';

        if (!rect || position === 'center') {
            // Centrar en pantalla
            this.style.left = '50%';
            this.style.top = '50%';
            this.style.transform = 'translate(-50%, -50%)';
            return;
        }

        // Reset transform
        this.style.transform = '';

        const tooltipRect = this.getBoundingClientRect();
        const gap = 12;
        let left, top;

        switch (position) {
            case 'bottom':
                left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                top = rect.bottom + gap;
                break;
            case 'top':
                left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                top = rect.top - tooltipRect.height - gap;
                break;
            case 'left':
                left = rect.left - tooltipRect.width - gap;
                top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                break;
            case 'right':
                left = rect.right + gap;
                top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                break;
            default:
                left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                top = rect.bottom + gap;
        }

        // Asegurar que no se salga de la pantalla
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const margin = 8;
        if (left < margin) left = margin;
        if (left + tooltipRect.width > vw - margin) left = vw - tooltipRect.width - margin;
        if (top < margin) top = margin;
        if (top + tooltipRect.height > vh - margin) {
            // Si no cabe abajo, intentar arriba
            if (position === 'bottom') {
                top = rect.top - tooltipRect.height - gap;
                if (top < margin) top = margin;
            } else {
                top = vh - tooltipRect.height - margin;
            }
        }

        this.style.left = left + 'px';
        this.style.top = top + 'px';
    }

    show() {
        this.style.display = 'block';
    }

    hide() {
        this.style.display = 'none';
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: none;
                    position: fixed;
                    z-index: 9999;
                    max-width: 360px;
                    min-width: 260px;
                }
                .tooltip {
                    background: #111a34;
                    color: #e5e7eb;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    font-family: 'Inter', Arial, sans-serif;
                    animation: fadeIn 0.2s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .tour-title {
                    font-size: 1.1em;
                    font-weight: 700;
                    color: var(--accent, rgb(61, 121, 130));
                    margin: 0 0 8px 0;
                }
                .tour-text {
                    font-size: 0.95em;
                    line-height: 1.5;
                    margin: 0 0 16px 0;
                    color: #c5c8d0;
                }
                .tour-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                }
                .tour-counter {
                    font-size: 0.8em;
                    color: #888;
                }
                .tour-actions {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }
                button {
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-size: 0.9em;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .btn-skip {
                    background: transparent;
                    color: #888;
                    padding: 8px 12px;
                }
                .btn-skip:hover {
                    color: #c5c8d0;
                }
                .btn-prev {
                    background: rgba(255,255,255,0.1);
                    color: #e5e7eb;
                }
                .btn-prev:hover {
                    background: rgba(255,255,255,0.15);
                }
                .btn-next {
                    background: var(--accent, rgb(61, 121, 130));
                    color: #fff;
                }
                .btn-next:hover {
                    background: var(--accent-hover, rgb(51, 101, 110));
                }
            </style>
            <div class="tooltip">
                <h3 class="tour-title" id="tour-title"></h3>
                <p class="tour-text" id="tour-text"></p>
                <div class="tour-footer">
                    <span class="tour-counter" id="tour-counter"></span>
                    <div class="tour-actions">
                        <button class="btn-skip" id="btn-skip" type="button">Saltar</button>
                        <button class="btn-prev" id="btn-prev" type="button">Anterior</button>
                        <button class="btn-next" id="btn-next" type="button">Siguiente</button>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('tour-tooltip', TourTooltip);
