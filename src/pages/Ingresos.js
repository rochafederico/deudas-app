// src/pages/Ingresos.js
import '../layout/PageSectionLayout.js';
import '../features/ingresos/components/IngresoModal.js';
import '../features/stats/components/StatsCard.js';
import '../shared/components/AppButton.js';
import { listIngresos } from '../features/ingresos/ingresoRepository.js';
import { ingresosColumns } from '../shared/config/tables/debtTableColumns.js';
import { getSelectedMonth } from '../shared/MonthFilter.js';

export default function Ingresos() {
    const container = document.createElement('div');
    container.className = 'd-grid gap-3';

    const ingresoModal = document.createElement('ingreso-modal');
    ingresoModal.id = 'ingresoModal';
    container.appendChild(ingresoModal);

    const layout = document.createElement('page-section-layout');

    // Toolbar: action button on the right
    const addBtn = document.createElement('app-button');
    addBtn.id = 'add-income';
    addBtn.setAttribute('variant', 'success');
    addBtn.setAttribute('aria-label', 'Agregar ingreso');
    addBtn.textContent = 'Nuevo ingreso';
    addBtn.addEventListener('click', () => {
        ingresoModal.openCreate();
        ingresoModal.attachOpener(addBtn);
    });

    layout.toolbarEnd = addBtn;

    // Content: stats card + table
    const contentSlot = document.createElement('div');
    contentSlot.className = 'd-grid gap-3';

    const stats = document.createElement('stats-card');
    contentSlot.appendChild(stats);

    layout.content = contentSlot;
    container.appendChild(layout);

    // Cargar y mostrar totales
    const loadTotals = async () => {
        const ingresos = await listIngresos({ mes: getSelectedMonth() });
        let table = contentSlot.querySelector('app-table');
        if (!table) {
            table = document.createElement('app-table');
            contentSlot.appendChild(table);
        }
        table.columnsConfig = ingresosColumns;
        table.tableData = ingresos;
    };

    // Cargar totales iniciales
    loadTotals();

    // Escuchar eventos de cambios en ingresos y filtro global de mes
    const handleIngresoAdded = () => loadTotals();
    const handleMonthChange = () => loadTotals();
    window.addEventListener('ingreso:added', handleIngresoAdded);
    window.addEventListener('ui:month', handleMonthChange);

    // Cleanup function para remover event listeners
    container.cleanup = () => {
        window.removeEventListener('ingreso:added', handleIngresoAdded);
        window.removeEventListener('ui:month', handleMonthChange);
    };

    return container;
}
