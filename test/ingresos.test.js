// test/ingresos.test.js
// E2E tests for ingresos feature: UI components (IngresoForm, IngresoModal)
// → IngresoModel/IngresoEntity → ingresoRepository → IndexedDB
import { assert } from './setup.js';
import {
    addIngreso, listIngresos, getAll, sumIngresosByMonth
} from '../src/features/ingresos/ingresoRepository.js';
import { IngresoModel } from '../src/features/ingresos/IngresoModel.js';

// Import ingresos UI components (registers custom elements)
import '../src/features/ingresos/components/IngresoForm.js';
import '../src/features/ingresos/components/IngresoModal.js';

// Helper: delete all ingresos (no deleteAll in repo, so we clear via DB directly)
import { getDB } from '../src/shared/database/initDB.js';
import { INGRESOS_STORE } from '../src/shared/database/schema.js';

async function cleanup() {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const tx = db.transaction(INGRESOS_STORE, 'readwrite');
        const store = tx.objectStore(INGRESOS_STORE);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
    });
}

// ===================================================================
// UC1: Agregar ingreso desde IngresoForm y verificar en DB
// Flujo: usuario abre IngresoForm, ingresa fecha/descripcion/monto/moneda,
// hace submit. El ingreso se guarda via repository y aparece en la DB.
// ===================================================================
async function testAgregarIngresoDesdeForm() {
    console.log('  UC1: Agregar ingreso desde IngresoForm y verificar en DB');
    await cleanup();

    // Crear IngresoForm y montarlo en el DOM
    const ingresoForm = document.createElement('ingreso-form');
    document.body.appendChild(ingresoForm);

    // Verificar que IngresoForm renderiza un app-form
    const appForm = ingresoForm.querySelector('app-form');
    assert(appForm !== null, 'IngresoForm debe contener un app-form');

    // Escuchar evento ingreso:saved que emite IngresoForm al guardar
    let savedEvent = null;
    ingresoForm.addEventListener('ingreso:saved', (e) => { savedEvent = e; });

    // Disparar form:submit en el app-form interno (como lo haria AppForm)
    appForm.dispatchEvent(new CustomEvent('form:submit', {
        detail: {
            fecha: '2026-03-15',
            descripcion: 'Sueldo marzo',
            monto: 500000,
            moneda: 'ARS'
        },
        bubbles: true,
        composed: true
    }));

    // IngresoForm._onSubmit llama addIngreso() que es async
    // Wait a tick for the promise to resolve
    await new Promise(r => setTimeout(r, 50));

    assert(savedEvent !== null, 'IngresoForm debe emitir ingreso:saved');
    assert(savedEvent.detail.ingreso.monto === 500000, 'Detalle del evento: monto = 500000');
    assert(savedEvent.detail.ingreso.moneda === 'ARS', 'Detalle del evento: moneda = ARS');
    assert(savedEvent.detail.ingreso.descripcion === 'Sueldo marzo', 'Detalle del evento: descripcion correcta');
    assert(savedEvent.detail.ingreso.periodo === '2026-03', 'Detalle del evento: periodo = 2026-03');

    // Verificar que el ingreso esta en la DB
    const ingresos = await listIngresos({ mes: '2026-03' });
    assert(ingresos.length === 1, 'Debe haber 1 ingreso en marzo');
    assert(ingresos[0].monto === 500000, 'Monto guardado: 500000');
    assert(ingresos[0].moneda === 'ARS', 'Moneda guardada: ARS');
    assert(ingresos[0].descripcion === 'Sueldo marzo', 'Descripcion guardada correcta');
    assert(ingresos[0].periodo === '2026-03', 'Periodo guardado: 2026-03');

    document.body.removeChild(ingresoForm);
    await cleanup();
}

// ===================================================================
// UC2: Cancelar IngresoForm y verificar que no se guarda nada
// Flujo: usuario abre IngresoForm y cancela. No se debe guardar
// ningun ingreso en la DB.
// ===================================================================
async function testCancelarIngresoForm() {
    console.log('  UC2: Cancelar IngresoForm');
    await cleanup();

    const ingresoForm = document.createElement('ingreso-form');
    document.body.appendChild(ingresoForm);

    let cancelEvent = false;
    ingresoForm.addEventListener('ingreso:cancel', () => { cancelEvent = true; });

    const appForm = ingresoForm.querySelector('app-form');
    appForm.dispatchEvent(new CustomEvent('form:cancel', { bubbles: true, composed: true }));

    assert(cancelEvent, 'IngresoForm debe emitir ingreso:cancel al cancelar');

    // Verificar que no se guardo nada
    const ingresos = await getAll();
    assert(ingresos.length === 0, 'No debe haber ingresos en la DB despues de cancelar');

    document.body.removeChild(ingresoForm);
    await cleanup();
}

async function testIngresoFormLayoutMobileFirst() {
    console.log('  UC2b: IngresoForm ordena Descripción, Monto+Moneda y Fecha para mobile');

    const ingresoForm = document.createElement('ingreso-form');
    document.body.appendChild(ingresoForm);

    const appForm = ingresoForm.querySelector('app-form');
    const formEl = appForm.querySelector('form');
    const descripcionField = appForm.querySelector('[data-field-name="descripcion"]');
    const fechaField = appForm.querySelector('[data-field-name="fecha"]');
    const montoRow = appForm.querySelector('.ingreso-monto-row');
    const montoField = appForm.querySelector('[data-field-name="monto"]');
    const monedaField = appForm.querySelector('[data-field-name="moneda"]');

    assert(formEl.children[0] === descripcionField, 'Descripción debe ser el primer campo visible');
    assert(montoRow !== null, 'Monto y Moneda deben renderizarse en una misma fila Bootstrap');
    assert(formEl.children[1] === montoRow, 'La fila Monto+Moneda debe ir después de Descripción');
    assert(formEl.children[2] === fechaField, 'Fecha debe ir después del grupo Monto+Moneda');
    assert(montoField.classList.contains('col-8'), 'Monto debe priorizar mayor ancho');
    assert(monedaField.classList.contains('col-4'), 'Moneda debe ocupar menor ancho');

    document.body.removeChild(ingresoForm);
}

async function testIngresoFormDescripcionEsObligatoria() {
    console.log('  UC2c: IngresoForm marca Descripción como obligatoria');

    const ingresoForm = document.createElement('ingreso-form');
    document.body.appendChild(ingresoForm);

    const descripcionInput = ingresoForm.querySelector('input[name="descripcion"]');
    const descripcionField = ingresoForm.querySelector('[data-field-name="descripcion"]');
    const requiredMark = descripcionField?.querySelector('.text-danger');

    assert(descripcionInput !== null, 'Debe existir el input de descripción');
    assert(descripcionInput.required === true, 'Descripción debe ser obligatoria en ingresos');
    assert(requiredMark !== null, 'Descripción debe mostrar indicador visual de requerido');

    document.body.removeChild(ingresoForm);
}

async function testIngresoFormUxValidacionConsistente() {
    console.log('  UC2d: IngresoForm mantiene submit habilitado y errores solo al enviar');

    const ingresoForm = document.createElement('ingreso-form');
    document.body.appendChild(ingresoForm);

    const appForm = ingresoForm.querySelector('app-form');
    const formEl = appForm.querySelector('form');
    const submitBtn = formEl.querySelector('button[type="submit"]');
    const descripcionInput = ingresoForm.querySelector('input[name="descripcion"]');
    const fechaInput = ingresoForm.querySelector('input[name="fecha"]');

    assert(submitBtn !== null, 'Debe existir botón submit visible en ingresos');
    assert(submitBtn.disabled === false, 'El botón submit de ingresos debe iniciar habilitado');
    assert(!formEl.classList.contains('was-validated'), 'No debe mostrar estado inválido antes del primer envío');
    assert(fechaInput.value === '', 'Fecha no debe iniciar con valor por defecto');

    appForm.triggerSubmit();

    assert(formEl.classList.contains('was-validated'), 'Debe mostrar validación recién al intentar enviar');
    assert(descripcionInput.validity.valueMissing === true, 'Descripción debe quedar inválida por required al enviar vacío');
    assert(fechaInput.validity.valueMissing === true, 'Fecha debe quedar inválida por required al enviar vacío');

    document.body.removeChild(ingresoForm);
}

// ===================================================================
// UC3: Multiples ingresos en el mismo mes y filtrado por periodo
// Flujo: usuario agrega 3 ingresos en distintos meses, luego filtra
// por mes y ve solo los correspondientes.
// ===================================================================
async function testMultiplesIngresosFiltradoPorMes() {
    console.log('  UC3: Multiples ingresos filtrados por mes');
    await cleanup();

    // Agregar ingresos via repository (como lo haria IngresoForm._onSubmit)
    const marzo1 = new IngresoModel({
        fecha: '2026-03-01', descripcion: 'Sueldo', monto: 400000, moneda: 'ARS'
    });
    const marzo2 = new IngresoModel({
        fecha: '2026-03-15', descripcion: 'Freelance', monto: 200, moneda: 'USD'
    });
    const abril1 = new IngresoModel({
        fecha: '2026-04-01', descripcion: 'Sueldo abril', monto: 420000, moneda: 'ARS'
    });

    await addIngreso(marzo1);
    await addIngreso(marzo2);
    await addIngreso(abril1);

    // Filtrar por marzo
    const ingresosMarzo = await listIngresos({ mes: '2026-03' });
    assert(ingresosMarzo.length === 2, 'Marzo: 2 ingresos');
    assert(ingresosMarzo.some(i => i.descripcion === 'Sueldo'), 'Marzo contiene Sueldo');
    assert(ingresosMarzo.some(i => i.descripcion === 'Freelance'), 'Marzo contiene Freelance');

    // Filtrar por abril
    const ingresosAbril = await listIngresos({ mes: '2026-04' });
    assert(ingresosAbril.length === 1, 'Abril: 1 ingreso');
    assert(ingresosAbril[0].descripcion === 'Sueldo abril', 'Abril: Sueldo abril');

    // Mes sin ingresos
    const ingresosMayo = await listIngresos({ mes: '2026-05' });
    assert(ingresosMayo.length === 0, 'Mayo: 0 ingresos');

    // getAll retorna todos
    const todos = await getAll();
    assert(todos.length === 3, 'getAll: 3 ingresos totales');

    await cleanup();
}

// ===================================================================
// UC4: Totales de ingresos por mes y moneda (sumIngresosByMonth)
// Flujo: usuario tiene ingresos en ARS y USD en el mismo mes.
// Verifica que sumIngresosByMonth separa correctamente por moneda.
// ===================================================================
async function testTotalesIngresosPorMoneda() {
    console.log('  UC4: Totales de ingresos por mes y moneda');
    await cleanup();

    // Agregar ingresos mixtos en septiembre
    await addIngreso(new IngresoModel({
        fecha: '2026-09-01', descripcion: 'Sueldo', monto: 500000, moneda: 'ARS'
    }));
    await addIngreso(new IngresoModel({
        fecha: '2026-09-10', descripcion: 'Bonus', monto: 100000, moneda: 'ARS'
    }));
    await addIngreso(new IngresoModel({
        fecha: '2026-09-15', descripcion: 'Freelance USD', monto: 500, moneda: 'USD'
    }));

    // Totales de septiembre
    const totales = await sumIngresosByMonth({ mes: '2026-09' });
    assert(totales.ARS === 600000, 'Septiembre ARS: 600000');
    assert(totales.USD === 500, 'Septiembre USD: 500');

    // Mes sin ingresos
    const totalesVacio = await sumIngresosByMonth({ mes: '2026-10' });
    assert(Object.keys(totalesVacio).length === 0, 'Octubre: sin totales');

    await cleanup();
}

// ===================================================================
// UC5: Flujo completo — agregar ingreso desde UI, verificar listado
// y totales, agregar mas y verificar acumulacion
// Flujo: usuario agrega un ingreso desde IngresoForm, verifica que
// aparece en el listado, agrega otro y verifica que los totales
// se acumulan correctamente.
// ===================================================================
async function testFlujoCompletoIngresosUI() {
    console.log('  UC5: Flujo completo — agregar ingresos desde UI y verificar acumulacion');
    await cleanup();

    const ingresoForm = document.createElement('ingreso-form');
    document.body.appendChild(ingresoForm);

    // Primer ingreso via UI
    const appForm = ingresoForm.querySelector('app-form');
    appForm.dispatchEvent(new CustomEvent('form:submit', {
        detail: {
            fecha: '2026-06-01',
            descripcion: 'Sueldo junio',
            monto: 450000,
            moneda: 'ARS'
        },
        bubbles: true, composed: true
    }));
    await new Promise(r => setTimeout(r, 50));

    // Verificar primer ingreso
    let ingresos = await listIngresos({ mes: '2026-06' });
    assert(ingresos.length === 1, 'Despues de 1er submit: 1 ingreso');
    assert(ingresos[0].monto === 450000, '1er ingreso: 450000');

    // Segundo ingreso via UI (diferente moneda)
    appForm.dispatchEvent(new CustomEvent('form:submit', {
        detail: {
            fecha: '2026-06-15',
            descripcion: 'Freelance',
            monto: 300,
            moneda: 'USD'
        },
        bubbles: true, composed: true
    }));
    await new Promise(r => setTimeout(r, 50));

    // Verificar ambos ingresos
    ingresos = await listIngresos({ mes: '2026-06' });
    assert(ingresos.length === 2, 'Despues de 2do submit: 2 ingresos');

    // Verificar totales
    const totales = await sumIngresosByMonth({ mes: '2026-06' });
    assert(totales.ARS === 450000, 'Total junio ARS: 450000');
    assert(totales.USD === 300, 'Total junio USD: 300');

    // Tercer ingreso en otro mes
    appForm.dispatchEvent(new CustomEvent('form:submit', {
        detail: {
            fecha: '2026-07-01',
            descripcion: 'Sueldo julio',
            monto: 460000,
            moneda: 'ARS'
        },
        bubbles: true, composed: true
    }));
    await new Promise(r => setTimeout(r, 50));

    // Verificar que junio no se ve afectado
    const ingresosJunio = await listIngresos({ mes: '2026-06' });
    assert(ingresosJunio.length === 2, 'Junio sigue con 2 ingresos');

    // Julio tiene el nuevo ingreso
    const ingresosJulio = await listIngresos({ mes: '2026-07' });
    assert(ingresosJulio.length === 1, 'Julio: 1 ingreso');
    assert(ingresosJulio[0].monto === 460000, 'Julio: 460000');

    // Total general
    const todos = await getAll();
    assert(todos.length === 3, 'Total: 3 ingresos');

    document.body.removeChild(ingresoForm);
    await cleanup();
}

// ===================================================================
// UC6: IngresoModel calcula periodo automaticamente desde fecha
// Flujo: verificar que el modelo calcula correctamente el periodo
// a partir de la fecha proporcionada.
// ===================================================================
async function testIngresoModelCalculaPeriodo() {
    console.log('  UC6: IngresoModel calcula periodo automaticamente');
    await cleanup();

    const modelo = new IngresoModel({
        fecha: '2026-11-25',
        descripcion: 'Test',
        monto: 1000,
        moneda: 'ARS'
    });
    assert(modelo.periodo === '2026-11', 'Periodo calculado: 2026-11');
    assert(modelo.monto === 1000, 'Monto numerico: 1000');
    assert(modelo.moneda === 'ARS', 'Moneda por defecto: ARS');

    // Sin fecha
    const sinFecha = new IngresoModel({ descripcion: 'Sin fecha', monto: 500 });
    assert(sinFecha.periodo === '', 'Sin fecha: periodo vacio');
    assert(sinFecha.moneda === 'ARS', 'Moneda default: ARS');

    // Guardar y verificar en DB
    const id = await addIngreso(modelo);
    assert(id > 0, 'addIngreso retorna ID valido');

    const guardados = await listIngresos({ mes: '2026-11' });
    assert(guardados.length === 1, 'Ingreso guardado en noviembre');
    assert(guardados[0].periodo === '2026-11', 'Periodo persistido: 2026-11');

    await cleanup();
}

export const tests = [
    testAgregarIngresoDesdeForm,
    testCancelarIngresoForm,
    testIngresoFormLayoutMobileFirst,
    testIngresoFormDescripcionEsObligatoria,
    testIngresoFormUxValidacionConsistente,
    testMultiplesIngresosFiltradoPorMes,
    testTotalesIngresosPorMoneda,
    testFlujoCompletoIngresosUI,
    testIngresoModelCalculaPeriodo
];
