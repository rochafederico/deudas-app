// test/inversiones.test.js
// E2E tests for inversiones feature: UI components (InversionModal, ValorInversionModal)
// → InversionEntity → inversionRepository → IndexedDB
import { assert } from './setup.js';
import {
    addInversion, listInversiones, getInversionById,
    addValorToInversion, deleteInversion
} from '../src/features/inversiones/inversionRepository.js';
import { InversionEntity } from '../src/features/inversiones/InversionEntity.js';

// Import inversiones UI components (registers custom elements)
import '../src/features/inversiones/components/InversionModal.js';
import '../src/features/inversiones/components/valorInversionModal.js';
import '../src/features/inversiones/components/InversionesList.js';

// Helper: delete all inversiones
import { getDB } from '../src/shared/database/initDB.js';
import { INVERSIONES_STORE } from '../src/shared/database/schema.js';

async function cleanup() {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const tx = db.transaction(INVERSIONES_STORE, 'readwrite');
        const store = tx.objectStore(INVERSIONES_STORE);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
    });
}

// ===================================================================
// UC1: Agregar inversion desde InversionModal y verificar en DB
// Flujo: usuario abre InversionModal, ingresa nombre/valor/moneda/fecha,
// hace submit. La inversion se guarda via repository con un valor
// inicial en el historial.
// ===================================================================
async function testAgregarInversionDesdeModal() {
    console.log('  UC1: Agregar inversion desde InversionModal y verificar en DB');
    await cleanup();

    // Crear InversionModal y montarlo en el DOM
    const modal = document.createElement('inversion-modal');
    document.body.appendChild(modal);

    // InversionModal renders on connectedCallback, creating an app-form
    const appForm = modal.querySelector('app-form');
    assert(appForm !== null, 'InversionModal debe contener un app-form');

    // Simular submit del formulario
    modal.onsave = () => {};

    appForm.dispatchEvent(new CustomEvent('form:submit', {
        detail: {
            nombre: 'Cedear AAPL',
            valorInicial: '15000',
            moneda: 'USD',
            fechaCompra: '2026-01-15'
        },
        bubbles: true,
        composed: true
    }));

    // Wait for async addInversion to complete
    await new Promise(r => setTimeout(r, 50));

    // Verificar en DB
    const inversiones = await listInversiones();
    assert(inversiones.length === 1, 'Debe haber 1 inversion en la DB');
    assert(inversiones[0].nombre === 'Cedear AAPL', 'Nombre: Cedear AAPL');
    assert(inversiones[0].valorInicial === 15000, 'Valor inicial: 15000');
    assert(inversiones[0].moneda === 'USD', 'Moneda: USD');
    assert(inversiones[0].fechaCompra === '2026-01-15', 'Fecha compra: 2026-01-15');
    assert(inversiones[0].historialValores.length === 1, 'Historial tiene 1 valor inicial');
    assert(inversiones[0].historialValores[0].valor === 15000, 'Historial valor: 15000');
    assert(inversiones[0].historialValores[0].fecha === '2026-01-15', 'Historial fecha: 2026-01-15');

    document.body.removeChild(modal);
    await cleanup();
}

async function testInversionModalNombreEsObligatorio() {
    console.log('  UC1b: InversionModal mantiene obligatorio el campo descriptivo');
    await cleanup();

    const modal = document.createElement('inversion-modal');
    document.body.appendChild(modal);

    const nombreInput = modal.querySelector('input[name="nombre"]');
    const nombreField = modal.querySelector('[data-field-name="nombre"]');
    const requiredMark = nombreField?.querySelector('.text-danger');

    assert(nombreInput !== null, 'Debe existir el input de nombre');
    assert(nombreInput.required === true, 'El campo descriptivo de inversiones debe seguir siendo obligatorio');
    assert(requiredMark !== null, 'El campo descriptivo debe mostrar indicador visual de requerido');

    document.body.removeChild(modal);
    await cleanup();
}

async function testInversionModalsUxValidacionConsistente() {
    console.log('  UC1c: Modales de inversiones mantienen submit habilitado y validan al enviar');
    await cleanup();

    const inversionModal = document.createElement('inversion-modal');
    document.body.appendChild(inversionModal);

    const inversionAppForm = inversionModal.querySelector('app-form');
    const inversionFormEl = inversionAppForm.querySelector('form');
    const inversionSubmitBtn = inversionFormEl.querySelector('button[type="submit"]');
    const nombreInput = inversionModal.querySelector('input[name="nombre"]');

    assert(inversionSubmitBtn !== null, 'Debe existir botón submit visible en alta de inversión');
    assert(inversionSubmitBtn.disabled === false, 'El botón submit de inversión debe iniciar habilitado');
    assert(!inversionFormEl.classList.contains('was-validated'), 'No debe mostrar errores antes del primer envío en inversión');

    inversionAppForm.triggerSubmit();

    assert(inversionFormEl.classList.contains('was-validated'), 'Debe mostrar errores sólo al intentar guardar la inversión');
    assert(nombreInput.validity.valueMissing === true, 'Nombre debe quedar inválido por required al enviar vacío');

    document.body.removeChild(inversionModal);

    const valorModal = document.createElement('valor-modal');
    document.body.appendChild(valorModal);
    valorModal.setIdInversion(1);

    const valorAppForm = valorModal.querySelector('app-form');
    const valorFormEl = valorAppForm.querySelector('form');
    const valorSubmitBtn = valorFormEl.querySelector('button[type="submit"]');
    const valorInput = valorModal.querySelector('input[name="valor"]');

    assert(valorSubmitBtn !== null, 'Debe existir botón submit visible en valor de inversión');
    assert(valorSubmitBtn.disabled === false, 'El botón submit de valor de inversión debe iniciar habilitado');
    assert(!valorFormEl.classList.contains('was-validated'), 'No debe mostrar errores antes del primer envío en valor de inversión');

    valorAppForm.triggerSubmit();

    assert(valorFormEl.classList.contains('was-validated'), 'Debe mostrar errores sólo al intentar guardar el valor');
    assert(valorInput.validity.valueMissing === true, 'Valor debe quedar inválido por required al enviar vacío');

    document.body.removeChild(valorModal);
    await cleanup();
}

// ===================================================================
// UC2: Agregar valor a inversion existente y verificar historial
// Flujo: usuario tiene una inversion, abre ValorInversionModal,
// agrega un nuevo valor con fecha. El historial se actualiza.
// ===================================================================
async function testAgregarValorAInversion() {
    console.log('  UC2: Agregar valor a inversion existente');
    await cleanup();

    // Crear inversion directamente via repository
    const id = await addInversion({
        nombre: 'FCI Alpha',
        valorInicial: 100000,
        moneda: 'ARS',
        fechaCompra: '2026-02-01',
        historialValores: [{ fecha: '2026-02-01', valor: 100000 }]
    });

    // Crear ValorInversionModal
    const modal = document.createElement('valor-modal');
    document.body.appendChild(modal);
    modal.setIdInversion(id);

    const appForm = modal.querySelector('app-form');
    assert(appForm !== null, 'ValorInversionModal debe contener un app-form');

    // Simular submit con nuevo valor
    appForm.dispatchEvent(new CustomEvent('form:submit', {
        detail: {
            valor: '110000',
            fecha: '2026-03-01'
        },
        bubbles: true,
        composed: true
    }));
    await new Promise(r => setTimeout(r, 50));

    // Verificar historial actualizado
    const inv = await getInversionById(id);
    assert(inv.historialValores.length === 2, 'Historial debe tener 2 valores');
    assert(inv.historialValores[0].valor === 100000, 'Primer valor: 100000');
    assert(inv.historialValores[1].valor === 110000, 'Segundo valor: 110000');
    assert(inv.historialValores[1].fecha === '2026-03-01', 'Segundo valor fecha: 2026-03-01');

    document.body.removeChild(modal);
    await cleanup();
}

// ===================================================================
// UC3: Listar inversiones y verificar datos
// Flujo: usuario crea multiples inversiones en distintas monedas,
// las lista y verifica que todas aparecen correctamente.
// ===================================================================
async function testListarInversiones() {
    console.log('  UC3: Listar multiples inversiones');
    await cleanup();

    await addInversion({
        nombre: 'Cedear GOOGL', valorInicial: 20000, moneda: 'USD',
        fechaCompra: '2026-01-10', historialValores: [{ fecha: '2026-01-10', valor: 20000 }]
    });
    await addInversion({
        nombre: 'Plazo Fijo', valorInicial: 500000, moneda: 'ARS',
        fechaCompra: '2026-02-01', historialValores: [{ fecha: '2026-02-01', valor: 500000 }]
    });
    await addInversion({
        nombre: 'ON YPF', valorInicial: 1000, moneda: 'USD',
        fechaCompra: '2026-03-01', historialValores: [{ fecha: '2026-03-01', valor: 1000 }]
    });

    const inversiones = await listInversiones();
    assert(inversiones.length === 3, '3 inversiones en la DB');

    const cedear = inversiones.find(i => i.nombre === 'Cedear GOOGL');
    assert(cedear !== undefined, 'Cedear GOOGL existe');
    assert(cedear.moneda === 'USD', 'Cedear moneda: USD');

    const plazoFijo = inversiones.find(i => i.nombre === 'Plazo Fijo');
    assert(plazoFijo !== undefined, 'Plazo Fijo existe');
    assert(plazoFijo.moneda === 'ARS', 'Plazo Fijo moneda: ARS');
    assert(plazoFijo.valorInicial === 500000, 'Plazo Fijo valor: 500000');

    await cleanup();
}

// ===================================================================
// UC4: Eliminar inversion y verificar que desaparece
// Flujo: usuario crea 2 inversiones, elimina una y verifica que
// solo queda la otra.
// ===================================================================
async function testEliminarInversion() {
    console.log('  UC4: Eliminar inversion');
    await cleanup();

    const id1 = await addInversion({
        nombre: 'Inversion A', valorInicial: 10000, moneda: 'ARS',
        fechaCompra: '2026-01-01', historialValores: [{ fecha: '2026-01-01', valor: 10000 }]
    });
    const id2 = await addInversion({
        nombre: 'Inversion B', valorInicial: 5000, moneda: 'USD',
        fechaCompra: '2026-02-01', historialValores: [{ fecha: '2026-02-01', valor: 5000 }]
    });

    let inversiones = await listInversiones();
    assert(inversiones.length === 2, 'Inicio: 2 inversiones');

    // Eliminar la primera
    await deleteInversion(id1);

    inversiones = await listInversiones();
    assert(inversiones.length === 1, 'Despues de borrar: 1 inversion');
    assert(inversiones[0].nombre === 'Inversion B', 'La restante es Inversion B');

    // Verificar que la eliminada no existe
    const eliminada = await getInversionById(id1);
    assert(!eliminada, 'Inversion A no existe en la DB');

    // Eliminar la segunda
    await deleteInversion(id2);
    inversiones = await listInversiones();
    assert(inversiones.length === 0, 'Despues de borrar todo: 0 inversiones');

    await cleanup();
}

// ===================================================================
// UC5: Flujo completo — crear inversion, agregar valores, verificar
// variacion y eliminar
// Flujo: usuario crea inversion con valor inicial, agrega 2 valores
// mas en meses sucesivos, verifica que el historial refleja la
// evolucion, y luego elimina.
// ===================================================================
async function testFlujoCompletoInversion() {
    console.log('  UC5: Flujo completo — crear, agregar valores, verificar historial, eliminar');
    await cleanup();

    // Crear inversion
    const id = await addInversion({
        nombre: 'ETF SPY', valorInicial: 50000, moneda: 'USD',
        fechaCompra: '2026-01-01',
        historialValores: [{ fecha: '2026-01-01', valor: 50000 }]
    });

    // Agregar valor mes 2 (sube)
    await addValorToInversion(id, { fecha: '2026-02-01', valor: 52000 });

    // Agregar valor mes 3 (baja)
    await addValorToInversion(id, { fecha: '2026-03-01', valor: 48000 });

    // Verificar historial completo
    const inv = await getInversionById(id);
    assert(inv.historialValores.length === 3, 'Historial: 3 valores');
    assert(inv.historialValores[0].valor === 50000, 'Valor inicial: 50000');
    assert(inv.historialValores[1].valor === 52000, 'Mes 2: 52000');
    assert(inv.historialValores[2].valor === 48000, 'Mes 3: 48000');

    // Ultimo valor es el actual
    const ultimoValor = inv.historialValores[inv.historialValores.length - 1].valor;
    assert(ultimoValor === 48000, 'Ultimo valor: 48000');

    // Variacion respecto al inicial
    const variacion = ultimoValor - inv.valorInicial;
    assert(variacion === -2000, 'Variacion: -2000 (perdida)');

    // Eliminar
    await deleteInversion(id);
    const eliminada = await getInversionById(id);
    assert(!eliminada, 'Inversion eliminada correctamente');

    await cleanup();
}

// ===================================================================
// UC6: InversionEntity preserva id cuando se proporciona
// Flujo: verificar que la entidad maneja correctamente el id
// (a diferencia de MontoEntity que no lo hace).
// ===================================================================
async function testInversionEntityConId() {
    console.log('  UC6: InversionEntity preserva id y datos');
    await cleanup();

    // Con id
    const conId = new InversionEntity({
        id: 42, nombre: 'Test', fechaCompra: '2026-01-01',
        valorInicial: 1000, moneda: 'ARS', historialValores: []
    });
    assert(conId.id === 42, 'Entity preserva id: 42');
    assert(conId.nombre === 'Test', 'Entity nombre: Test');
    assert(conId.moneda === 'ARS', 'Entity moneda: ARS');

    // Sin id (para creacion)
    const sinId = new InversionEntity({
        nombre: 'Nuevo', fechaCompra: '2026-02-01',
        valorInicial: 2000, moneda: 'USD', historialValores: [{ fecha: '2026-02-01', valor: 2000 }]
    });
    assert(sinId.id === undefined, 'Entity sin id: undefined');
    assert(sinId.historialValores.length === 1, 'Entity historial: 1 valor');

    // Guardar y recuperar
    const id = await addInversion(sinId);
    const recuperado = await getInversionById(id);
    assert(recuperado.nombre === 'Nuevo', 'Recuperado nombre: Nuevo');
    assert(recuperado.moneda === 'USD', 'Recuperado moneda: USD');
    assert(recuperado.historialValores.length === 1, 'Recuperado historial: 1 valor');

    await cleanup();
}

export const tests = [
    testAgregarInversionDesdeModal,
    testInversionModalNombreEsObligatorio,
    testInversionModalsUxValidacionConsistente,
    testAgregarValorAInversion,
    testListarInversiones,
    testEliminarInversion,
    testFlujoCompletoInversion,
    testInversionEntityConId
];
