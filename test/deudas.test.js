// test/deudas.test.js
// E2E tests for deudas feature: UI component (DebtForm) → Model → Repository → IndexedDB
import { assert } from './setup.js';
import { deleteDeudas, listDeudas, getDeuda, addOrMergeDeuda } from '../src/features/deudas/deudaRepository.js';
import { listMontos } from '../src/features/montos/montoRepository.js';
import { debtTableColumns } from '../src/shared/config/tables/debtTableColumns.js';

// Import DebtDetailModal component
import '../src/features/deudas/components/DebtDetailModal.js';
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

    // Verificar que los montos tienen los datos correctos
    const montos = deudas[0].montos;
    assert(montos.some(m => m.monto === 15000 && m.moneda === 'ARS'), 'Monto ARS 15000 presente');
    assert(montos.some(m => m.monto === 25000 && m.moneda === 'ARS'), 'Monto ARS 25000 presente');
    assert(montos.some(m => m.monto === 100 && m.moneda === 'USD'), 'Monto USD 100 presente');

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

    // Verificar que los montos reflejan la edicion
    const montosEditados = edited.montos;
    assert(montosEditados.some(m => m.monto === 5000), 'Monto mantenido: 5000');
    assert(montosEditados.some(m => m.monto === 12000), 'Nuevo monto: 12000');

    document.body.removeChild(form);
    await cleanup();
}

// ===================================================================
// UC3: Importar datos con merge (evitar duplicados)
// Flujo: usuario tiene una deuda existente, importa JSON que tiene
// la misma deuda con montos repetidos y nuevos. No debe duplicar.
// ===================================================================
async function testImportarConMerge() {
    console.log('  UC3: Importar datos con merge (sin duplicar montos)');
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
// UC4: Eliminar deuda individual y eliminar todo
// Flujo: usuario tiene varias deudas, elimina una y sus montos
// desaparecen. Luego elimina todo.
// ===================================================================
async function testEliminarDeudas() {
    console.log('  UC4: Eliminar deuda individual y eliminar todo');
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
// UC5: Multiples deudas con montos en el mismo mes
// Flujo: usuario crea 2 deudas distintas con montos en el mismo mes.
// Al consultar el mes, ve todos los montos y totales correctos.
// ===================================================================
async function testMultiplesDeudasMismoMes() {
    console.log('  UC5: Multiples deudas con montos en el mismo mes');
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

// ===================================================================
// UC6: DebtDetailModal muestra el detalle de una deuda con sus montos
// Flujo: se crea una deuda con montos, se abre el modal de detalle,
// y se verifica que renderiza la info correcta.
// ===================================================================
async function testDebtDetailModal() {
    console.log('  UC6: DebtDetailModal renderiza detalle de deuda');
    await cleanup();

    // Crear una deuda con dos montos
    const form = document.createElement('debt-form');
    document.body.appendChild(form);
    form.montos = [
        { monto: 12000, moneda: 'ARS', vencimiento: '2026-05-10', pagado: false },
        { monto: 50, moneda: 'USD', vencimiento: '2026-06-15', pagado: false }
    ];
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Banco Nación', tipoDeuda: 'Hipoteca', notas: 'Cuota mensual' }
    });
    document.body.removeChild(form);

    // Obtener la deuda creada
    const deudas = await listDeudas();
    assert(deudas.length === 1, 'UC6: debe existir 1 deuda');
    const deuda = deudas[0];
    assert(deuda.montos.length === 2, 'UC6: la deuda tiene 2 montos');

    // Montar el componente DebtDetailModal
    const modal = document.createElement('debt-detail-modal');
    document.body.appendChild(modal);

    let detachedModalEl = null;
    try {
        // Abrir el detalle de la deuda
        await modal.openDetail(deuda);

        // UiModal mueve su .modal a document.body al abrirse,
        // por lo que buscamos el contenido directamente en document.body.
        detachedModalEl = document.body.querySelector('.modal');

        // Verificar que se renderizó el total pendiente
        const totalEl = document.body.querySelector('.fs-2');
        assert(totalEl !== null, 'UC6: debe mostrar el total pendiente prominente');

        // Verificar que la tabla de montos tiene las filas correctas
        const tbody = document.body.querySelector('#detail-montos-tbody');
        assert(tbody !== null, 'UC6: debe existir tbody de montos');
        assert(tbody && tbody.children.length === 2, 'UC6: debe mostrar 2 filas de montos');

        // Verificar que la tabla de montos NO tiene botones de acción (vista de solo lectura)
        const actionBtns = document.body.querySelectorAll('#detail-montos-tbody app-button');
        assert(actionBtns && actionBtns.length === 0, 'UC6: la vista detalle no debe mostrar botones de acción');
    } finally {
        if (detachedModalEl && detachedModalEl.parentNode) {
            detachedModalEl.parentNode.removeChild(detachedModalEl);
        }
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
        await cleanup();
    }
}

// ===================================================================
// UC7: debtTableColumns acreedor render agrupa Acreedor y Tipo en mobile
// Verifica que la columna Acreedor renderiza el nombre con fw-semibold
// y un badge con el tipo de deuda visible solo en mobile (d-md-none).
// ===================================================================
async function testAcreedorColumnMobileRender() {
    console.log('  UC7: acreedor column renderiza badge de tipo para mobile');

    const acreedorCol = debtTableColumns.find(col => col.key === 'acreedor');
    assert(acreedorCol !== undefined, 'Debe existir columna acreedor');
    assert(typeof acreedorCol.render === 'function', 'Columna acreedor debe tener render function');

    const row = { acreedor: 'Banco Galicia', tipoDeuda: 'Préstamo' };
    const node = acreedorCol.render(row);
    assert(node instanceof Node, 'render debe devolver un nodo DOM');

    const acreedorSpan = node.querySelector('span.fw-semibold');
    assert(acreedorSpan !== null, 'Debe existir span con clase fw-semibold para el acreedor');
    assert(acreedorSpan.textContent === 'Banco Galicia', 'El span debe mostrar el nombre del acreedor');

    const badge = node.querySelector('span.badge');
    assert(badge !== null, 'Debe existir un badge para el tipo de deuda');
    assert(badge.classList.contains('rounded-pill'), 'Badge debe tener clase rounded-pill');
    assert(badge.classList.contains('text-bg-light'), 'Badge debe tener clase text-bg-light');
    assert(badge.classList.contains('d-md-none'), 'Badge debe tener clase d-md-none (solo visible en mobile)');
    assert(badge.textContent === 'Préstamo', 'Badge debe mostrar el tipo de deuda');

    const tipoCol = debtTableColumns.find(col => col.key === 'tipoDeuda');
    assert(tipoCol !== undefined, 'Debe existir columna tipoDeuda');
    assert(tipoCol.opts && tipoCol.opts.classCss === 'd-none d-md-table-cell',
        'Columna Tipo debe tener clase d-none d-md-table-cell para ocultarse en mobile');
}

export const tests = [
    testCrearDeudaDesdeFormulario,
    testEditarDeudaDesdeFormulario,
    testImportarConMerge,
    testEliminarDeudas,
    testMultiplesDeudasMismoMes,
    testDebtDetailModal,
    testAcreedorColumnMobileRender
];
