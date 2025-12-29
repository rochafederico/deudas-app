// src/components/IngresoList.js
import { formatMoneda } from '../config/monedas.js';
import { listIngresos } from '../repository/ingresoRepository.js';
import './AppTable.js';

export default function createIngresoList(mes = new Date().toISOString().slice(0, 7)) {
    const container = document.createElement('div');
    container.className = 'ingresos-list';
    container.style.cssText = 'width: 100%; overflow-x: auto;';

    const table = document.createElement('app-table');
    container.appendChild(table);

    const renderTable = (ingresos = []) => {
        table.columns = [
            { key: 'fecha', label: 'Fecha', format: v => new Date(v).toLocaleDateString() },
            { key: 'descripcion', label: 'Descripción' },
            { key: 'monto', label: 'Monto', align: 'right', render: (v, row) => {
                return formatMoneda(row.moneda, v);
            } },
            { key: 'moneda', label: 'Moneda' }
        ];
        table.items = ingresos;
    };

    const loadIngresos = async (currentMes) => {
        const ingresos = await listIngresos({ mes: currentMes });
        renderTable(ingresos);
    };


    // Cargar ingresos iniciales
    loadIngresos(mes);

    // Escuchar eventos de cambios en ingresos y filtro global
    let currentMes = mes;
    const handleIngresoAdded = () => loadIngresos(currentMes);
    const handleMonthChange = (event) => {
        currentMes = event.detail.mes;
        loadIngresos(currentMes);
    };
    window.addEventListener('ingreso:added', handleIngresoAdded);
    window.addEventListener('ui:month', handleMonthChange);

    // Cleanup function (opcional, para ser usado si se implementa unmount)
    container.cleanup = () => {
        window.removeEventListener('ingreso:added', handleIngresoAdded);
        window.removeEventListener('ui:month', handleMonthChange);
    };

    return container;
}