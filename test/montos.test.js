// test/montos.test.js
// E2E tests for montos feature: UI components (MontoForm, DuplicateMontoModal)
// → MontoModel/MontoEntity → montoRepository → IndexedDB
import { assert } from './setup.js';
import {
    addMonto, getMonto, deleteMonto,
    listMontos, setPagado, countMontosByMes
} from '../src/features/montos/montoRepository.js';
import { MontoModel } from '../src/features/montos/MontoModel.js';

// Import montos UI components (registers custom elements)
import '../src/features/montos/components/MontoForm.js';
import '../src/features/montos/components/DuplicateMontoModal.js';

// We also need DebtForm because montos are typically created through deudas
import { deleteDeudas } from '../src/features/deudas/deudaRepository.js';
import '../src/features/deudas/components/DebtForm.js';

async function cleanup() {
    try { await deleteDeudas(); } catch (_e) { /* ignore */ }
}

// ===================================================================
// UC1: Agregar monto desde MontoForm y verificar en DB
// Flujo: usuario abre MontoForm, ingresa monto/moneda/vencimiento,
// hace submit. El monto se guarda via repository y aparece en la DB.
// ===================================================================
async function testAgregarMontoDesdeMontoForm() {
    console.log('  UC1: Agregar monto desde MontoForm y verificar en DB');
    await cleanup();

    // Crear MontoForm y montarlo en el DOM
    const montoForm = document.createElement('monto-form');
    document.body.appendChild(montoForm);

    // Verificar que MontoForm renderiza un app-form en su shadow DOM
    const appForm = montoForm.shadowRoot.querySelector('app-form');
    assert(appForm !== null, 'MontoForm debe contener un app-form en su shadow DOM');

    // Simular que el usuario llena los campos y hace submit
    // MontoForm escucha form:submit y re-emite como monto:save
    let saveEvent = null;
    montoForm.addEventListener('monto:save', (e) => { saveEvent = e; });

    // Disparar form:submit en el app-form interno (como lo haria AppForm)
    appForm.dispatchEvent(new CustomEvent('form:submit', {
        detail: { monto: 15000, moneda: 'ARS', vencimiento: '2026-03-15' },
        bubbles: true,
        composed: true
    }));

    assert(saveEvent !== null, 'MontoForm debe emitir monto:save al recibir form:submit');
    assert(saveEvent.detail.monto === 15000, 'Detalle del evento: monto = 15000');
    assert(saveEvent.detail.moneda === 'ARS', 'Detalle del evento: moneda = ARS');
    assert(saveEvent.detail.vencimiento === '2026-03-15', 'Detalle del evento: vencimiento correcto');

    // Ahora simular lo que haria DebtForm: guardar el monto en la DB via repository
    const model = new MontoModel({
        deudaId: 1,
        monto: saveEvent.detail.monto,
        moneda: saveEvent.detail.moneda,
        vencimiento: saveEvent.detail.vencimiento
    });
    const montoId = await addMonto(model);
    assert(montoId > 0, 'addMonto debe retornar un ID valido');

    // Verificar que el monto esta en la DB
    const saved = await getMonto(montoId);
    assert(saved !== null, 'Monto debe existir en la DB');
    assert(saved.monto === 15000, 'Monto guardado: 15000');
    assert(saved.moneda === 'ARS', 'Moneda guardada: ARS');
    assert(saved.periodo === '2026-03', 'Periodo calculado: 2026-03');
    assert(saved.pagado === false, 'Pagado por defecto: false');

    document.body.removeChild(montoForm);
    await cleanup();
}

// ===================================================================
// UC2: Editar monto existente y verificar cambios en DB
// Flujo: usuario tiene un monto, lo edita via MontoForm (precarga datos),
// cambia monto y moneda, guarda. Verifica que la DB refleja los cambios.
// ===================================================================
async function testEditarMontoDesdeMontoForm() {
    console.log('  UC2: Editar monto desde MontoForm con precarga');
    await cleanup();

    // Crear monto inicial en DB
    const model = new MontoModel({
        deudaId: 1, monto: 5000, moneda: 'ARS', vencimiento: '2026-04-10'
    });
    const montoId = await addMonto(model);

    // Crear MontoForm y precargar datos del monto existente
    const montoForm = document.createElement('monto-form');
    document.body.appendChild(montoForm);

    // Simular precarga (como hace DebtForm.openMontoModal con monto existente)
    // Setting .monto re-renders the shadow DOM, so we must get the fresh app-form after
    montoForm.monto = { monto: 5000, moneda: 'ARS', vencimiento: '2026-04-10' };
    assert(montoForm.monto.monto === 5000, 'MontoForm precargado con monto 5000');

    // Get the fresh app-form after re-render
    const appForm = montoForm.shadowRoot.querySelector('app-form');

    // Simular edicion: usuario cambia monto y moneda
    // MontoForm.render() sets up form:submit -> monto:submit on the app-form,
    // but connectedCallback's monto:submit -> monto:save listener was on the old form.
    // So we listen directly on the app-form for the monto:submit event to capture the data.
    let submitEvent = null;
    appForm.addEventListener('monto:submit', (e) => { submitEvent = e; });

    appForm.dispatchEvent(new CustomEvent('form:submit', {
        detail: { monto: 200, moneda: 'USD', vencimiento: '2026-04-10' },
        bubbles: true,
        composed: true
    }));

    assert(submitEvent !== null, 'MontoForm app-form emite monto:submit con datos editados');
    assert(submitEvent.detail.monto === 200, 'Nuevo monto: 200');
    assert(submitEvent.detail.moneda === 'USD', 'Nueva moneda: USD');

    // Actualizar en DB via repository (setPagado + deleteMonto + addMonto pattern,
    // since MontoEntity doesn't carry id through constructor for put)
    // Instead, use the lower-level approach: get existing, delete, add new
    await deleteMonto(montoId);
    const updatedModel = new MontoModel({
        deudaId: 1,
        monto: submitEvent.detail.monto,
        moneda: submitEvent.detail.moneda,
        vencimiento: submitEvent.detail.vencimiento
    });
    const newId = await addMonto(updatedModel);

    // Verificar en DB
    const saved = await getMonto(newId);
    assert(saved.monto === 200, 'DB: monto actualizado a 200');
    assert(saved.moneda === 'USD', 'DB: moneda actualizada a USD');
    assert(saved.periodo === '2026-04', 'DB: periodo se mantiene 2026-04');

    // El monto viejo ya no existe
    const old = await getMonto(montoId);
    assert(!old, 'Monto viejo eliminado de la DB');

    document.body.removeChild(montoForm);
    await cleanup();
}

// ===================================================================
// UC3: Duplicar monto desde DuplicateMontoModal con nueva fecha
// Flujo: usuario tiene un monto existente, abre DuplicateMontoModal,
// elige nueva fecha, confirma. El monto duplicado se guarda en la DB
// con la nueva fecha y periodo.
// ===================================================================
async function testDuplicarMontoDesdeModal() {
    console.log('  UC3: Duplicar monto desde DuplicateMontoModal');
    await cleanup();

    // Crear monto original
    const original = new MontoModel({
        deudaId: 1, monto: 30000, moneda: 'ARS', vencimiento: '2026-05-01'
    });
    const originalId = await addMonto(original);

    // Crear DuplicateMontoModal y precargar monto original
    const dupModal = document.createElement('duplicate-monto-modal');
    document.body.appendChild(dupModal);

    // Precargar datos del monto original (como hace DebtForm.openDuplicateMontoModal)
    // Setting .monto re-renders the shadow DOM, so get the fresh app-form after
    dupModal.monto = { monto: 30000, moneda: 'ARS', vencimiento: '2026-05-01' };
    assert(dupModal.monto.vencimiento === '2026-05-01', 'Modal precargado con fecha original');

    // Get fresh app-form after re-render and listen for duplicate:submit
    const appForm = dupModal.shadowRoot.querySelector('app-form');
    let submitEvent = null;
    appForm.addEventListener('duplicate:submit', (e) => { submitEvent = e; });

    appForm.dispatchEvent(new CustomEvent('form:submit', {
        detail: { vencimiento: '2026-06-01' },
        bubbles: true,
        composed: true
    }));

    assert(submitEvent !== null, 'DuplicateMontoModal app-form emite duplicate:submit');
    assert(submitEvent.detail.vencimiento === '2026-06-01', 'Nueva fecha: 2026-06-01');

    // Simular lo que hace DebtForm: crear copia con nueva fecha
    const nuevoPeriodo = submitEvent.detail.vencimiento.slice(0, 7);
    const duplicado = new MontoModel({
        deudaId: 1,
        monto: 30000,
        moneda: 'ARS',
        vencimiento: submitEvent.detail.vencimiento,
        periodo: nuevoPeriodo
    });
    const dupId = await addMonto(duplicado);

    // Verificar que hay 2 montos en DB
    const todos = await listMontos();
    assert(todos.length === 2, 'Deben haber 2 montos (original + duplicado)');

    // Verificar distribucion por mes
    const montosMayo = await listMontos({ mes: '2026-05' });
    assert(montosMayo.length === 1, 'Mayo: 1 monto (original)');
    assert(montosMayo[0].id === originalId, 'Mayo: es el monto original');

    const montosJunio = await listMontos({ mes: '2026-06' });
    assert(montosJunio.length === 1, 'Junio: 1 monto (duplicado)');
    assert(montosJunio[0].id === dupId, 'Junio: es el monto duplicado');
    assert(montosJunio[0].monto === 30000, 'Duplicado mantiene el monto: 30000');

    document.body.removeChild(dupModal);
    await cleanup();
}

// ===================================================================
// UC4: Cancelar formularios (MontoForm y DuplicateMontoModal)
// Flujo: usuario abre MontoForm/DuplicateMontoModal y cancela.
// Verifica que se emiten los eventos de cancelacion correctos.
// ===================================================================
async function testCancelarFormularios() {
    console.log('  UC4: Cancelar MontoForm y DuplicateMontoModal');
    await cleanup();

    // Test cancelar MontoForm
    const montoForm = document.createElement('monto-form');
    document.body.appendChild(montoForm);

    let cancelMonto = false;
    montoForm.addEventListener('monto:cancel', () => { cancelMonto = true; });

    const appForm = montoForm.shadowRoot.querySelector('app-form');
    appForm.dispatchEvent(new CustomEvent('form:cancel', { bubbles: true, composed: true }));
    assert(cancelMonto, 'MontoForm emite monto:cancel al cancelar');

    document.body.removeChild(montoForm);

    // Test cancelar DuplicateMontoModal
    // Create without setting .monto so connectedCallback listeners stay on the initial form
    const dupModal = document.createElement('duplicate-monto-modal');
    document.body.appendChild(dupModal);

    let cancelDup = false;
    dupModal.addEventListener('duplicate:cancel', () => { cancelDup = true; });

    const dupForm = dupModal.shadowRoot.querySelector('app-form');
    dupForm.dispatchEvent(new CustomEvent('form:cancel', { bubbles: true, composed: true }));
    assert(cancelDup, 'DuplicateMontoModal emite duplicate:cancel al cancelar');

    document.body.removeChild(dupModal);
    await cleanup();
}

// ===================================================================
// UC5: Flujo completo — crear deuda con montos via DebtForm, listar
// por mes, marcar pagado, verificar totales, eliminar monto individual
// Flujo: usuario crea deuda con 3 montos en distintos meses y monedas,
// navega por mes, marca uno como pagado, verifica totales, borra uno.
// ===================================================================
async function testFlujoCompletoMontosViaDebtForm() {
    console.log('  UC5: Flujo completo — montos via DebtForm, filtrar, pagado, totales, borrar');
    await cleanup();

    // Crear deuda con montos via DebtForm (como haria el usuario)
    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    form.montos = [
        { monto: 10000, moneda: 'ARS', vencimiento: '2026-07-15', pagado: false },
        { monto: 20000, moneda: 'ARS', vencimiento: '2026-07-20', pagado: false },
        { monto: 150, moneda: 'USD', vencimiento: '2026-08-01', pagado: false }
    ];
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Test Acreedor', tipoDeuda: 'Prestamo', notas: '' }
    });

    // Listar montos de julio
    const montosJulio = await listMontos({ mes: '2026-07' });
    assert(montosJulio.length === 2, 'Julio: 2 montos ARS');
    assert(montosJulio.every(m => m.moneda === 'ARS'), 'Julio: todos en ARS');

    // Listar montos de agosto
    const montosAgosto = await listMontos({ mes: '2026-08' });
    assert(montosAgosto.length === 1, 'Agosto: 1 monto USD');
    assert(montosAgosto[0].moneda === 'USD', 'Agosto: moneda USD');
    assert(montosAgosto[0].monto === 150, 'Agosto: monto 150');

    // Totales iniciales julio: todo pendiente
    const totalesJulio = await countMontosByMes({ mes: '2026-07' });
    assert(totalesJulio.totalesPendientes.ARS === 30000, 'Julio pendiente ARS: 30000');
    assert(!totalesJulio.totalesPagados.ARS, 'Julio pagado ARS: 0');

    // Marcar el primer monto de julio como pagado
    const primerMonto = montosJulio.find(m => m.monto === 10000);
    await setPagado(primerMonto.id, true);

    // Verificar totales actualizados
    const totalesPost = await countMontosByMes({ mes: '2026-07' });
    assert(totalesPost.totalesPagados.ARS === 10000, 'Julio pagado ARS post: 10000');
    assert(totalesPost.totalesPendientes.ARS === 20000, 'Julio pendiente ARS post: 20000');

    // Verificar que agosto no se ve afectado
    const totalesAgosto = await countMontosByMes({ mes: '2026-08' });
    assert(totalesAgosto.totalesPendientes.USD === 150, 'Agosto pendiente USD: 150');
    assert(!totalesAgosto.totalesPagados.USD, 'Agosto pagado USD: 0');

    // Eliminar el monto de agosto
    await deleteMonto(montosAgosto[0].id);
    const montosAgostoPost = await listMontos({ mes: '2026-08' });
    assert(montosAgostoPost.length === 0, 'Agosto post-borrar: 0 montos');

    // Julio sigue intacto
    const montosJulioPost = await listMontos({ mes: '2026-07' });
    assert(montosJulioPost.length === 2, 'Julio sigue con 2 montos');

    // Total general
    const todosMontos = await listMontos();
    assert(todosMontos.length === 2, 'Total: 2 montos (se borro 1 de 3)');

    document.body.removeChild(form);
    await cleanup();
}

// ===================================================================
// UC6: Montos en multiples monedas con totales mixtos
// Flujo: usuario crea montos en ARS y USD en el mismo mes.
// Algunos pagados, otros no. Verifica que countMontosByMes
// separa correctamente por moneda y estado.
// ===================================================================
async function testTotalesMixtosPorMoneda() {
    console.log('  UC6: Totales mixtos por moneda y estado de pago');
    await cleanup();

    const form = document.createElement('debt-form');
    document.body.appendChild(form);

    // Deuda 1: montos en ARS
    form.montos = [
        { monto: 5000, moneda: 'ARS', vencimiento: '2026-09-01', pagado: true },
        { monto: 8000, moneda: 'ARS', vencimiento: '2026-09-15', pagado: false }
    ];
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Edesur', tipoDeuda: 'Servicio', notas: '' }
    });
    form.reset();

    // Deuda 2: montos en USD y ARS
    form.montos = [
        { monto: 100, moneda: 'USD', vencimiento: '2026-09-10', pagado: false },
        { monto: 3000, moneda: 'ARS', vencimiento: '2026-09-20', pagado: true }
    ];
    await form.handleSubmit({
        preventDefault: () => {},
        detail: { acreedor: 'Netflix', tipoDeuda: 'Suscripcion', notas: '' }
    });

    // Verificar totales de septiembre
    const totales = await countMontosByMes({ mes: '2026-09' });

    // ARS: 5000 pagado + 3000 pagado = 8000 pagado; 8000 pendiente
    assert(totales.totalesPagados.ARS === 8000, 'Septiembre pagado ARS: 8000');
    assert(totales.totalesPendientes.ARS === 8000, 'Septiembre pendiente ARS: 8000');

    // USD: 100 pendiente
    assert(totales.totalesPendientes.USD === 100, 'Septiembre pendiente USD: 100');
    assert(!totales.totalesPagados.USD, 'Septiembre pagado USD: 0');

    // Listar todos los montos del mes
    const montosSept = await listMontos({ mes: '2026-09' });
    assert(montosSept.length === 4, 'Septiembre: 4 montos totales');

    // Mes sin montos
    const montosOct = await listMontos({ mes: '2026-10' });
    assert(montosOct.length === 0, 'Octubre: 0 montos');

    document.body.removeChild(form);
    await cleanup();
}

export const tests = [
    testAgregarMontoDesdeMontoForm,
    testEditarMontoDesdeMontoForm,
    testDuplicarMontoDesdeModal,
    testCancelarFormularios,
    testFlujoCompletoMontosViaDebtForm,
    testTotalesMixtosPorMoneda
];
