import { existsSync, readFileSync } from 'node:fs';
import { assert } from './setup.js';

import '../src/layout/HeaderBar.js';
import '../src/layout/DarkToggle.js';
import '../src/shared/components/AppLink.js';
import '../src/shared/components/AppCheckbox.js';
import '../src/features/tour/components/TourOverlay.js';
import '../src/features/tour/components/TourTooltip.js';
import '../src/features/import-export/components/ImportDataModal.js';

function mount(tagName) {
    const element = document.createElement(tagName);
    document.body.appendChild(element);
    return element;
}

export const tests = [
    async function bootstrapStyles_noExtraStylesheetsReferenced() {
        console.log('  bootstrap styles: index.html no referencia CSS adicional');
        const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
        assert(!indexHtml.includes('styles/base.css'), 'index.html no debe referenciar styles/base.css');
        assert(!indexHtml.includes('styles/tour.css'), 'index.html no debe referenciar styles/tour.css');
        assert(!existsSync(new URL('../styles/base.css', import.meta.url)), 'styles/base.css no debe existir');
        assert(!existsSync(new URL('../styles/tour.css', import.meta.url)), 'styles/tour.css no debe existir');
    },

    async function bootstrapStyles_componentsRenderWithoutInlineStyles() {
        console.log('  bootstrap styles: componentes principales sin style inline');
        const cases = [
            { tag: 'header-bar', selector: '.card-header' },
            { tag: 'dark-toggle', selector: '.btn.btn-outline-secondary.rounded-pill' },
            { tag: 'app-link', selector: 'a.link-light.d-inline-block' },
            { tag: 'app-checkbox', selector: '.form-check.form-switch .form-check-input' },
            { tag: 'tour-overlay', selector: 'svg.w-100.h-100' },
            { tag: 'tour-tooltip', selector: '.card.bg-dark.text-light' },
            { tag: 'import-data-modal', selector: '.alert.alert-warning' }
        ];
        for (const testCase of cases) {
            const { tag, selector } = testCase;
            const element = mount(tag);
            if (tag === 'app-link') {
                element.setAttribute('href', '/');
                element.textContent = 'Inicio';
                element.render();
            }
            if (tag === 'app-checkbox') {
                element.render();
            }
            assert(element.querySelector('[style]') === null, `${tag} no debe renderizar atributos style inline`);
            assert(element.querySelector(selector) !== null, `${tag} debe renderizar clases Bootstrap esperadas`);
            element.remove();
        }
    }
];
