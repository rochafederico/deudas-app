// test/import-export.test.js
// E2E tests for import-export feature: ExportDataModal and ImportDataModal
// Tests the full round-trip: create data → export → clear → import → verify
import { assert } from './setup.js';

// Repositories for creating/verifying data
import { addOrMergeDeuda, listDeudas, deleteDeudas } from '../src/features/deudas/deudaRepository.js';
import { DeudaModel } from '../src/features/deudas/DeudaModel.js';
import { MontoModel } from '../src/features/montos/MontoModel.js';
import { addIngreso, getAll as getAllIngresos } from '../src/features/ingresos/ingresoRepository.js';
import { addInversion, listInversiones } from '../src/features/inversiones/inversionRepository.js';

// DB access for cleanup
import { getDB } from '../src/shared/database/initDB.js';
import { INGRESOS_STORE, INVERSIONES_STORE } from '../src/shared/database/schema.js';

// Import UI components (registers custom elements)
import '../src/features/import-export/components/ExportDataModal.js';
import '../src/features/import-export/components/ImportDataModal.js';

async function cleanupIngresos() {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const tx = db.transaction(INGRESOS_STORE, 'readwrite');
        const store = tx.objectStore(INGRESOS_STORE);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
    });
}

async function cleanupInversiones() {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const tx = db.transaction(INVERSIONES_STORE, 'readwrite');
        const store = tx.objectStore(INVERSIONES_STORE);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
    });
}

async function cleanupAll() {
    try { await deleteDeudas(); } catch (_e) { /* ignore */ }
    await cleanupIngresos();
    await cleanupInversiones();
}

// ===================================================================
// UC1: Importar datos completos (deudas + ingresos + inversiones)
// Flujo: usuario selecciona un JSON backup con las 3 entidades,
// ImportDataModal procesa los datos y los guarda en IndexedDB.
// Verificamos que todo llega correctamente a la DB.
// ===================================================================
async function testImportarDatosCompletos() {
    console.log('  UC1: Importar datos completos (deudas + ingresos + inversiones)');
    await cleanupAll();

    const modal = document.createElement('import-data-modal');
    document.body.appendChild(modal);

    // Simular datos de backup JSON
    modal.importData = {
        deudas: [
            {
                acreedor: 'Banco Test',
                tipoDeuda: 'Prestamo',
                notas: 'Prestamo personal',
                montos: [
                    { monto: 15000, moneda: 'ARS', vencimiento: '2026-03-15', periodo: '2026-03', pagado: false },
                    { monto: 25000, moneda: 'ARS', vencimiento: '2026-04-15', periodo: '2026-04', pagado: true }
                ]
            }
        ],
        ingresos: [
            { descripcion: 'Sueldo', monto: 500000, moneda: 'ARS', fecha: '2026-03-01' },
            { descripcion: 'Freelance', monto: 1000, moneda: 'USD', fecha: '2026-03-15' }
        ],
        inversiones: [
            {
                nombre: 'Cedear AAPL',
                fechaCompra: '2026-01-15',
                valorInicial: 50000,
                moneda: 'USD',
                historialValores: [
                    { fecha: '2026-01-15', valor: 50000 },
                    { fecha: '2026-02-15', valor: 52000 }
                ]
            },
            {
                nombre: 'Plazo Fijo',
                fechaCompra: '2026-02-01',
                valorInicial: 1000000,
                moneda: 'ARS',
                historialValores: [{ fecha: '2026-02-01', valor: 1000000 }]
            }
        ]
    };

    // Ejecutar importación (skip the setTimeout/close flow by calling directly)
    await modal.importDataToDb();
    await new Promise(r => setTimeout(r, 100));

    // Verificar deudas en DB
    const deudas = await listDeudas();
    assert(deudas.length === 1, 'Import: 1 deuda en DB');
    assert(deudas[0].acreedor === 'Banco Test', 'Import: acreedor correcto');
    assert(deudas[0].montos.length === 2, 'Import: 2 montos en la deuda');

    // Verificar ingresos en DB
    const ingresos = await getAllIngresos();
    assert(ingresos.length === 2, 'Import: 2 ingresos en DB');
    const sueldo = ingresos.find(i => i.descripcion === 'Sueldo');
    assert(sueldo !== undefined, 'Import: ingreso Sueldo existe');
    assert(sueldo.monto === 500000, 'Import: monto Sueldo = 500000');

    // Verificar inversiones en DB
    const inversiones = await listInversiones();
    assert(inversiones.length === 2, 'Import: 2 inversiones en DB');
    const cedear = inversiones.find(i => i.nombre === 'Cedear AAPL');
    assert(cedear !== undefined, 'Import: Cedear AAPL existe');
    assert(cedear.moneda === 'USD', 'Import: Cedear moneda USD');
    assert(cedear.valorInicial === 50000, 'Import: Cedear valorInicial = 50000');
    assert(cedear.historialValores.length === 2, 'Import: Cedear tiene 2 valores en historial');
    assert(cedear.historialValores[1].valor === 52000, 'Import: Cedear ultimo valor = 52000');

    const plazoFijo = inversiones.find(i => i.nombre === 'Plazo Fijo');
    assert(plazoFijo !== undefined, 'Import: Plazo Fijo existe');
    assert(plazoFijo.moneda === 'ARS', 'Import: Plazo Fijo moneda ARS');

    document.body.removeChild(modal);
    await cleanupAll();
}

// ===================================================================
// UC2: Importar backup sin inversiones (retrocompatibilidad)
// Flujo: usuario importa un backup viejo que solo tiene deudas e
// ingresos (sin clave "inversiones"). La importación debe funcionar
// sin errores y no crear inversiones fantasma.
// ===================================================================
async function testImportarSinInversiones() {
    console.log('  UC2: Importar backup sin inversiones (retrocompatibilidad)');
    await cleanupAll();

    const modal = document.createElement('import-data-modal');
    document.body.appendChild(modal);

    // Backup viejo sin inversiones
    modal.importData = {
        deudas: [
            {
                acreedor: 'Tarjeta Visa',
                tipoDeuda: 'Tarjeta',
                notas: '',
                montos: [
                    { monto: 5000, moneda: 'ARS', vencimiento: '2026-03-10', periodo: '2026-03', pagado: false }
                ]
            }
        ],
        ingresos: [
            { descripcion: 'Sueldo Marzo', monto: 300000, moneda: 'ARS', fecha: '2026-03-01' }
        ]
        // Sin clave "inversiones" — retrocompatibilidad
    };

    await modal.importDataToDb();
    await new Promise(r => setTimeout(r, 100));

    // Deudas e ingresos deben existir
    const deudas = await listDeudas();
    assert(deudas.length === 1, 'Retro: 1 deuda importada');
    assert(deudas[0].acreedor === 'Tarjeta Visa', 'Retro: acreedor correcto');

    const ingresos = await getAllIngresos();
    assert(ingresos.length === 1, 'Retro: 1 ingreso importado');

    // No debe haber inversiones
    const inversiones = await listInversiones();
    assert(inversiones.length === 0, 'Retro: 0 inversiones (no habia en backup)');

    document.body.removeChild(modal);
    await cleanupAll();
}

// ===================================================================
// UC3: Exportar datos y verificar estructura del JSON
// Flujo: usuario tiene deudas, ingresos e inversiones en la DB.
// ExportDataModal los exporta. Verificamos que el JSON generado
// tiene la estructura correcta con las 3 entidades.
// ===================================================================
async function testExportarDatosCompletos() {
    console.log('  UC3: Exportar datos y verificar estructura del JSON');
    await cleanupAll();

    // Crear datos en la DB
    const deudaModel = new DeudaModel({
        acreedor: 'Banco Export',
        tipoDeuda: 'Hipotecario',
        notas: 'Test export',
        montos: [
            new MontoModel({ monto: 100000, moneda: 'ARS', vencimiento: '2026-06-01', pagado: false })
        ]
    });
    await addOrMergeDeuda(deudaModel);

    await addIngreso({ descripcion: 'Bonus', monto: 200000, moneda: 'ARS', fecha: '2026-06-01' });

    await addInversion({
        nombre: 'FCI Beta',
        fechaCompra: '2026-01-01',
        valorInicial: 75000,
        moneda: 'ARS',
        historialValores: [
            { fecha: '2026-01-01', valor: 75000 },
            { fecha: '2026-03-01', valor: 80000 }
        ]
    });

    // Verificar datos existen en DB
    const deudasInDb = await listDeudas();
    assert(deudasInDb.length === 1, 'Export setup: 1 deuda en DB');
    const ingresosInDb = await getAllIngresos();
    assert(ingresosInDb.length === 1, 'Export setup: 1 ingreso en DB');
    const inversionesInDb = await listInversiones();
    assert(inversionesInDb.length === 1, 'Export setup: 1 inversion en DB');

    // Crear ExportDataModal — no podemos testear el download de archivo
    // pero podemos verificar que los datos se obtienen correctamente
    // simulando lo que hace open() internamente
    const deudas = await listDeudas();
    const ingresos = await getAllIngresos();
    const inversiones = await listInversiones();

    // Simular el mapeo que hace ExportDataModal
    const mappedDeudas = deudas.map(d => ({
        acreedor: d.acreedor,
        tipoDeuda: d.tipoDeuda,
        notas: d.notas,
        montos: (d.montos || []).map(m => ({
            monto: m.monto,
            moneda: m.moneda,
            vencimiento: m.vencimiento,
            periodo: m.periodo || (m.vencimiento ? m.vencimiento.slice(0, 7) : ''),
            pagado: m.pagado,
        }))
    }));

    const mappedInversiones = inversiones.map(inv => ({
        nombre: inv.nombre,
        fechaCompra: inv.fechaCompra,
        valorInicial: inv.valorInicial,
        moneda: inv.moneda,
        historialValores: (inv.historialValores || []).map(h => ({
            fecha: h.fecha,
            valor: h.valor,
        }))
    }));

    // Construir el JSON como lo hace ExportDataModal
    const exportData = { deudas: mappedDeudas, ingresos, inversiones: mappedInversiones };
    const json = JSON.stringify(exportData, null, 2);
    const parsed = JSON.parse(json);

    // Verificar estructura del JSON exportado
    assert(Array.isArray(parsed.deudas), 'Export JSON tiene deudas[]');
    assert(parsed.deudas.length === 1, 'Export JSON: 1 deuda');
    assert(parsed.deudas[0].acreedor === 'Banco Export', 'Export JSON: acreedor correcto');
    assert(parsed.deudas[0].montos.length === 1, 'Export JSON: 1 monto');
    assert(parsed.deudas[0].montos[0].monto === 100000, 'Export JSON: monto = 100000');
    assert(parsed.deudas[0].montos[0].periodo === '2026-06', 'Export JSON: periodo derivado');
    assert(!('id' in parsed.deudas[0]), 'Export JSON: deuda no tiene id');

    assert(Array.isArray(parsed.ingresos), 'Export JSON tiene ingresos[]');
    assert(parsed.ingresos.length === 1, 'Export JSON: 1 ingreso');
    assert(parsed.ingresos[0].descripcion === 'Bonus', 'Export JSON: descripcion ingreso');

    assert(Array.isArray(parsed.inversiones), 'Export JSON tiene inversiones[]');
    assert(parsed.inversiones.length === 1, 'Export JSON: 1 inversion');
    assert(parsed.inversiones[0].nombre === 'FCI Beta', 'Export JSON: nombre inversion');
    assert(parsed.inversiones[0].valorInicial === 75000, 'Export JSON: valorInicial');
    assert(parsed.inversiones[0].historialValores.length === 2, 'Export JSON: 2 valores historial');
    assert(!('id' in parsed.inversiones[0]), 'Export JSON: inversion no tiene id');

    await cleanupAll();
}

// ===================================================================
// UC4: Round-trip completo — exportar, limpiar, importar, verificar
// Flujo: crear datos → exportar JSON → limpiar DB → importar JSON
// → verificar que los datos se restauraron correctamente
// ===================================================================
async function testRoundTripExportImport() {
    console.log('  UC4: Round-trip completo — exportar, limpiar, importar, verificar');
    await cleanupAll();

    // 1. Crear datos originales
    const deuda = new DeudaModel({
        acreedor: 'Round Trip Bank',
        tipoDeuda: 'Personal',
        notas: 'Test round trip',
        montos: [
            new MontoModel({ monto: 50000, moneda: 'ARS', vencimiento: '2026-07-01', pagado: false }),
            new MontoModel({ monto: 200, moneda: 'USD', vencimiento: '2026-08-01', pagado: true })
        ]
    });
    await addOrMergeDeuda(deuda);
    await addIngreso({ descripcion: 'Alquiler', monto: 150000, moneda: 'ARS', fecha: '2026-07-01' });
    await addInversion({
        nombre: 'ETF QQQ', fechaCompra: '2026-03-01', valorInicial: 30000,
        moneda: 'USD', historialValores: [{ fecha: '2026-03-01', valor: 30000 }, { fecha: '2026-06-01', valor: 35000 }]
    });

    // 2. Leer datos para "exportar" (simular lo que hace ExportDataModal)
    const origDeudas = await listDeudas();
    const origIngresos = await getAllIngresos();
    const origInversiones = await listInversiones();

    const exportJson = {
        deudas: origDeudas.map(d => ({
            acreedor: d.acreedor, tipoDeuda: d.tipoDeuda, notas: d.notas,
            montos: (d.montos || []).map(m => ({
                monto: m.monto, moneda: m.moneda, vencimiento: m.vencimiento,
                periodo: m.periodo || (m.vencimiento ? m.vencimiento.slice(0, 7) : ''), pagado: m.pagado
            }))
        })),
        ingresos: origIngresos,
        inversiones: origInversiones.map(inv => ({
            nombre: inv.nombre, fechaCompra: inv.fechaCompra,
            valorInicial: inv.valorInicial, moneda: inv.moneda,
            historialValores: (inv.historialValores || []).map(h => ({ fecha: h.fecha, valor: h.valor }))
        }))
    };

    // 3. Limpiar toda la DB
    await cleanupAll();
    assert((await listDeudas()).length === 0, 'RT: DB limpia — 0 deudas');
    assert((await getAllIngresos()).length === 0, 'RT: DB limpia — 0 ingresos');
    assert((await listInversiones()).length === 0, 'RT: DB limpia — 0 inversiones');

    // 4. Importar el JSON exportado
    const modal = document.createElement('import-data-modal');
    document.body.appendChild(modal);
    modal.importData = exportJson;
    await modal.importDataToDb();
    await new Promise(r => setTimeout(r, 100));

    // 5. Verificar que los datos se restauraron
    const restoredDeudas = await listDeudas();
    assert(restoredDeudas.length === 1, 'RT: 1 deuda restaurada');
    assert(restoredDeudas[0].acreedor === 'Round Trip Bank', 'RT: acreedor correcto');
    assert(restoredDeudas[0].montos.length === 2, 'RT: 2 montos restaurados');

    const restoredIngresos = await getAllIngresos();
    assert(restoredIngresos.length === 1, 'RT: 1 ingreso restaurado');
    assert(restoredIngresos[0].descripcion === 'Alquiler', 'RT: descripcion ingreso correcta');
    assert(restoredIngresos[0].monto === 150000, 'RT: monto ingreso = 150000');

    const restoredInversiones = await listInversiones();
    assert(restoredInversiones.length === 1, 'RT: 1 inversion restaurada');
    assert(restoredInversiones[0].nombre === 'ETF QQQ', 'RT: nombre inversion correcto');
    assert(restoredInversiones[0].moneda === 'USD', 'RT: moneda inversion USD');
    assert(restoredInversiones[0].valorInicial === 30000, 'RT: valorInicial = 30000');
    assert(restoredInversiones[0].historialValores.length === 2, 'RT: 2 valores en historial');
    assert(restoredInversiones[0].historialValores[1].valor === 35000, 'RT: ultimo valor = 35000');

    document.body.removeChild(modal);
    await cleanupAll();
}

// ===================================================================
// UC5: Importar con merge de deudas (no duplicar)
// Flujo: importar la misma deuda 2 veces — la segunda vez los montos
// deben mergearse sin duplicar la deuda.
// ===================================================================
async function testImportarConMergeDuplicados() {
    console.log('  UC5: Importar con merge de deudas (no duplicar)');
    await cleanupAll();

    const backupData = {
        deudas: [{
            acreedor: 'Banco Merge',
            tipoDeuda: 'Prestamo',
            notas: '',
            montos: [
                { monto: 10000, moneda: 'ARS', vencimiento: '2026-05-01', periodo: '2026-05', pagado: false }
            ]
        }],
        ingresos: [],
        inversiones: []
    };

    // Primera importación
    const modal1 = document.createElement('import-data-modal');
    document.body.appendChild(modal1);
    modal1.importData = backupData;
    await modal1.importDataToDb();
    await new Promise(r => setTimeout(r, 100));

    let deudas = await listDeudas();
    assert(deudas.length === 1, 'Merge 1ra import: 1 deuda');
    assert(deudas[0].montos.length === 1, 'Merge 1ra import: 1 monto');

    // Segunda importación (mismos datos)
    const modal2 = document.createElement('import-data-modal');
    document.body.appendChild(modal2);
    modal2.importData = backupData;
    await modal2.importDataToDb();
    await new Promise(r => setTimeout(r, 100));

    deudas = await listDeudas();
    assert(deudas.length === 1, 'Merge 2da import: sigue 1 deuda (no duplico)');
    // Los montos duplicados deben ser detectados (mismo monto + moneda + periodo)
    assert(deudas[0].montos.length === 1, 'Merge 2da import: sigue 1 monto (no duplico)');

    document.body.removeChild(modal1);
    document.body.removeChild(modal2);
    await cleanupAll();
}

export const tests = [
    testImportarDatosCompletos,
    testImportarSinInversiones,
    testExportarDatosCompletos,
    testRoundTripExportImport,
    testImportarConMergeDuplicados
];
