// test/ingresos.test.js
// E2E tests for ingresos feature: UI component (IngresoForm) → Repository → IndexedDB
import { assert } from './setup.js';
import { getAll as getAllIngresos, sumIngresosByMonth } from '../src/repository/ingresoRepository.js';

// Import ingreso UI components (registers custom elements)
import '../src/components/IngresoForm.js';

// ===================================================================
// UC1: Registrar ingresos desde IngresoForm y consultar resumen mensual
// Flujo: usuario abre el formulario de ingresos, agrega ingresos en
// distintos meses y monedas. Luego consulta los totales por mes.
// ===================================================================
async function testRegistrarIngresosDesdeFormulario() {
    console.log('  UC1: Registrar ingresos desde IngresoForm y ver totales');

    const form = document.createElement('ingreso-form');
    document.body.appendChild(form);

    // Simular submit de 3 ingresos (como lo hace IngresoForm._onSubmit)
    const ingresos = [
        { fecha: '2026-03-05', descripcion: 'Salario', monto: 500000, moneda: 'ARS' },
        { fecha: '2026-03-20', descripcion: 'Freelance', monto: 200, moneda: 'USD' },
        { fecha: '2026-04-05', descripcion: 'Salario abril', monto: 550000, moneda: 'ARS' }
    ];

    for (const ingreso of ingresos) {
        const appForm = form.shadowRoot.querySelector('app-form');
        // Disparar form:submit como lo haria AppForm al hacer submit
        appForm.dispatchEvent(new CustomEvent('form:submit', {
            detail: {
                fecha: ingreso.fecha,
                descripcion: ingreso.descripcion,
                monto: String(ingreso.monto),
                moneda: ingreso.moneda
            },
            bubbles: true,
            composed: true
        }));
        // Esperar a que la Promise de addIngreso se resuelva
        await new Promise(r => setTimeout(r, 50));
    }

    // Verificar que los 3 ingresos se guardaron
    const todos = await getAllIngresos();
    assert(todos.length === 3, 'Debe haber 3 ingresos en total');

    // Marzo: 500000 ARS + 200 USD
    const marzo = await sumIngresosByMonth({ mes: '2026-03' });
    assert(marzo.ARS === 500000, `Ingresos marzo ARS: esperado 500000, obtenido ${marzo.ARS}`);
    assert(marzo.USD === 200, `Ingresos marzo USD: esperado 200, obtenido ${marzo.USD}`);

    // Abril: 550000 ARS
    const abril = await sumIngresosByMonth({ mes: '2026-04' });
    assert(abril.ARS === 550000, `Ingresos abril ARS: esperado 550000, obtenido ${abril.ARS}`);

    // Mes sin ingresos
    const vacio = await sumIngresosByMonth({ mes: '2026-01' });
    assert(Object.keys(vacio).length === 0, 'Mes sin ingresos devuelve objeto vacio');

    document.body.removeChild(form);
}

export const tests = [
    testRegistrarIngresosDesdeFormulario
];
