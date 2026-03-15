// test/deudas.test.js
// E2E tests for deudas feature: UI component (DebtForm) → Model → Repository → IndexedDB
import { assert } from './setup.js';
import { deleteDeudas, listDeudas, getDeuda, addOrMergeDeuda } from '../src/features/deudas/deudaRepository.js';
import { listMontos, countMontosByMes, setPagado } from '../src/features/montos/montoRepository.js';

// Import deuda UI components (registers custom elements)
import '../src/features/montos/components/MontoForm.js';
import '../src/features/montos/components/DuplicateMontoModal.js';
import '../src/features/deudas/components/DebtForm.js';

async function cleanup() {
    try { await deleteDeudas(); } catch (e) { /* ignore */ }
}

// ===================================================================
// UC1: Crear deuda desde DebtForm con montos en distintos meses
// Flujo: usuario llena el formulario (acreedor, tipo, notas), agrega
// 3 montos en meses distintos (ARS y USD), y hace submit.
// Luego navega por mes y ve los montos correctos en cada uno.
// ===================================================================
async function testCrearDeudaDesdeFormulario() {
    console.log('  UC1: Crear deuda desde DebtForm con montos por mes');
    await cleanup();

    // Crear el componente DebtForm y montarlo en el DOM
    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    // Simular que el usuario agrega montos al formulario
    form.montos = [
        { monto: 15000, moneda: 'ARS', vencimiento: '2026-03-15', pagado: false },
        { monto: 25000, moneda: 'ARS', vencimiento: '2026-04-15', pagado: false },
        { monto: 100, moneda: 'USD', vencimiento: '2026-05-15', pagado: false }
    ];

    // Simular submit del formulario (como lo dispara AppForm → DebtForm.handleSubmit)
    let savedEvent = null;
    form.addEventListener('deuda:saved', (e) => { savedEvent = e; });
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Banco Galicia', tipoDeuda: 'Prestamo', notas: 'Prestamo personal' }
    });

    // Verificar que el evento de guardado se disparó
    assert(savedEvent !== null, 'El componente debe emitir deuda:saved');

    // Verificar datos en la base de datos
    const deudas = await listDeudas();
    assert(deudas.length === 1, 'Debe existir 1 deuda en la DB');
    assert(deudas[0].acreedor === 'Banco Galicia', 'Acreedor debe ser Banco Galicia');
    assert(deudas[0].montos.length === 3, 'Deuda debe tener 3 montos');

    // Simular navegación por mes: verificar distribución
    const montosMarzo = await listMontos({ mes: '2026-03' });
    assert(montosMarzo.length === 1, 'Marzo debe tener 1 monto');
    assert(montosMarzo[0].monto === 15000, 'Monto de marzo: 15000');
    assert(montosMarzo[0].moneda === 'ARS', 'Moneda de marzo: ARS');

    const montosAbril = await listMontos({ mes: '2026-04' });
    assert(montosAbril.length === 1, 'Abril debe tener 1 monto');
    assert(montosAbril[0].monto === 25000, 'Monto de abril: 25000');

    const montosMayo = await listMontos({ mes: '2026-05' });
    assert(montosMayo.length === 1, 'Mayo debe tener 1 monto');
    assert(montosMayo[0].moneda === 'USD', 'Moneda de mayo: USD');
    assert(montosMayo[0].monto === 100, 'Monto de mayo: 100');

    // Mes sin montos
    const montosJunio = await listMontos({ mes: '2026-06' });
    assert(montosJunio.length === 0, 'Junio no debe tener montos');

    // Limpiar DOM
    document.body.removeChild(form);
    await cleanup();
}

// ===================================================================
// UC2: Editar deuda desde DebtForm (cambiar datos + montos)
// Flujo: usuario abre una deuda existente en el formulario (load),
// cambia el acreedor, elimina un monto, agrega uno nuevo, y guarda.
// ===================================================================
async function testEditarDeudaDesdeFormulario() {
    console.log('  UC2: Editar deuda desde DebtForm');
    await cleanup();

    // Crear deuda inicial via formulario
    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    form.montos = [
        { monto: 5000, moneda: 'ARS', vencimiento: '2026-03-10', pagado: false },
        { monto: 8000, moneda: 'ARS', vencimiento: '2026-04-10', pagado: false }
    ];
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Visa', tipoDeuda: 'Tarjeta', notas: '' }
    });

    // Obtener la deuda creada
    const deudas = await listDeudas();
    const deuda = deudas[0];
    assert(deuda.montos.length === 2, 'Deuda original tiene 2 montos');

    // Simular edición: usuario abre la deuda con form.load()
    form.load(deuda);
    assert(form.editing === true, 'Formulario en modo edición');
    assert(form.deudaId === deuda.id, 'ID de deuda cargado');

    // Usuario modifica los montos: mantiene el primero, elimina el segundo, agrega nuevo
    const keepMontoId = deuda.montos[0].id;
    form.montos = [
        { id: keepMontoId, monto: 5000, moneda: 'ARS', vencimiento: '2026-03-10', pagado: false },
        { monto: 12000, moneda: 'ARS', vencimiento: '2026-05-10', pagado: false }
    ];

    // Submit en modo edición
    let updatedEvent = null;
    form.addEventListener('deuda:updated', (e) => { updatedEvent = e; });
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Visa Gold', tipoDeuda: 'Tarjeta', notas: 'Upgrade' }
    });

    assert(updatedEvent !== null, 'El componente debe emitir deuda:updated');

    // Verificar cambios en la DB
    const edited = await getDeuda(deuda.id);
    assert(edited.acreedor === 'Visa Gold', 'Acreedor actualizado a Visa Gold');
    assert(edited.notas === 'Upgrade', 'Notas actualizadas');
    assert(edited.montos.length === 2, 'Debe tener 2 montos (1 mantenido + 1 nuevo)');

    // El monto de abril fue eliminado
    const montosAbril = await listMontos({ mes: '2026-04' });
    assert(montosAbril.length === 0, 'Abril no debe tener montos');

    // El nuevo monto de mayo existe
    const montosMayo = await listMontos({ mes: '2026-05' });
    assert(montosMayo.length === 1, 'Mayo debe tener 1 monto nuevo');
    assert(montosMayo[0].monto === 12000, 'Monto de mayo: 12000');

    document.body.removeChild(form);
    await cleanup();
}

// ===================================================================
// UC3: Toggle pagado y verificar totales mensuales
// Flujo: usuario crea deuda con montos, marca uno como pagado,
// verifica que los totales del mes se actualizan, lo desmarca.
// ===================================================================
async function testTogglePagadoYTotales() {
    console.log('  UC3: Toggle pagado y verificar totales mensuales');
    await cleanup();

    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    form.montos = [
        { monto: 3000, moneda: 'ARS', vencimiento: '2026-03-01', pagado: false },
        { monto: 2000, moneda: 'ARS', vencimiento: '2026-03-15', pagado: false },
        { monto: 50, moneda: 'USD', vencimiento: '2026-03-20', pagado: false }
    ];
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Telefonica', tipoDeuda: 'Servicio', notas: '' }
    });

    // Estado inicial: todo pendiente
    const antes = await countMontosByMes({ mes: '2026-03' });
    assert(antes.totalesPendientes.ARS === 5000, 'Pendiente ARS inicial: 5000');
    assert(antes.totalesPendientes.USD === 50, 'Pendiente USD inicial: 50');
    assert(!antes.totalesPagados.ARS, 'Pagado ARS inicial: 0');

    // Marcar el primer monto como pagado (como haría el checkbox en la UI)
    const montos = await listMontos({ mes: '2026-03' });
    const primerMontoARS = montos.find(m => m.monto === 3000);
    await setPagado(primerMontoARS.id, true);

    // Verificar totales actualizados
    const despues = await countMontosByMes({ mes: '2026-03' });
    assert(despues.totalesPagados.ARS === 3000, 'Pagado ARS despues: 3000');
    assert(despues.totalesPendientes.ARS === 2000, 'Pendiente ARS despues: 2000');
    assert(despues.totalesPendientes.USD === 50, 'USD pendiente no cambio: 50');

    // Desmarcar
    await setPagado(primerMontoARS.id, false);
    const revertido = await countMontosByMes({ mes: '2026-03' });
    assert(revertido.totalesPendientes.ARS === 5000, 'Despues de desmarcar, pendiente ARS: 5000');
    assert(!revertido.totalesPagados.ARS, 'Despues de desmarcar, pagado ARS: 0');

    document.body.removeChild(form);
    await cleanup();
}

// ===================================================================
// UC4: Importar datos con merge (evitar duplicados)
// Flujo: usuario tiene una deuda existente, importa JSON que tiene
// la misma deuda con montos repetidos y nuevos. No debe duplicar.
// ===================================================================
async function testImportarConMerge() {
    console.log('  UC4: Importar datos con merge (sin duplicar montos)');
    await cleanup();

    // Deuda existente creada desde DebtForm
    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    form.montos = [
        { monto: 50000, moneda: 'ARS', vencimiento: '2026-03-01', pagado: true },
        { monto: 50000, moneda: 'ARS', vencimiento: '2026-04-01', pagado: false }
    ];
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Banco Nacion', tipoDeuda: 'Hipotecario', notas: '' }
    });

    // Simular importacion: addOrMergeDeuda (como hace ImportDataModal)
    await addOrMergeDeuda({
        acreedor: 'Banco Nacion',
        tipoDeuda: 'Hipotecario',
        notas: '',
        montos: [
            { monto: 50000, moneda: 'ARS', vencimiento: '2026-04-01', pagado: false }, // duplicado
            { monto: 50000, moneda: 'ARS', vencimiento: '2026-05-01', pagado: false }  // nuevo
        ]
    });

    const deudas = await listDeudas();
    assert(deudas.length === 1, 'Merge: debe seguir siendo 1 deuda');
    assert(deudas[0].montos.length === 3, 'Merge: 2 originales + 1 nuevo = 3 montos');

    // Importar deuda con acreedor diferente: debe crear nueva
    await addOrMergeDeuda({
        acreedor: 'Banco Provincia',
        tipoDeuda: 'Personal',
        notas: '',
        montos: [{ monto: 10000, moneda: 'ARS', vencimiento: '2026-06-01', pagado: false }]
    });
    const deudasFinal = await listDeudas();
    assert(deudasFinal.length === 2, 'Import nuevo acreedor: 2 deudas');

    document.body.removeChild(form);
    await cleanup();
}

// ===================================================================
// UC5: Eliminar deuda individual y eliminar todo
// Flujo: usuario tiene varias deudas, elimina una y sus montos
// desaparecen. Luego elimina todo.
// ===================================================================
async function testEliminarDeudas() {
    console.log('  UC5: Eliminar deuda individual y eliminar todo');
    await cleanup();

    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    // Crear deuda A
    form.montos = [{ monto: 1000, moneda: 'ARS', vencimiento: '2026-03-01' }];
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Deuda A', tipoDeuda: 'Servicio', notas: '' }
    });
    form.reset();

    // Crear deuda B
    form.montos = [
        { monto: 2000, moneda: 'ARS', vencimiento: '2026-03-01' },
        { monto: 3000, moneda: 'ARS', vencimiento: '2026-04-01' }
    ];
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Deuda B', tipoDeuda: 'Prestamo', notas: '' }
    });

    let deudas = await listDeudas();
    let montos = await listMontos();
    assert(deudas.length === 2, 'Inicio: 2 deudas');
    assert(montos.length === 3, 'Inicio: 3 montos totales');

    // Eliminar deuda A (importando deleteDeuda como haría el componente)
    const { deleteDeuda } = await import('../src/features/deudas/deudaRepository.js');
    const deudaA = deudas.find(d => d.acreedor === 'Deuda A');
    await deleteDeuda(deudaA.id);

    deudas = await listDeudas();
    montos = await listMontos();
    assert(deudas.length === 1, 'Despues de borrar A: 1 deuda');
    assert(deudas[0].acreedor === 'Deuda B', 'La deuda restante es B');
    assert(montos.length === 2, 'Despues de borrar A: 2 montos');

    // Eliminar todo
    await deleteDeudas();
    deudas = await listDeudas();
    montos = await listMontos();
    assert(deudas.length === 0, 'Despues de eliminar todo: 0 deudas');
    assert(montos.length === 0, 'Despues de eliminar todo: 0 montos');

    document.body.removeChild(form);
}

// ===================================================================
// UC6: Multiples deudas con montos en el mismo mes
// Flujo: usuario crea 2 deudas distintas con montos en el mismo mes.
// Al consultar el mes, ve todos los montos y totales correctos.
// ===================================================================
async function testMultiplesDeudasMismoMes() {
    console.log('  UC6: Multiples deudas con montos en el mismo mes');
    await cleanup();

    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    // Deuda 1
    form.montos = [{ monto: 8000, moneda: 'ARS', vencimiento: '2026-03-10', pagado: false }];
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Edenor', tipoDeuda: 'Servicio', notas: '' }
    });
    form.reset();

    // Deuda 2
    form.montos = [
        { monto: 5000, moneda: 'ARS', vencimiento: '2026-03-15', pagado: false },
        { monto: 20, moneda: 'USD', vencimiento: '2026-03-15', pagado: true }
    ];
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Personal', tipoDeuda: 'Servicio', notas: '' }
    });

    // Marzo tiene montos de ambas deudas
    const montosMarzo = await listMontos({ mes: '2026-03' });
    assert(montosMarzo.length === 3, 'Marzo: 3 montos (1 Edenor + 2 Personal)');

    // Totales de marzo
    const totales = await countMontosByMes({ mes: '2026-03' });
    assert(totales.totalesPendientes.ARS === 13000, 'Pendiente ARS marzo: 13000');
    assert(totales.totalesPagados.USD === 20, 'Pagado USD marzo: 20');

    // Cada deuda tiene sus propios montos
    const deudas = await listDeudas();
    assert(deudas.length === 2, '2 deudas');
    const edenor = deudas.find(d => d.acreedor === 'Edenor');
    const personal = deudas.find(d => d.acreedor === 'Personal');
    assert(edenor.montos.length === 1, 'Edenor: 1 monto');
    assert(personal.montos.length === 2, 'Personal: 2 montos');

    document.body.removeChild(form);
    await cleanup();
}

export const tests = [
    testCrearDeudaDesdeFormulario,
    testEditarDeudaDesdeFormulario,
    testTogglePagadoYTotales,
    testImportarConMerge,
    testEliminarDeudas,
    testMultiplesDeudasMismoMes
];
