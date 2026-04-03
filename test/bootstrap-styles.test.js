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
        const tags = ['header-bar', 'dark-toggle', 'app-link', 'app-checkbox', 'tour-overlay', 'tour-tooltip', 'import-data-modal'];
        for (const tag of tags) {
            const element = mount(tag);
            if (tag === 'app-link') {
                element.setAttribute('href', '/');
                element.textContent = 'Inicio';
                element.render();
            }
            if (tag === 'app-checkbox') {
                element.render();
            }
            assert(!element.innerHTML.includes('style='), `${tag} no debe renderizar estilos inline`);
            element.remove();
        }
    }
];
