// src/pages/Ingresos.js
import '../features/stats/components/StatsCard.js';
import '../features/ingresos/components/IngresoModal.js';
import { listIngresos } from '../features/ingresos/ingresoRepository.js';
import { ingresosColumns } from '../shared/config/tables/debtTableColumns.js';

export default function Ingresos() {
    let currentMes = new Date().toISOString().slice(0, 7);
    const container = document.createElement('div');
    container.className = 'd-grid gap-3';

    // Usar el header-bar como encabezado principal
    const headerBar = document.createElement('header-bar');
    headerBar.classList.add('mb-4');
    headerBar.mode = 'ingresos';
    container.appendChild(headerBar);

    headerBar.month = currentMes;

    // Título y stats opcionales debajo del header-bar
    const title = document.createElement('h1');
    title.textContent = 'Ingresos del mes';
    title.className = 'h3 mb-2';
    container.appendChild(title);

    const stats = document.createElement('stats-card');
    container.appendChild(stats);

    // Cargar y mostrar totales
    const loadTotals = async (mes) => {
        const ingresos = await listIngresos({ mes: mes || currentMes });
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
    headerBar.addEventListener('month-change', (e) => {
        currentMes = e.detail.mes;
        loadTotals(currentMes);
    });

    // Abrir modal al hacer click en "Nuevo ingreso"
    headerBar.addEventListener('add-income', () => {
        let modal = container.querySelector('#ingresoModal');
        if (!modal) {
            modal = document.createElement('ingreso-modal');
            modal.id = 'ingresoModal';
            container.appendChild(modal);
        }
        modal.openCreate();
        const addIncomeBtn = headerBar.querySelector('#add-income');
        if (addIncomeBtn) modal.attachOpener(addIncomeBtn);
    });

    // Escuchar eventos de cambios en ingresos y filtro global
    const handleIngresoAdded = () => loadTotals();
    const handleMonthChange = (event) => loadTotals(event.detail.mes);
    window.addEventListener('ingreso:added', handleIngresoAdded);
    window.addEventListener('ui:month', handleMonthChange);

    // Cleanup function para remover event listeners
    container.cleanup = () => {
        window.removeEventListener('ingreso:added', handleIngresoAdded);
        window.removeEventListener('ui:month', handleMonthChange);
    };

    return container;
}
