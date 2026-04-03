// src/features/tour/components/TourTooltip.js
// Web Component <tour-tooltip> - Tooltip/popover del tour con botones de navegacion

export class TourTooltip extends HTMLElement {
    constructor() {
        super();
        this._currentStep = 0;
        this._totalSteps = 0;
    }

    connectedCallback() {
        this.render();
        this.querySelector('#btn-prev').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('tour:prev', { bubbles: true, composed: true }));
        });
        this.querySelector('#btn-next').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('tour:next', { bubbles: true, composed: true }));
        });
        this.querySelector('#btn-skip').addEventListener('click', () => {
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

        const title = this.querySelector('#tour-title');
        const text = this.querySelector('#tour-text');
        const counter = this.querySelector('#tour-counter');
        const btnPrev = this.querySelector('#btn-prev');
        const btnNext = this.querySelector('#btn-next');

        title.textContent = step.title;
        text.textContent = step.text;
        counter.textContent = `${index + 1} / ${total}`;

        // Mostrar/ocultar boton "Anterior"
        btnPrev.classList.toggle('d-none', index === 0);

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
        if (!rect || position === 'center') {
            // Centrar en pantalla
            this.classList.add('top-50', 'start-50', 'translate-middle');
            this.style.removeProperty('left');
            this.style.removeProperty('top');
            this.style.removeProperty('transform');
            return;
        }

        // Reset transform
        this.classList.remove('top-50', 'start-50', 'translate-middle');
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
        this.classList.remove('d-none');
    }

    hide() {
        this.classList.add('d-none');
    }

    render() {
        this.classList.add('position-fixed', 'd-none', 'px-2', 'z-3');
        this.setAttribute('role', 'tooltip');
        this.innerHTML = `
            <div class="card bg-dark text-light shadow-lg border-0 p-4">
                <h3 id="tour-title" class="fs-5 fw-bold text-primary mb-2"></h3>
                <p id="tour-text" class="mb-3 text-light-emphasis"></p>
                <div class="d-flex justify-content-between align-items-center gap-2">
                    <span id="tour-counter" class="small text-secondary"></span>
                    <div class="d-flex gap-1 align-items-center">
                        <button class="btn btn-sm btn-link text-secondary text-decoration-none" id="btn-skip" type="button">Saltar</button>
                        <button class="btn btn-sm btn-outline-light" id="btn-prev" type="button">Anterior</button>
                        <button class="btn btn-sm btn-primary" id="btn-next" type="button">Siguiente</button>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('tour-tooltip', TourTooltip);
