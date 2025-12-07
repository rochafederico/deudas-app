// src/pages/Ingresos.js
import createIngresoList from '../components/IngresoList.js';
import '../components/StatsCard.js';
import { listIngresos } from '../repository/ingresoRepository.js';
import { ingresosColumns } from '../config/tables/debtTableColumns.js';

export default function Ingresos() {
    let currentMes = new Date().toISOString().slice(0, 7);
    const container = document.createElement('div');

    // Usar el header-bar como encabezado principal
    const headerBar = document.createElement('header-bar');
    headerBar.style.marginBottom = '20px';
    container.appendChild(headerBar);

    headerBar.month = currentMes;

    // Título y stats opcionales debajo del header-bar
    const title = document.createElement('h1');
    title.textContent = 'Ingresos del mes';
    title.style.cssText = 'margin: 0 0 10px 0; font-size: 1.5em;';
    container.appendChild(title);

    const stats = document.createElement('stats-card');
    container.appendChild(stats);

    // Crear y agregar la lista de ingresos
    const ingresoList = createIngresoList(currentMes);
    container.appendChild(ingresoList);

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

    // Escuchar eventos de cambios en ingresos y filtro global
    const handleIngresoAdded = () => loadTotals();
    const handleMonthChange = (event) => loadTotals(event.detail.mes);
    window.addEventListener('ingreso:added', handleIngresoAdded);
    window.addEventListener('ui:month', handleMonthChange);

    // Cleanup function para remover event listeners
    container.cleanup = () => {
        window.removeEventListener('ingreso:added', handleIngresoAdded);
        window.removeEventListener('ui:month', handleMonthChange);
        if (ingresoList.cleanup) ingresoList.cleanup();
    };

    return container;
}