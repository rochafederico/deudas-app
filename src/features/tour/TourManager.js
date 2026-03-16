// src/features/tour/TourManager.js
// Orquestador del tour guiado

import { tourSteps } from './tourConfig.js';
import { isTourCompleted, markTourCompleted } from './tourState.js';
import './components/TourOverlay.js';
import './components/TourTooltip.js';

export class TourManager {
    constructor() {
        this._currentIndex = 0;
        this._overlay = null;
        this._tooltip = null;
        this._resizeHandler = null;
    }

    /**
     * Inicia el tour si no fue completado previamente.
     * @returns {boolean} true si el tour se inicio, false si ya fue completado.
     */
    start() {
        if (isTourCompleted()) return false;

        this._currentIndex = 0;
        this._createElements();
        this._attachListeners();
        this._showStep();
        return true;
    }

    _createElements() {
        // Crear overlay
        this._overlay = document.createElement('tour-overlay');
        document.body.appendChild(this._overlay);

        // Crear tooltip
        this._tooltip = document.createElement('tour-tooltip');
        document.body.appendChild(this._tooltip);
    }

    _attachListeners() {
        this._tooltip.addEventListener('tour:next', () => this._next());
        this._tooltip.addEventListener('tour:prev', () => this._prev());
        this._tooltip.addEventListener('tour:skip', () => this._end());

        // Reposicionar en resize
        this._resizeHandler = () => this._showStep();
        window.addEventListener('resize', this._resizeHandler);

        // Keyboard: Escape para cerrar, flechas para navegar
        this._keydownHandler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this._end();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this._next();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this._prev();
            }
        };
        window.addEventListener('keydown', this._keydownHandler);
    }

    _showStep() {
        const step = tourSteps[this._currentIndex];
        if (!step) {
            this._end();
            return;
        }

        const target = step.getTarget();
        const rect = target ? target.getBoundingClientRect() : null;

        // Actualizar overlay
        this._overlay.highlight(rect);
        this._overlay.show();

        // Actualizar tooltip
        this._tooltip.setStep(step, this._currentIndex, tourSteps.length);
        this._tooltip.show();
        this._tooltip.positionAt(rect, step.position);
    }

    _next() {
        if (this._currentIndex < tourSteps.length - 1) {
            this._currentIndex++;
            this._showStep();
        } else {
            this._end();
        }
    }

    _prev() {
        if (this._currentIndex > 0) {
            this._currentIndex--;
            this._showStep();
        }
    }

    _end() {
        markTourCompleted();
        this._cleanup();
    }

    _cleanup() {
        if (this._overlay) {
            this._overlay.hide();
            this._overlay.remove();
            this._overlay = null;
        }
        if (this._tooltip) {
            this._tooltip.hide();
            this._tooltip.remove();
            this._tooltip = null;
        }
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
        if (this._keydownHandler) {
            window.removeEventListener('keydown', this._keydownHandler);
            this._keydownHandler = null;
        }
    }
}
