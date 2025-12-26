// test/run-repo-tests.js
// Simple E2E-like test runner using fake-indexeddb and the repository layer.
import { default as FakeIndexedDB } from 'fake-indexeddb';
global.indexedDB = FakeIndexedDB;

import { initDB } from '../src/database/initDB.js';
import { addDeuda, listDeudas, deleteDeudas } from '../src/repository/deudaRepository.js';
import { listMontos } from '../src/repository/montoRepository.js';
import { addIngreso, getAll as getAllIngresos, sumIngresosByMonth } from '../src/repository/ingresoRepository.js';

async function assert(condition, message) {
    if (!condition) {
        console.error('Assertion failed:', message);
        process.exit(1);
    }
}

async function run() {
    try {
        await initDB();
        console.log('DB initialized (fake-indexeddb)');

        // Ensure starting clean
        try { await deleteDeudas(); } catch (e) { /* ignore */ }

        // Add deuda
        const deuda = {
            acreedor: 'TestBank',
            tipoDeuda: 'Préstamo',
            notas: 'test',
            montos: [{ monto: 100, moneda: 'ARS', vencimiento: '2025-12-01' }]
        };
        const id = await addDeuda(deuda);
        console.log('addDeuda id=', id);

        const deudas = await listDeudas();
        const montos = await listMontos();
        await assert(deudas.length === 1, 'Expected 1 deuda after add');
        await assert(montos.length === 1, 'Expected 1 monto after add');

        // Test deleteDeudas
        await deleteDeudas();
        const deudasAfter = await listDeudas();
        const montosAfter = await listMontos();
        await assert(deudasAfter.length === 0, 'Expected 0 deudas after deleteDeudas');
        await assert(montosAfter.length === 0, 'Expected 0 montos after deleteDeudas');

        // Test ingresos
        const ingreso = { fecha: '2025-12-05', descripcion: 'Salario', monto: 500, moneda: 'ARS' };
        const ingresoId = await addIngreso(ingreso);
        console.log('addIngreso id=', ingresoId);
        const allIngresos = await getAllIngresos();
        await assert(allIngresos.length === 1, 'Expected 1 ingreso after add');
        const totals = await sumIngresosByMonth({ mes: '2025-12' });
        await assert(totals.ARS === 500, `Expected total ARS 500, got ${totals.ARS}`);

        console.log('\nAll tests passed ✅');
        process.exit(0);
    } catch (err) {
        console.error('Test run failed:', err);
        process.exit(1);
    }
}

run();
