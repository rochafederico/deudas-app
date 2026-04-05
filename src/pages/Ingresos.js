// src/pages/Ingresos.js
import '../features/stats/components/StatsCard.js';
import { listIngresos } from '../features/ingresos/ingresoRepository.js';
import { ingresosColumns } from '../shared/config/tables/debtTableColumns.js';
import { getSelectedMonth } from '../shared/MonthFilter.js';

export default function Ingresos() {
    const container = document.createElement('div');
    container.className = 'd-grid gap-3';

    // Título de la sección
    const title = document.createElement('h2');
    title.textContent = 'Ingresos del mes';
    title.className = 'h3 mb-2';
    container.appendChild(title);

    const stats = document.createElement('stats-card');
    container.appendChild(stats);

    // Cargar y mostrar totales
    const loadTotals = async () => {
        const ingresos = await listIngresos({ mes: getSelectedMonth() });
        let table = container.querySelector('app-table');
        if (!table) {
            table = document.createElement('app-table');
            container.appendChild(table);
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
