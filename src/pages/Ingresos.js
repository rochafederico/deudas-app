// src/pages/Ingresos.js
import '../layout/HeaderBar.js';
import '../features/ingresos/components/IngresoModal.js';
import { listIngresos } from '../features/ingresos/ingresoRepository.js';
import { ingresosColumns } from '../shared/config/tables/debtTableColumns.js';
import { getSelectedMonth } from '../shared/MonthFilter.js';

export default function Ingresos() {
    const container = document.createElement('div');
    container.className = 'd-grid gap-3';

    const card = document.createElement('div');
    card.className = 'card shadow-sm';

    const header = document.createElement('header-bar');
    header.mode = 'ingresos';

    const ingresoModal = document.createElement('ingreso-modal');
    ingresoModal.id = 'ingresoModal';
    container.appendChild(ingresoModal);

    header.addEventListener('add-income', () => {
        ingresoModal.openCreate();
        const btn = header.querySelector('#add-income');
        if (btn) ingresoModal.attachOpener(btn);
    });

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body p-3 d-grid gap-3';

    // Título de la sección
    const title = document.createElement('h2');
    title.textContent = 'Ingresos del mes';
    title.className = 'h3 mb-2';
    cardBody.appendChild(title);

    card.appendChild(header);
    card.appendChild(cardBody);
    container.appendChild(card);

    // Cargar y mostrar totales
    const loadTotals = async () => {
        const ingresos = await listIngresos({ mes: getSelectedMonth() });
        let table = cardBody.querySelector('app-table');
        if (!table) {
            table = document.createElement('app-table');
            cardBody.appendChild(table);
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
