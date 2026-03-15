// test/run-repo-tests.js
// End-to-end test runner using fake-indexeddb.
// Tests are organized by user flows / use cases, not by repository.
import { default as FakeIndexedDB } from 'fake-indexeddb';
global.indexedDB = FakeIndexedDB;

import { initDB } from '../src/shared/database/initDB.js';
import { addDeuda, getDeuda, updateDeuda, addOrMergeDeuda, listDeudas, deleteDeuda, deleteDeudas } from '../src/features/deudas/deudaRepository.js';
import { listMontos, countMontosByMes, setPagado } from '../src/repository/montoRepository.js';
import { addIngreso, getAll as getAllIngresos, sumIngresosByMonth } from '../src/repository/ingresoRepository.js';
import { addInversion, listInversiones, getInversionById, addValorToInversion, deleteInversion } from '../src/repository/inversionRepository.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (!condition) {
        console.error('    FAIL:', message);
        failed++;
    } else {
        passed++;
    }
}

async function cleanup() {
    try { await deleteDeudas(); } catch (e) { /* ignore */ }
}

// ===================================================================
// USE CASE 1: Crear una deuda con múltiples montos en distintos meses
// Flujo: Usuario abre formulario, ingresa acreedor/tipo, agrega 3 montos
// en meses distintos (ARS y USD), guarda la deuda.
// Luego navega entre meses y ve los montos correctos en cada uno.
// ===================================================================
async function testCrearDeudaConMontosPorMes() {
    console.log('  UC1: Crear deuda con montos distribuidos por mes');
    await cleanup();

    const id = await addDeuda({
        acreedor: 'Banco Galicia',
        tipoDeuda: 'Préstamo',
        notas: 'Préstamo personal',
        montos: [
            { monto: 15000, moneda: 'ARS', vencimiento: '2026-03-15', pagado: false },
            { monto: 25000, moneda: 'ARS', vencimiento: '2026-04-15', pagado: false },
            { monto: 100, moneda: 'USD', vencimiento: '2026-05-15', pagado: false }
        ]
    });

    // Verificar que la deuda se creó con todos sus montos
    const deuda = await getDeuda(id);
    assert(deuda !== null, 'La deuda debe existir');
    assert(deuda.acreedor === 'Banco Galicia', 'Acreedor debe ser Banco Galicia');
    assert(deuda.montos.length === 3, 'Debe tener 3 montos');

    // Simular navegación por mes: marzo muestra solo el monto de marzo
    const montosMarzo = await listMontos({ mes: '2026-03' });
    assert(montosMarzo.length === 1, 'Marzo debe tener 1 monto');
    assert(montosMarzo[0].monto === 15000, 'Monto de marzo debe ser 15000');
    assert(montosMarzo[0].moneda === 'ARS', 'Moneda de marzo debe ser ARS');

    // Abril muestra solo el monto de abril
    const montosAbril = await listMontos({ mes: '2026-04' });
    assert(montosAbril.length === 1, 'Abril debe tener 1 monto');
    assert(montosAbril[0].monto === 25000, 'Monto de abril debe ser 25000');

    // Mayo muestra el monto en USD
    const montosMayo = await listMontos({ mes: '2026-05' });
    assert(montosMayo.length === 1, 'Mayo debe tener 1 monto');
    assert(montosMayo[0].moneda === 'USD', 'Moneda de mayo debe ser USD');
    assert(montosMayo[0].monto === 100, 'Monto de mayo debe ser 100');

    // Un mes sin montos debe estar vacío
    const montosJunio = await listMontos({ mes: '2026-06' });
    assert(montosJunio.length === 0, 'Junio no debe tener montos');

    await cleanup();
}

// ===================================================================
// USE CASE 2: Editar una deuda — cambiar datos, agregar/quitar montos
// Flujo: Usuario abre deuda existente, cambia el acreedor, elimina un
// monto y agrega uno nuevo, guarda.
// ===================================================================
async function testEditarDeuda() {
    console.log('  UC2: Editar deuda (cambiar datos + agregar/quitar montos)');
    await cleanup();

    const id = await addDeuda({
        acreedor: 'Visa',
        tipoDeuda: 'Tarjeta',
        notas: '',
        montos: [
            { monto: 5000, moneda: 'ARS', vencimiento: '2026-03-10', pagado: false },
            { monto: 8000, moneda: 'ARS', vencimiento: '2026-04-10', pagado: false }
        ]
    });

    const original = await getDeuda(id);
    assert(original.montos.length === 2, 'Deuda original debe tener 2 montos');

    // Editar: cambiar acreedor, mantener primer monto, eliminar segundo, agregar nuevo
    const keepMontoId = original.montos[0].id;
    await updateDeuda({
        id,
        acreedor: 'Visa Gold',
        tipoDeuda: 'Tarjeta',
        notas: 'Upgrade a gold',
        montos: [
            { id: keepMontoId, monto: 5000, moneda: 'ARS', vencimiento: '2026-03-10', pagado: false },
            { monto: 12000, moneda: 'ARS', vencimiento: '2026-05-10', pagado: false }
        ]
    });

    const edited = await getDeuda(id);
    assert(edited.acreedor === 'Visa Gold', 'Acreedor actualizado a Visa Gold');
    assert(edited.notas === 'Upgrade a gold', 'Notas actualizadas');
    assert(edited.montos.length === 2, 'Debe tener 2 montos (1 mantenido + 1 nuevo)');

    // El monto de abril fue eliminado
    const montosAbril = await listMontos({ mes: '2026-04' });
    assert(montosAbril.length === 0, 'No debe haber montos en abril (fue eliminado)');

    // El nuevo monto de mayo existe
    const montosMayo = await listMontos({ mes: '2026-05' });
    assert(montosMayo.length === 1, 'Debe haber 1 monto en mayo (nuevo)');
    assert(montosMayo[0].monto === 12000, 'Monto de mayo debe ser 12000');

    await cleanup();
}

// ===================================================================
// USE CASE 3: Marcar monto como pagado y verificar totales del mes
// Flujo: Usuario ve la lista de montos del mes, marca uno como pagado
// con el checkbox. Los totales de "pagado" y "pendiente" se actualizan.
// ===================================================================
async function testTogglePagado() {
    console.log('  UC3: Toggle pagado y verificar totales mensuales');
    await cleanup();

    await addDeuda({
        acreedor: 'Telefónica',
        tipoDeuda: 'Servicio',
        notas: '',
        montos: [
            { monto: 3000, moneda: 'ARS', vencimiento: '2026-03-01', pagado: false },
            { monto: 2000, moneda: 'ARS', vencimiento: '2026-03-15', pagado: false },
            { monto: 50, moneda: 'USD', vencimiento: '2026-03-20', pagado: false }
        ]
    });

    // Estado inicial: todo pendiente
    const antes = await countMontosByMes({ mes: '2026-03' });
    assert(antes.totalesPendientes.ARS === 5000, 'Pendiente ARS inicial: 5000');
    assert(antes.totalesPendientes.USD === 50, 'Pendiente USD inicial: 50');
    assert(!antes.totalesPagados.ARS, 'Pagado ARS inicial: 0');

    // Marcar el primer monto como pagado
    const montos = await listMontos({ mes: '2026-03' });
    const primerMontoARS = montos.find(m => m.monto === 3000);
    await setPagado(primerMontoARS.id, true);

    // Verificar que los totales se actualizaron
    const despues = await countMontosByMes({ mes: '2026-03' });
    assert(despues.totalesPagados.ARS === 3000, 'Pagado ARS después: 3000');
    assert(despues.totalesPendientes.ARS === 2000, 'Pendiente ARS después: 2000');
    assert(despues.totalesPendientes.USD === 50, 'USD pendiente no cambió: 50');

    // Desmarcar (volver a pendiente)
    await setPagado(primerMontoARS.id, false);
    const revertido = await countMontosByMes({ mes: '2026-03' });
    assert(revertido.totalesPendientes.ARS === 5000, 'Después de desmarcar, pendiente ARS vuelve a 5000');
    assert(!revertido.totalesPagados.ARS, 'Después de desmarcar, pagado ARS vuelve a 0');

    await cleanup();
}

// ===================================================================
// USE CASE 4: Importar datos con merge (evitar duplicados)
// Flujo: Usuario tiene una deuda existente, importa un backup JSON que
// tiene la misma deuda con algunos montos iguales y otros nuevos.
// Los montos duplicados no se repiten, los nuevos se agregan.
// ===================================================================
async function testImportarConMerge() {
    console.log('  UC4: Importar datos con merge (sin duplicar montos)');
    await cleanup();

    // Deuda existente en la app
    await addDeuda({
        acreedor: 'Banco Nación',
        tipoDeuda: 'Hipotecario',
        notas: '',
        montos: [
            { monto: 50000, moneda: 'ARS', vencimiento: '2026-03-01', pagado: true },
            { monto: 50000, moneda: 'ARS', vencimiento: '2026-04-01', pagado: false }
        ]
    });

    // Simular importación: misma deuda (mismo acreedor+tipo) con 1 monto repetido + 1 nuevo
    await addOrMergeDeuda({
        acreedor: 'Banco Nación',
        tipoDeuda: 'Hipotecario',
        notas: '',
        montos: [
            { monto: 50000, moneda: 'ARS', vencimiento: '2026-04-01', pagado: false }, // ya existe
            { monto: 50000, moneda: 'ARS', vencimiento: '2026-05-01', pagado: false }  // nuevo
        ]
    });

    // Debe seguir habiendo 1 sola deuda (merge, no duplicar)
    const deudas = await listDeudas();
    assert(deudas.length === 1, 'Merge: debe seguir siendo 1 deuda');
    assert(deudas[0].montos.length === 3, 'Merge: 2 originales + 1 nuevo = 3 montos');

    // Importar deuda con acreedor diferente: debe crear una nueva
    await addOrMergeDeuda({
        acreedor: 'Banco Provincia',
        tipoDeuda: 'Personal',
        notas: '',
        montos: [
            { monto: 10000, moneda: 'ARS', vencimiento: '2026-06-01', pagado: false }
        ]
    });
    const deudasFinal = await listDeudas();
    assert(deudasFinal.length === 2, 'Import nuevo acreedor: debe haber 2 deudas');

    await cleanup();
}

// ===================================================================
// USE CASE 5: Eliminar una deuda individual y luego eliminar todo
// Flujo: Usuario tiene varias deudas, elimina una (con sus montos).
// Luego usa "Eliminar todo" para borrar todo.
// ===================================================================
async function testEliminarDeudas() {
    console.log('  UC5: Eliminar deuda individual y eliminar todo');
    await cleanup();

    const id1 = await addDeuda({
        acreedor: 'Deuda A',
        tipoDeuda: 'Servicio',
        notas: '',
        montos: [{ monto: 1000, moneda: 'ARS', vencimiento: '2026-03-01' }]
    });
    const id2 = await addDeuda({
        acreedor: 'Deuda B',
        tipoDeuda: 'Préstamo',
        notas: '',
        montos: [
            { monto: 2000, moneda: 'ARS', vencimiento: '2026-03-01' },
            { monto: 3000, moneda: 'ARS', vencimiento: '2026-04-01' }
        ]
    });

    // Verificar estado inicial
    let deudas = await listDeudas();
    let montos = await listMontos();
    assert(deudas.length === 2, 'Inicio: 2 deudas');
    assert(montos.length === 3, 'Inicio: 3 montos totales');

    // Eliminar deuda A (debe eliminar solo esa deuda y su monto)
    await deleteDeuda(id1);
    deudas = await listDeudas();
    montos = await listMontos();
    assert(deudas.length === 1, 'Después de borrar A: 1 deuda');
    assert(deudas[0].acreedor === 'Deuda B', 'La deuda restante es B');
    assert(montos.length === 2, 'Después de borrar A: 2 montos (solo los de B)');

    // Eliminar todo
    await deleteDeudas();
    deudas = await listDeudas();
    montos = await listMontos();
    assert(deudas.length === 0, 'Después de eliminar todo: 0 deudas');
    assert(montos.length === 0, 'Después de eliminar todo: 0 montos');
}

// ===================================================================
// USE CASE 6: Registrar ingresos y consultar resumen mensual
// Flujo: Usuario registra ingresos en distintos meses y monedas.
// Consulta el resumen y ve totales correctos por mes y moneda.
// ===================================================================
async function testIngresosYResumenMensual() {
    console.log('  UC6: Registrar ingresos y consultar resumen por mes');

    await addIngreso({ fecha: '2026-03-05', descripcion: 'Salario', monto: 500000, moneda: 'ARS' });
    await addIngreso({ fecha: '2026-03-20', descripcion: 'Freelance', monto: 200, moneda: 'USD' });
    await addIngreso({ fecha: '2026-04-05', descripcion: 'Salario abril', monto: 550000, moneda: 'ARS' });

    // Marzo: 500000 ARS + 200 USD
    const marzo = await sumIngresosByMonth({ mes: '2026-03' });
    assert(marzo.ARS === 500000, `Ingresos marzo ARS: esperado 500000, obtenido ${marzo.ARS}`);
    assert(marzo.USD === 200, `Ingresos marzo USD: esperado 200, obtenido ${marzo.USD}`);

    // Abril: 550000 ARS
    const abril = await sumIngresosByMonth({ mes: '2026-04' });
    assert(abril.ARS === 550000, `Ingresos abril ARS: esperado 550000, obtenido ${abril.ARS}`);

    // Mes sin ingresos
    const vacio = await sumIngresosByMonth({ mes: '2026-01' });
    assert(Object.keys(vacio).length === 0, 'Mes sin ingresos debe devolver objeto vacío');

    // getAll devuelve todos
    const todos = await getAllIngresos();
    assert(todos.length === 3, 'Debe haber 3 ingresos en total');
}

// ===================================================================
// USE CASE 7: Gestionar inversiones (crear, actualizar valor, eliminar)
// Flujo: Usuario registra una inversión, va agregando valores mensuales
// para seguir la evolución, y puede eliminarla.
// ===================================================================
async function testGestionInversiones() {
    console.log('  UC7: Gestionar inversiones (crear, seguimiento, eliminar)');

    const invId = await addInversion({
        nombre: 'Plazo Fijo',
        fechaCompra: '2026-01-15',
        valorInicial: 100000,
        moneda: 'ARS',
        historialValores: []
    });
    assert(typeof invId === 'number', 'addInversion debe retornar id numérico');

    // Ver inversiones
    let inversiones = await listInversiones();
    assert(inversiones.length === 1, 'Debe haber 1 inversión');
    assert(inversiones[0].nombre === 'Plazo Fijo', 'Nombre debe ser Plazo Fijo');

    // Agregar primer valor (ganancia)
    let inv = await addValorToInversion(invId, { fecha: '2026-02-15', valor: 105000 });
    assert(inv.historialValores.length === 1, 'Debe tener 1 valor en historial');
    assert(inv.historialValores[0].valor === 105000, 'Primer valor: 105000');

    // Agregar segundo valor
    inv = await addValorToInversion(invId, { fecha: '2026-03-15', valor: 110000 });
    assert(inv.historialValores.length === 2, 'Debe tener 2 valores en historial');

    // Verificar que getInversionById trae el historial completo
    const detalle = await getInversionById(invId);
    assert(detalle.valorInicial === 100000, 'valorInicial debe ser 100000');
    assert(detalle.historialValores.length === 2, 'Historial debe tener 2 entradas');
    const ultimoValor = detalle.historialValores[detalle.historialValores.length - 1].valor;
    assert(ultimoValor === 110000, 'Último valor debe ser 110000');

    // Crear segunda inversión en USD
    const invId2 = await addInversion({
        nombre: 'ETF S&P',
        fechaCompra: '2026-02-01',
        valorInicial: 500,
        moneda: 'USD',
        historialValores: []
    });
    inversiones = await listInversiones();
    assert(inversiones.length === 2, 'Debe haber 2 inversiones');

    // Eliminar la primera
    await deleteInversion(invId);
    inversiones = await listInversiones();
    assert(inversiones.length === 1, 'Después de eliminar: 1 inversión');
    assert(inversiones[0].nombre === 'ETF S&P', 'La inversión restante es ETF S&P');

    // Eliminar la segunda
    await deleteInversion(invId2);
    inversiones = await listInversiones();
    assert(inversiones.length === 0, 'Después de eliminar todo: 0 inversiones');
}

// ===================================================================
// USE CASE 8: Múltiples deudas con montos en el mismo mes
// Flujo: Usuario tiene 2 deudas distintas con montos en el mismo mes.
// Al consultar el mes, ve todos los montos de todas las deudas.
// Los totales reflejan la suma de todo.
// ===================================================================
async function testMultiplesDeudasMismoMes() {
    console.log('  UC8: Múltiples deudas con montos en el mismo mes');
    await cleanup();

    await addDeuda({
        acreedor: 'Edenor',
        tipoDeuda: 'Servicio',
        notas: '',
        montos: [{ monto: 8000, moneda: 'ARS', vencimiento: '2026-03-10', pagado: false }]
    });
    await addDeuda({
        acreedor: 'Personal',
        tipoDeuda: 'Servicio',
        notas: '',
        montos: [
            { monto: 5000, moneda: 'ARS', vencimiento: '2026-03-15', pagado: false },
            { monto: 20, moneda: 'USD', vencimiento: '2026-03-15', pagado: true }
        ]
    });

    // Marzo tiene montos de ambas deudas
    const montosMarzo = await listMontos({ mes: '2026-03' });
    assert(montosMarzo.length === 3, 'Marzo debe tener 3 montos (1 de Edenor + 2 de Personal)');

    // Totales de marzo
    const totales = await countMontosByMes({ mes: '2026-03' });
    assert(totales.totalesPendientes.ARS === 13000, 'Pendiente ARS marzo: 8000 + 5000 = 13000');
    assert(totales.totalesPagados.USD === 20, 'Pagado USD marzo: 20');

    // listDeudas devuelve cada deuda con SUS montos
    const deudas = await listDeudas();
    assert(deudas.length === 2, 'Debe haber 2 deudas');
    const edenor = deudas.find(d => d.acreedor === 'Edenor');
    const personal = deudas.find(d => d.acreedor === 'Personal');
    assert(edenor.montos.length === 1, 'Edenor tiene 1 monto');
    assert(personal.montos.length === 2, 'Personal tiene 2 montos');

    await cleanup();
}

// ===================================================================
// RUNNER
// ===================================================================
async function run() {
    try {
        await initDB();
        console.log('DB initialized (fake-indexeddb)\n');

        await testCrearDeudaConMontosPorMes();
        await testEditarDeuda();
        await testTogglePagado();
        await testImportarConMerge();
        await testEliminarDeudas();
        await testIngresosYResumenMensual();
        await testGestionInversiones();
        await testMultiplesDeudasMismoMes();

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
