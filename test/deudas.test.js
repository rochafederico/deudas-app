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
    assert(tipoCol.opts && typeof tipoCol.opts.classCss === 'string',
        'Columna Tipo debe definir classCss');
    assert(tipoCol.opts.classCss.includes('d-none'),
        'Columna Tipo debe incluir clase d-none para ocultarse en mobile');
    assert(tipoCol.opts.classCss.includes('d-md-table-cell'),
        'Columna Tipo debe incluir clase d-md-table-cell para mostrarse desde md');

    // Badge no debe renderizarse cuando tipoDeuda está vacío
    const rowSinTipo = { acreedor: 'Banco Sin Tipo', tipoDeuda: '' };
    const nodeSinTipo = acreedorCol.render(rowSinTipo);
    const badgeSinTipo = nodeSinTipo.querySelector('span.badge');
    assert(badgeSinTipo === null, 'No debe renderizarse badge cuando tipoDeuda está vacío');

    // Columna monedaymonto debe mostrar badge de vencimiento en mobile
    const montoCol = debtTableColumns.find(col => col.key === 'monedaymonto');
    assert(montoCol !== undefined, 'Debe existir columna monedaymonto');
    assert(typeof montoCol.render === 'function', 'Columna monedaymonto debe tener render function');

    const rowConVenc = { monto: 1000, moneda: 'ARS', vencimiento: '2026-06-01' };
    const montoNode = montoCol.render(rowConVenc);
    assert(montoNode instanceof Node, 'monedaymonto render debe devolver un nodo DOM');
    const vencBadge = montoNode.querySelector('span.d-md-none');
    assert(vencBadge !== null, 'Debe existir elemento de vencimiento en columna Monto');
    assert(vencBadge.classList.contains('d-md-none'), 'Elemento de vencimiento debe ser solo visible en mobile (d-md-none)');
    assert(vencBadge.textContent === '2026-06-01', 'Elemento debe mostrar la fecha de vencimiento');

    // Badge de vencimiento no debe renderizarse cuando vencimiento está vacío
    const rowSinVenc = { monto: 500, moneda: 'ARS', vencimiento: '' };
    const montoNodeSinVenc = montoCol.render(rowSinVenc);
    const vencBadgeSinVenc = montoNodeSinVenc.querySelector('span.d-md-none');
    assert(vencBadgeSinVenc === null, 'No debe renderizarse elemento de vencimiento cuando está vacío');
}

// ===================================================================
// UC8: Alta inline — openInlineAdd() inserta fila inline al final
// Verifica que _inlineEditIdx = 'new' y hay una .inline-edit-row en el tbody.
// Al guardar con datos válidos, form.montos crece en 1 y la fila vuelve a lectura.
// ===================================================================
async function testAltaInlineAgregarYGuardar() {
    console.log('  UC8: Alta inline — agregar monto y guardar');
    await cleanup();

    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    assert(form._inlineEditIdx === null, 'Sin inline al iniciar');

    // Abrir inline add
    form.openInlineAdd();
    assert(form._inlineEditIdx === 'new', '_inlineEditIdx debe ser "new"');

    const tbody = form.querySelector('#montos-tbody');
    assert(tbody !== null, 'tbody existe');
    let inlineRow = tbody.querySelector('.inline-edit-row');
    assert(inlineRow !== null, 'Debe haber una fila inline');

    // Rellenar los inputs
    const montoInput = inlineRow.querySelector('input[name="monto"]');
    const monedaSelect = inlineRow.querySelector('select[name="moneda"]');
    const vencInput = inlineRow.querySelector('input[name="vencimiento"]');
    assert(montoInput !== null && monedaSelect !== null && vencInput !== null, 'Inputs del inline presentes');

    montoInput.value = '7500';
    monedaSelect.value = 'ARS';
    vencInput.value = '2026-07-15';

    // Guardar inline
    form._saveInline();
    assert(form._inlineEditIdx === null, 'Inline cerrado tras guardar');
    assert(form.montos.length === 1, 'montos debe tener 1 elemento tras guardar');
    assert(form.montos[0].monto === 7500, 'Monto guardado: 7500');
    assert(form.montos[0].moneda === 'ARS', 'Moneda guardada: ARS');
    assert(form.montos[0].vencimiento === '2026-07-15', 'Vencimiento guardado');
    assert(form.montos[0].pagado === false, 'pagado = false por defecto');

    // La fila inline ya no debe estar presente
    inlineRow = tbody.querySelector('.inline-edit-row');
    assert(inlineRow === null, 'Fila inline desaparecida tras guardar');

    document.body.removeChild(form);
    await cleanup();
}

// ===================================================================
// UC9: Cancel alta inline — no modifica form.montos ni deja fila basura
// ===================================================================
async function testCancelarAltaInline() {
    console.log('  UC9: Cancel alta inline — no modifica montos');
    await cleanup();

    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    // Pre-cargar un monto ya confirmado
    form.montos = [{ monto: 5000, moneda: 'ARS', vencimiento: '2026-06-01', pagado: false }];
    form.renderMontosList();

    form.openInlineAdd();
    assert(form._inlineEditIdx === 'new', 'Inline add abierto');

    form._cancelInline();
    assert(form._inlineEditIdx === null, 'Inline cerrado tras cancelar');
    assert(form.montos.length === 1, 'montos sigue con 1 elemento (sin cambios)');
    assert(form.montos[0].monto === 5000, 'El monto original no fue modificado');

    const inlineRow = form.querySelector('.inline-edit-row');
    assert(inlineRow === null, 'No hay fila inline tras cancelar');

    document.body.removeChild(form);
    await cleanup();
}

// ===================================================================
// UC10: Edición inline — openInlineEdit() precarga valores y guardar actualiza montos
// ===================================================================
async function testEdicionInlineGuardar() {
    console.log('  UC10: Edición inline — editar y guardar');
    await cleanup();

    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    form.montos = [
        { monto: 1000, moneda: 'ARS', vencimiento: '2026-05-10', pagado: false },
        { monto: 2000, moneda: 'USD', vencimiento: '2026-06-10', pagado: false }
    ];
    form.renderMontosList();

    // Editar el primer monto (idx=0 después de ordenar por vencimiento)
    form.openInlineEdit(form.montos[0], 0);
    assert(form._inlineEditIdx === 0, '_inlineEditIdx = 0');
    assert(form._inlineEditOrig !== null, '_inlineEditOrig cargado');
    assert(form._inlineEditOrig.monto === 1000, 'Original guardado: 1000');

    const tbody = form.querySelector('#montos-tbody');
    const inlineRow = tbody.querySelector('.inline-edit-row');
    assert(inlineRow !== null, 'Fila inline presente para edición');

    const montoInput = inlineRow.querySelector('input[name="monto"]');
    assert(montoInput.value === '1000', 'Input monto precargado con 1000');

    // Modificar el valor
    montoInput.value = '1500';
    const vencInput = inlineRow.querySelector('input[name="vencimiento"]');
    vencInput.value = '2026-05-10';
    const monedaSelect = inlineRow.querySelector('select[name="moneda"]');
    monedaSelect.value = 'ARS';

    form._saveInline();
    assert(form._inlineEditIdx === null, 'Inline cerrado tras guardar');
    assert(form.montos.length === 2, 'Sigue con 2 montos');

    // Verificar que el monto fue actualizado
    const montoActualizado = form.montos.find(m => m.vencimiento === '2026-05-10');
    assert(montoActualizado !== undefined, 'Monto de mayo sigue presente');
    assert(montoActualizado.monto === 1500, 'Monto actualizado a 1500');

    document.body.removeChild(form);
    await cleanup();
}

// ===================================================================
// UC11: Cancelar edición inline — revierte valores, montos sin cambios
// ===================================================================
async function testCancelarEdicionInline() {
    console.log('  UC11: Cancelar edición inline — revierte sin cambios');
    await cleanup();

    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    form.montos = [{ monto: 9000, moneda: 'ARS', vencimiento: '2026-08-01', pagado: false }];
    form.renderMontosList();

    form.openInlineEdit(form.montos[0], 0);

    // Modificar inputs pero cancelar sin guardar
    const tbody = form.querySelector('#montos-tbody');
    const inlineRow = tbody.querySelector('.inline-edit-row');
    inlineRow.querySelector('input[name="monto"]').value = '99999';

    form._cancelInline();

    assert(form._inlineEditIdx === null, 'Inline cerrado tras cancelar');
    assert(form.montos.length === 1, 'Sigue con 1 monto');
    assert(form.montos[0].monto === 9000, 'Monto original sin cambios: 9000');

    document.body.removeChild(form);
    await cleanup();
}

// ===================================================================
// UC12: Regla "solo 1 inline" — confirm(true) descarta el actual y abre nuevo
// ===================================================================
async function testSoloUnInlineAbierto() {
    console.log('  UC12: Regla solo 1 inline — confirm descarta y abre nuevo');
    await cleanup();

    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    form.montos = [
        { monto: 100, moneda: 'ARS', vencimiento: '2026-03-01', pagado: false },
        { monto: 200, moneda: 'ARS', vencimiento: '2026-04-01', pagado: false }
    ];
    form.renderMontosList();

    // Abrir inline en el primer monto
    form.openInlineEdit(form.montos[0], 0);
    assert(form._inlineEditIdx === 0, 'Primer inline abierto en idx 0');

    // Simular confirm = true (usuario acepta descartar cambios)
    const origConfirm = global.confirm;
    global.confirm = () => true;
    try {
        // Intentar abrir inline en el segundo monto
        form.openInlineEdit(form.montos[1], 1);
        assert(form._inlineEditIdx === 1, 'Con confirm=true, nuevo inline abierto en idx 1');
    } finally {
        global.confirm = origConfirm;
    }

    // Simular confirm = false (usuario rechaza descartar cambios)
    form._cancelInline(); // cerrar el inline actual primero
    form.openInlineEdit(form.montos[0], 0);
    assert(form._inlineEditIdx === 0, 'Inline abierto en idx 0');

    global.confirm = () => false;
    try {
        form.openInlineEdit(form.montos[1], 1);
        assert(form._inlineEditIdx === 0, 'Con confirm=false, inline original sigue en idx 0');
    } finally {
        global.confirm = origConfirm;
    }

    document.body.removeChild(form);
    await cleanup();
}

// ===================================================================
// UC13: Duplicar monto inline — copia datos, pagado=false, sin modal
// ===================================================================
async function testDuplicarMontoInline() {
    console.log('  UC13: Duplicar monto inline — pagado=false, sin abrir modal');
    await cleanup();

    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    form.montos = [{
        id: 42, monto: 5000, moneda: 'USD', vencimiento: '2026-09-01', pagado: true
    }];
    form.renderMontosList();

    // No debe haber montoModal ni duplicateMontoModal en el DOM
    assert(form.querySelector('#montoModal') === null, 'No hay #montoModal');
    assert(form.querySelector('#duplicateMontoModal') === null, 'No hay #duplicateMontoModal');

    form.duplicateMonto(form.montos[0]);

    assert(form.montos.length === 2, 'Debe haber 2 montos tras duplicar');
    const dupl = form.montos.find(m => m.id === undefined || m.id === null || !Object.prototype.hasOwnProperty.call(m, 'id'));
    assert(dupl !== undefined, 'El duplicado no tiene id');
    assert(dupl.monto === 5000, 'Monto copiado: 5000');
    assert(dupl.moneda === 'USD', 'Moneda copiada: USD');
    assert(dupl.vencimiento === '2026-09-01', 'Vencimiento copiado');
    assert(dupl.pagado === false, 'pagado forzado a false en el duplicado');

    document.body.removeChild(form);
    await cleanup();
}

// ===================================================================
// UC14: No se usan modales secundarios en el flujo Deuda → Montos
// Verifica que DebtForm NO tiene montoModal ni duplicateMontoModal.
// ===================================================================
async function testNoModalSecundarioEnDebtForm() {
    console.log('  UC14: DebtForm no abre modales para montos (sin modals apilados)');

    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    assert(form.querySelector('#montoModal') === null, 'No debe existir #montoModal en DebtForm');
    assert(form.querySelector('#duplicateMontoModal') === null, 'No debe existir #duplicateMontoModal en DebtForm');
    assert(typeof form.openInlineAdd === 'function', 'Debe existir método openInlineAdd');
    assert(typeof form.openInlineEdit === 'function', 'Debe existir método openInlineEdit');
    assert(typeof form.duplicateMonto === 'function', 'Debe existir método duplicateMonto');
    assert(typeof form.openMontoModal === 'undefined', 'openMontoModal ya no debe existir');
    assert(typeof form.openDuplicateMontoModal === 'undefined', 'openDuplicateMontoModal ya no debe existir');

    document.body.removeChild(form);
}

export const tests = [
    testCrearDeudaDesdeFormulario,
    testEditarDeudaDesdeFormulario,
    testImportarConMerge,
    testEliminarDeudas,
    testMultiplesDeudasMismoMes,
    testDebtDetailModal,
    testAcreedorColumnMobileRender,
    testAltaInlineAgregarYGuardar,
    testCancelarAltaInline,
    testEdicionInlineGuardar,
    testCancelarEdicionInline,
    testSoloUnInlineAbierto,
    testDuplicarMontoInline,
    testNoModalSecundarioEnDebtForm
];
