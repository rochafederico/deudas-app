// test/inversiones.test.js
// E2E tests for inversiones feature: UI component (InversionModal) → Repository → IndexedDB
import { assert } from './setup.js';
import { listInversiones, getInversionById, addValorToInversion, deleteInversion } from '../src/repository/inversionRepository.js';

// Import inversion UI components (registers custom elements)
import '../src/modules/inversiones/components/InversionModal.js';

// ===================================================================
// UC1: Crear inversion desde InversionModal, seguir valores, eliminar
// Flujo: usuario abre el modal de nueva inversion, ingresa nombre,
// valor inicial, moneda y fecha. Luego agrega valores mensuales para
// seguir la evolucion. Finalmente elimina la inversion.
// ===================================================================
async function testGestionInversionesDesdeUI() {
    console.log('  UC1: Crear inversion, seguimiento de valores, eliminar');

    // Crear el componente InversionModal y montarlo
    const modal = document.createElement('inversion-modal');
    document.body.appendChild(modal);

    // InversionModal.render() crea un <ui-modal> con <app-form> adentro.
    // Simulamos el submit del formulario como lo hace el componente internamente.
    const appForm = modal.querySelector('app-form');

    // Simular submit del formulario de inversion
    modal.onsave = () => {};

    appForm.dispatchEvent(new CustomEvent('form:submit', {
        detail: {
            nombre: 'Plazo Fijo',
            valorInicial: '100000',
            moneda: 'ARS',
            fechaCompra: '2026-01-15'
        },
        bubbles: true,
        composed: true
    }));
    await new Promise(r => setTimeout(r, 50));

    // Verificar que la inversion se guardo en la DB
    let inversiones = await listInversiones();
    assert(inversiones.length === 1, 'Debe existir 1 inversion');
    assert(inversiones[0].nombre === 'Plazo Fijo', 'Nombre: Plazo Fijo');
    assert(inversiones[0].valorInicial === 100000, 'Valor inicial: 100000');
    assert(inversiones[0].moneda === 'ARS', 'Moneda: ARS');
    // InversionModal agrega el valor inicial al historial
    assert(inversiones[0].historialValores.length === 1, 'Historial tiene 1 valor inicial');

    const invId = inversiones[0].id;

    // Agregar valor mensual (como hace InversionesList.addValueToInversion)
    let inv = await addValorToInversion(invId, { fecha: '2026-02-15', valor: 105000 });
    assert(inv.historialValores.length === 2, 'Historial tiene 2 valores');
    assert(inv.historialValores[1].valor === 105000, 'Segundo valor: 105000');

    // Agregar otro valor
    inv = await addValorToInversion(invId, { fecha: '2026-03-15', valor: 110000 });
    assert(inv.historialValores.length === 3, 'Historial tiene 3 valores');

    // Verificar detalle completo
    const detalle = await getInversionById(invId);
    assert(detalle.valorInicial === 100000, 'valorInicial: 100000');
    const ultimoValor = detalle.historialValores[detalle.historialValores.length - 1].valor;
    assert(ultimoValor === 110000, 'Ultimo valor: 110000');

    // Crear segunda inversion en USD
    appForm.dispatchEvent(new CustomEvent('form:submit', {
        detail: {
            nombre: 'ETF S&P',
            valorInicial: '500',
            moneda: 'USD',
            fechaCompra: '2026-02-01'
        },
        bubbles: true,
        composed: true
    }));
    await new Promise(r => setTimeout(r, 50));

    inversiones = await listInversiones();
    assert(inversiones.length === 2, '2 inversiones en la DB');

    // Eliminar la primera (como hace el boton "Eliminar" en InversionesList)
    await deleteInversion(invId);
    inversiones = await listInversiones();
    assert(inversiones.length === 1, 'Despues de eliminar: 1 inversion');
    assert(inversiones[0].nombre === 'ETF S&P', 'La inversion restante es ETF S&P');

    // Eliminar la segunda
    await deleteInversion(inversiones[0].id);
    inversiones = await listInversiones();
    assert(inversiones.length === 0, 'Despues de eliminar todo: 0 inversiones');

    document.body.removeChild(modal);
}

export const tests = [
    testGestionInversionesDesdeUI
];
