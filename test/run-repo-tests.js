// test/run-repo-tests.js
// Simple E2E-like test runner using fake-indexeddb and the repository layer.
import { default as FakeIndexedDB } from 'fake-indexeddb';
global.indexedDB = FakeIndexedDB;

import { initDB } from '../src/shared/database/initDB.js';
import { addDeuda, getDeuda, updateDeuda, addOrMergeDeuda, listDeudas, deleteDeuda, deleteDeudas } from '../src/features/deudas/deudaRepository.js';
import { listMontos, countMontosByMes, setPagado } from '../src/repository/montoRepository.js';
import { addIngreso, getAll as getAllIngresos, sumIngresosByMonth } from '../src/repository/ingresoRepository.js';
import { addInversion, listInversiones, getInversionById, addValorToInversion, deleteInversion } from '../src/repository/inversionRepository.js';

let passed = 0;
let failed = 0;

async function assert(condition, message) {
    if (!condition) {
        console.error('  FAIL:', message);
        failed++;
    } else {
        passed++;
    }
}

async function run() {
    try {
        await initDB();
        console.log('DB initialized (fake-indexeddb)\n');

        // ===== DEUDA REPOSITORY =====
        console.log('--- deudaRepository ---');

        // Ensure starting clean
        try { await deleteDeudas(); } catch (e) { /* ignore */ }

        // Test addDeuda
        const deuda = {
            acreedor: 'TestBank',
            tipoDeuda: 'Préstamo',
            notas: 'test',
            montos: [
                { monto: 100, moneda: 'ARS', vencimiento: '2025-12-01' },
                { monto: 200, moneda: 'USD', vencimiento: '2026-01-15' }
            ]
        };
        const id = await addDeuda(deuda);
        console.log('addDeuda id=', id);
        await assert(typeof id === 'number', 'addDeuda should return a numeric id');

        // Test listDeudas
        const deudas = await listDeudas();
        await assert(deudas.length === 1, 'Expected 1 deuda after add');
        await assert(deudas[0].montos.length === 2, 'Expected 2 montos attached to deuda');
        await assert(deudas[0].acreedor === 'TestBank', 'Acreedor should be TestBank');

        // Test getDeuda
        const fetched = await getDeuda(id);
        await assert(fetched !== null, 'getDeuda should return the deuda');
        await assert(fetched.acreedor === 'TestBank', 'getDeuda acreedor should match');
        await assert(fetched.montos.length === 2, 'getDeuda should include 2 montos');

        // Test getDeuda with non-existent id
        const notFound = await getDeuda(9999);
        await assert(notFound === null, 'getDeuda with bad id should return null');

        // Test updateDeuda
        const montoIds = fetched.montos.map(m => m.id);
        await updateDeuda({
            id,
            acreedor: 'TestBank Updated',
            tipoDeuda: 'Préstamo',
            notas: 'updated',
            montos: [
                { id: montoIds[0], monto: 150, moneda: 'ARS', vencimiento: '2025-12-01', pagado: false },
                { monto: 300, moneda: 'ARS', vencimiento: '2026-02-01', pagado: false }
            ]
        });
        const updated = await getDeuda(id);
        await assert(updated.acreedor === 'TestBank Updated', 'updateDeuda should update acreedor');
        await assert(updated.montos.length === 2, 'updateDeuda should have 2 montos (1 updated, 1 new, 1 removed)');

        // Test addOrMergeDeuda - new deuda (different acreedor)
        const mergeId = await addOrMergeDeuda({
            acreedor: 'OtherBank',
            tipoDeuda: 'Tarjeta',
            notas: '',
            montos: [{ monto: 500, moneda: 'ARS', vencimiento: '2026-03-01' }]
        });
        const deudasAfterMerge = await listDeudas();
        await assert(deudasAfterMerge.length === 2, 'addOrMergeDeuda new acreedor should create new deuda');

        // Test addOrMergeDeuda - merge (same acreedor + tipoDeuda)
        await addOrMergeDeuda({
            acreedor: 'OtherBank',
            tipoDeuda: 'Tarjeta',
            notas: '',
            montos: [
                { monto: 500, moneda: 'ARS', vencimiento: '2026-03-01' },  // duplicate, should be skipped
                { monto: 700, moneda: 'ARS', vencimiento: '2026-04-01' }   // new, should be added
            ]
        });
        const merged = await getDeuda(mergeId);
        await assert(merged.montos.length === 2, 'addOrMergeDeuda should merge without duplicating (1 existing + 1 new = 2)');

        // Test deleteDeuda (single)
        await deleteDeuda(mergeId);
        const afterSingleDelete = await listDeudas();
        await assert(afterSingleDelete.length === 1, 'deleteDeuda should remove only that deuda');

        // Test deleteDeudas (all)
        await deleteDeudas();
        const deudasAfterClear = await listDeudas();
        const montosAfterClear = await listMontos();
        await assert(deudasAfterClear.length === 0, 'Expected 0 deudas after deleteDeudas');
        await assert(montosAfterClear.length === 0, 'Expected 0 montos after deleteDeudas');

        // ===== MONTO REPOSITORY =====
        console.log('--- montoRepository ---');

        // Create a deuda with montos for monto-specific tests
        const deudaForMontos = {
            acreedor: 'MontoTest',
            tipoDeuda: 'Test',
            notas: '',
            montos: [
                { monto: 1000, moneda: 'ARS', vencimiento: '2026-03-15', pagado: false },
                { monto: 2000, moneda: 'ARS', vencimiento: '2026-03-20', pagado: true },
                { monto: 500, moneda: 'USD', vencimiento: '2026-04-10', pagado: false }
            ]
        };
        await addDeuda(deudaForMontos);

        // Test listMontos
        const allMontos = await listMontos();
        await assert(allMontos.length === 3, 'Expected 3 montos total');

        // Test listMontos by mes
        const marchMontos = await listMontos({ mes: '2026-03' });
        await assert(marchMontos.length === 2, 'Expected 2 montos in March 2026');

        const aprilMontos = await listMontos({ mes: '2026-04' });
        await assert(aprilMontos.length === 1, 'Expected 1 monto in April 2026');

        // Test countMontosByMes
        const marchCounts = await countMontosByMes({ mes: '2026-03' });
        await assert(marchCounts.totalesPendientes.ARS === 1000, `Expected 1000 ARS pending in March, got ${marchCounts.totalesPendientes.ARS}`);
        await assert(marchCounts.totalesPagados.ARS === 2000, `Expected 2000 ARS paid in March, got ${marchCounts.totalesPagados.ARS}`);

        // Test setPagado
        const unpaidMonto = marchMontos.find(m => !m.pagado);
        const toggledMonto = await setPagado(unpaidMonto.id, true);
        await assert(toggledMonto.pagado === true, 'setPagado should toggle monto to paid');
        const marchCountsAfter = await countMontosByMes({ mes: '2026-03' });
        await assert(marchCountsAfter.totalesPagados.ARS === 3000, `Expected 3000 ARS paid after toggle, got ${marchCountsAfter.totalesPagados.ARS}`);

        // Cleanup
        await deleteDeudas();

        // ===== INGRESO REPOSITORY =====
        console.log('--- ingresoRepository ---');

        const ingreso = { fecha: '2025-12-05', descripcion: 'Salario', monto: 500, moneda: 'ARS' };
        const ingresoId = await addIngreso(ingreso);
        await assert(typeof ingresoId === 'number', 'addIngreso should return a numeric id');

        const allIngresos = await getAllIngresos();
        await assert(allIngresos.length === 1, 'Expected 1 ingreso after add');

        const totals = await sumIngresosByMonth({ mes: '2025-12' });
        await assert(totals.ARS === 500, `Expected total ARS 500, got ${totals.ARS}`);

        // Test sumIngresosByMonth for empty month
        const emptyTotals = await sumIngresosByMonth({ mes: '2025-01' });
        await assert(Object.keys(emptyTotals).length === 0, 'Expected empty totals for month with no ingresos');

        // ===== INVERSION REPOSITORY =====
        console.log('--- inversionRepository ---');

        const inversion = {
            nombre: 'Plazo Fijo',
            fechaCompra: '2026-01-15',
            valorInicial: 10000,
            moneda: 'ARS',
            historialValores: []
        };
        const invId = await addInversion(inversion);
        await assert(typeof invId === 'number', 'addInversion should return a numeric id');

        const inversiones = await listInversiones();
        await assert(inversiones.length === 1, 'Expected 1 inversion after add');
        await assert(inversiones[0].nombre === 'Plazo Fijo', 'Inversion nombre should match');

        // Test getInversionById
        const fetchedInv = await getInversionById(invId);
        await assert(fetchedInv !== null, 'getInversionById should return the inversion');
        await assert(fetchedInv.valorInicial === 10000, 'valorInicial should be 10000');

        // Test addValorToInversion
        const updatedInv = await addValorToInversion(invId, { fecha: '2026-02-15', valor: 10500 });
        await assert(updatedInv.historialValores.length === 1, 'Should have 1 valor in historial');
        await assert(updatedInv.historialValores[0].valor === 10500, 'Valor should be 10500');

        // Add another valor
        const updatedInv2 = await addValorToInversion(invId, { fecha: '2026-03-15', valor: 11000 });
        await assert(updatedInv2.historialValores.length === 2, 'Should have 2 valores in historial');

        // Test deleteInversion
        await deleteInversion(invId);
        const afterDelete = await listInversiones();
        await assert(afterDelete.length === 0, 'Expected 0 inversiones after delete');

        // ===== SUMMARY =====
        console.log(`\nResults: ${passed} passed, ${failed} failed`);
        if (failed > 0) {
            console.error(`\n${failed} test(s) failed`);
            process.exit(1);
        }
        console.log('\nAll tests passed ✅');
        process.exit(0);
    } catch (err) {
        console.error('Test run failed:', err);
        process.exit(1);
    }
}

run();
