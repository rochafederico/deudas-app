// test/layout.test.js
// Tests for layout standardization: ResumenHeader dynamic updates,
// PageSectionLayout structure, and navConfig route metadata.
import { assert } from './setup.js';
import ResumenHeader from '../src/layout/ResumenHeader.js';
import '../src/layout/PageSectionLayout.js';
import { navItems } from '../src/layout/navConfig.js';

export const tests = [

    // ===================================================================
    // UC1: navConfig provides title and subtitle for each route
    // ===================================================================
    async function navConfig_hasPageMetadata() {
        console.log('  navConfig: all routes have title and subtitle');
        const requiredPaths = ['/', '/gastos', '/ingresos', '/inversiones'];
        for (const path of requiredPaths) {
            const item = navItems.find(i => i.path === path);
            assert(item !== undefined, `navConfig debe tener ruta ${path}`);
            assert(typeof item.title === 'string' && item.title.length > 0, `ruta ${path} debe tener title`);
            assert(typeof item.subtitle === 'string' && item.subtitle.length > 0, `ruta ${path} debe tener subtitle`);
        }
    },

    async function navConfig_distinctTitles() {
        console.log('  navConfig: each route has a distinct title');
        const titles = navItems.map(i => i.title);
        const unique = new Set(titles);
        assert(unique.size === titles.length, 'cada ruta debe tener un título único');
    },

    async function navConfig_homeTitle() {
        console.log('  navConfig: Home title is "Panorama financiero"');
        const home = navItems.find(i => i.path === '/');
        assert(home.title === 'Panorama financiero', 'Home debe tener título "Panorama financiero"');
    },

    async function navConfig_gastosTitle() {
        console.log('  navConfig: Gastos title is "Gastos del mes"');
        const gastos = navItems.find(i => i.path === '/gastos');
        assert(gastos.title === 'Gastos del mes', 'Gastos debe tener título "Gastos del mes"');
    },

    async function navConfig_ingresosTitle() {
        console.log('  navConfig: Ingresos title is "Ingresos del mes"');
        const ingresos = navItems.find(i => i.path === '/ingresos');
        assert(ingresos.title === 'Ingresos del mes', 'Ingresos debe tener título "Ingresos del mes"');
    },

    async function navConfig_inversionesTitle() {
        console.log('  navConfig: Inversiones title is "Seguimiento de inversiones"');
        const inversiones = navItems.find(i => i.path === '/inversiones');
        assert(inversiones.title === 'Seguimiento de inversiones', 'Inversiones debe tener título "Seguimiento de inversiones"');
    },

    // ===================================================================
    // UC2: ResumenHeader renders title, subtitle and month selector
    // ===================================================================
    async function resumenHeader_rendersDefaultContent() {
        console.log('  ResumenHeader: renders default title and subtitle');
        const header = ResumenHeader();
        document.body.appendChild(header);

        const titleEl = header.querySelector('#resumen-header-title');
        assert(titleEl !== null, 'ResumenHeader debe tener #resumen-header-title');
        assert(titleEl.textContent === 'Panorama financiero', 'Título por defecto debe ser "Panorama financiero"');

        const subtitleEl = header.querySelector('#resumen-header-subtitle');
        assert(subtitleEl !== null, 'ResumenHeader debe tener #resumen-header-subtitle');
        assert(subtitleEl.textContent.length > 0, 'Subtítulo no debe estar vacío');

        document.body.removeChild(header);
    },

    async function resumenHeader_acceptsCustomTitleAndSubtitle() {
        console.log('  ResumenHeader: accepts custom title and subtitle via options');
        const header = ResumenHeader({ title: 'Gastos del mes', subtitle: 'Mi subtítulo personalizado.' });
        document.body.appendChild(header);

        const titleEl = header.querySelector('#resumen-header-title');
        assert(titleEl.textContent === 'Gastos del mes', 'Debe renderizar el título personalizado');

        const subtitleEl = header.querySelector('#resumen-header-subtitle');
        assert(subtitleEl.textContent === 'Mi subtítulo personalizado.', 'Debe renderizar el subtítulo personalizado');

        document.body.removeChild(header);
    },

    async function resumenHeader_updateChangesTitle() {
        console.log('  ResumenHeader: update() changes title and subtitle dynamically');
        const header = ResumenHeader({ title: 'Panorama financiero', subtitle: 'Sub inicial.' });
        document.body.appendChild(header);

        header.update({ title: 'Ingresos del mes', subtitle: 'Sub actualizado.' });

        const titleEl = header.querySelector('#resumen-header-title');
        assert(titleEl.textContent === 'Ingresos del mes', 'update() debe cambiar el título');

        const subtitleEl = header.querySelector('#resumen-header-subtitle');
        assert(subtitleEl.textContent === 'Sub actualizado.', 'update() debe cambiar el subtítulo');

        document.body.removeChild(header);
    },

    async function resumenHeader_updatePartialTitle() {
        console.log('  ResumenHeader: update() with only title does not change subtitle');
        const header = ResumenHeader({ title: 'Original', subtitle: 'Sub fijo.' });
        document.body.appendChild(header);

        header.update({ title: 'Nuevo título' });

        const titleEl = header.querySelector('#resumen-header-title');
        assert(titleEl.textContent === 'Nuevo título', 'update() debe cambiar el título');

        const subtitleEl = header.querySelector('#resumen-header-subtitle');
        assert(subtitleEl.textContent === 'Sub fijo.', 'update() no debe cambiar el subtítulo si no se pasa');

        document.body.removeChild(header);
    },

    async function resumenHeader_containsMonthSelector() {
        console.log('  ResumenHeader: contains month-selector element');
        const header = ResumenHeader();
        document.body.appendChild(header);

        const selector = header.querySelector('month-selector');
        assert(selector !== null, 'ResumenHeader debe contener <month-selector>');

        document.body.removeChild(header);
    },

    // ===================================================================
    // UC3: PageSectionLayout renders card structure with toolbar slots
    // ===================================================================
    async function pageSectionLayout_rendersCardStructure() {
        console.log('  PageSectionLayout: renders card with toolbar and content slots');
        const layout = document.createElement('page-section-layout');
        document.body.appendChild(layout);

        const card = layout.querySelector('.card');
        assert(card !== null, 'PageSectionLayout debe tener .card');

        const cardHeader = layout.querySelector('.card-header');
        assert(cardHeader !== null, 'PageSectionLayout debe tener .card-header');

        const cardBody = layout.querySelector('.card-body');
        assert(cardBody !== null, 'PageSectionLayout debe tener .card-body');

        const toolbarStart = layout.querySelector('.psl-toolbar-start');
        assert(toolbarStart !== null, 'PageSectionLayout debe tener .psl-toolbar-start');

        const toolbarEnd = layout.querySelector('.psl-toolbar-end');
        assert(toolbarEnd !== null, 'PageSectionLayout debe tener .psl-toolbar-end');

        document.body.removeChild(layout);
    },

    async function pageSectionLayout_toolbarEndAcceptsElement() {
        console.log('  PageSectionLayout: toolbarEnd slot accepts an element');
        const layout = document.createElement('page-section-layout');
        document.body.appendChild(layout);

        const btn = document.createElement('button');
        btn.textContent = 'Nueva deuda';
        btn.id = 'test-btn';
        layout.toolbarEnd = btn;

        const found = layout.querySelector('#test-btn');
        assert(found !== null, 'El botón debe estar en el slot toolbarEnd');
        assert(found.textContent === 'Nueva deuda', 'El botón debe tener el texto correcto');

        document.body.removeChild(layout);
    },

    async function pageSectionLayout_toolbarStartAcceptsElement() {
        console.log('  PageSectionLayout: toolbarStart slot accepts an element');
        const layout = document.createElement('page-section-layout');
        document.body.appendChild(layout);

        const select = document.createElement('select');
        select.id = 'test-filter';
        layout.toolbarStart = select;

        const found = layout.querySelector('#test-filter');
        assert(found !== null, 'El select debe estar en el slot toolbarStart');

        document.body.removeChild(layout);
    },

    async function pageSectionLayout_contentSlotAcceptsElement() {
        console.log('  PageSectionLayout: content slot accepts an element');
        const layout = document.createElement('page-section-layout');
        document.body.appendChild(layout);

        const table = document.createElement('app-table');
        table.id = 'test-table';
        layout.content = table;

        const found = layout.querySelector('#test-table');
        assert(found !== null, 'La tabla debe estar en el slot content');

        document.body.removeChild(layout);
    },

    async function pageSectionLayout_toolbarIsHorizontal() {
        console.log('  PageSectionLayout: toolbar is flexbox with space-between');
        const layout = document.createElement('page-section-layout');
        document.body.appendChild(layout);

        const cardHeader = layout.querySelector('.card-header');
        assert(
            cardHeader.classList.contains('justify-content-between'),
            'El toolbar debe tener justify-content-between para alinear filtros a la izquierda y CTA a la derecha'
        );

        document.body.removeChild(layout);
    },

];
