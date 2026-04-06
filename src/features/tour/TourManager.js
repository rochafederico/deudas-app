// src/features/tour/TourManager.js
// Orquestador del tour guiado

import { tourSteps } from './tourConfig.js';
import { isTourCompleted, markTourCompleted } from './tourState.js';
import './components/TourOverlay.js';
import './components/TourTooltip.js';
import {
    trackFlowStart,
    trackFlowComplete,
    trackFlowAbandoned,
    updateFlowStep
} from '../../shared/observability/index.js';

const SCROLL_ANIMATION_DURATION_MS = 350;

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
        return this.forceStart();
    }

    /**
     * Inicia el tour sin importar si ya fue completado.
     * @returns {boolean} true siempre.
     */
    forceStart() {
        this._currentIndex = 0;
        trackFlowStart('tour', { step: tourSteps[0]?.id || 'start', totalSteps: tourSteps.length });
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
        this._tooltip.addEventListener('tour:skip', () => this._end('skipped'));

        // Reposicionar en resize
        this._resizeHandler = () => this._showStep();
        window.addEventListener('resize', this._resizeHandler);

        // Keyboard: Escape para cerrar, flechas para navegar
        this._keydownHandler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this._end('escape');
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

    async _showStep() {
        const step = tourSteps[this._currentIndex];
        if (!step) {
            this._end('completed');
            return;
        }
        updateFlowStep('tour', step.id, { totalSteps: tourSteps.length });

        const target = step.getTarget();

        // Scroll target into view if it is visible but outside the viewport
        if (target) {
            const rawRect = target.getBoundingClientRect();
            const isVisible = rawRect.width > 0 && rawRect.height > 0;
            const inViewport = rawRect.top >= 0 && rawRect.bottom <= window.innerHeight;
            if (isVisible && !inViewport) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await new Promise(r => setTimeout(r, SCROLL_ANIMATION_DURATION_MS));
            }
        }

        // Guard: tour may have been closed during the async scroll wait
        if (!this._overlay || !this._tooltip) return;

        const rawRect = target ? target.getBoundingClientRect() : null;
        // Treat zero-size rect (hidden / display:none element) as no target
        const rect = (rawRect && rawRect.width > 0 && rawRect.height > 0) ? rawRect : null;

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
            this._end('completed');
        }
    }

    _prev() {
        if (this._currentIndex > 0) {
            this._currentIndex--;
            this._showStep();
        }
    }

    _end(reason = 'completed') {
        const currentStep = tourSteps[this._currentIndex];
        if (reason === 'completed') {
            trackFlowComplete('tour', { step: currentStep?.id || 'completed', totalSteps: tourSteps.length });
        } else {
            trackFlowAbandoned('tour', currentStep?.id || 'unknown', { reason });
        }
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
