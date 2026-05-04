// test/cloud-backup.test.js
// Tests for HU 5.6: Exportar backup cifrado a nube (manual)
// Covers: backupCryptoService, cloudBackupStorage, CloudBackupModal, SettingsDataModal

import { assert } from './setup.js';
import {
    getLastCloudBackupTimestamp,
    setLastCloudBackupTimestamp,
    formatBackupTimestamp,
} from '../src/features/import-export/cloudBackupStorage.js';
import { getBackupSchemaVersion } from '../src/features/import-export/backupCryptoService.js';
import '../src/features/import-export/components/CloudBackupModal.js';
import { openSettingsModal } from '../src/layout/dataActions.js';

// ---------------------------------------------------------------------------
// Helper: localStorage stub (happy-dom provides a functional localStorage)
// ---------------------------------------------------------------------------
function clearBackupStorage() {
    try { localStorage.removeItem('nivva:cloudBackup:lastSuccess'); } catch { /* ignore */ }
}

// ===================================================================
// UC1: backupCryptoService exports expected API and schema version
// ===================================================================
async function test_cryptoService_exports() {
    console.log('  CloudBackup: backupCryptoService exporta las funciones requeridas');
    const mod = await import('../src/features/import-export/backupCryptoService.js');
    assert(typeof mod.encryptBackup === 'function', 'encryptBackup debe ser una función');
    assert(typeof mod.decryptBackup === 'function', 'decryptBackup debe ser una función');
    assert(typeof mod.getBackupSchemaVersion === 'function', 'getBackupSchemaVersion debe ser una función');
    assert(getBackupSchemaVersion() === 1, 'Schema version debe ser 1');
}

// ===================================================================
// UC2: encryptBackup + decryptBackup — round-trip completo
// ===================================================================
async function test_cryptoService_roundTrip() {
    console.log('  CloudBackup: cifrado y descifrado produce el texto original');

    // happy-dom/Node.js v20+ expone crypto.subtle globalmente
    const cryptoAvailable = typeof globalThis.crypto?.subtle?.encrypt === 'function';
    if (!cryptoAvailable) {
        console.log('    (skip: WebCrypto no disponible en este entorno de test)');
        return;
    }

    const { encryptBackup, decryptBackup } = await import('../src/features/import-export/backupCryptoService.js');
    const plaintext = JSON.stringify({ deudas: [], ingresos: [], inversiones: [] });
    const password  = 'TestPass123!';

    const encrypted = await encryptBackup(plaintext, password);

    // Verificar estructura del sobre cifrado
    const envelope = JSON.parse(encrypted);
    assert(envelope.v === 1, 'El sobre debe incluir versión 1');
    assert(typeof envelope.salt === 'string' && envelope.salt.length === 32, 'salt debe ser 16 bytes en hex (32 chars)');
    assert(typeof envelope.iv === 'string' && envelope.iv.length === 24, 'IV debe ser 12 bytes en hex (24 chars)');
    assert(typeof envelope.data === 'string' && envelope.data.length > 0, 'data no debe estar vacía');

    // El ciphertext no debe contener el texto plano
    assert(!encrypted.includes('"deudas"'), 'El texto cifrado no debe contener datos legibles');

    // Descifrar y verificar
    const decrypted = await decryptBackup(encrypted, password);
    assert(decrypted === plaintext, 'El texto descifrado debe ser igual al original');
}

// ===================================================================
// UC3: decryptBackup con clave incorrecta lanza error claro
// ===================================================================
async function test_cryptoService_wrongPassword() {
    console.log('  CloudBackup: clave incorrecta genera error descriptivo');

    const cryptoAvailable = typeof globalThis.crypto?.subtle?.encrypt === 'function';
    if (!cryptoAvailable) {
        console.log('    (skip: WebCrypto no disponible en este entorno de test)');
        return;
    }

    const { encryptBackup, decryptBackup } = await import('../src/features/import-export/backupCryptoService.js');
    const plaintext = JSON.stringify({ test: true });
    const encrypted = await encryptBackup(plaintext, 'ClaveCorrecta1!');

    let threw = false;
    try {
        await decryptBackup(encrypted, 'ClaveEquivocada!');
    } catch (e) {
        threw = true;
        assert(typeof e.message === 'string' && e.message.length > 0, 'El error debe tener un mensaje descriptivo');
    }
    assert(threw, 'decryptBackup con clave incorrecta debe lanzar un error');
}

// ===================================================================
// UC4: decryptBackup con JSON corrupto lanza error
// ===================================================================
async function test_cryptoService_corruptFile() {
    console.log('  CloudBackup: archivo corrupto genera error descriptivo');

    const { decryptBackup } = await import('../src/features/import-export/backupCryptoService.js');
    let threw = false;
    try {
        await decryptBackup('esto no es json válido!!!', 'cualquierClave');
    } catch (e) {
        threw = true;
        assert(e.message.includes('corrupto') || e.message.includes('válido'), 'Error debe mencionar corrupción o validez');
    }
    assert(threw, 'decryptBackup con archivo corrupto debe lanzar un error');
}

// ===================================================================
// UC5: cloudBackupStorage — set/get/format timestamp
// ===================================================================
async function test_cloudBackupStorage_setGet() {
    console.log('  CloudBackup: cloudBackupStorage guarda y lee el timestamp correctamente');
    clearBackupStorage();

    // Sin backup previo
    const initial = getLastCloudBackupTimestamp();
    assert(initial === null, 'Sin backup previo, getLastCloudBackupTimestamp debe retornar null');

    // Guardar timestamp
    const ts = '2026-05-04T10:30:00.000Z';
    setLastCloudBackupTimestamp(ts);
    const saved = getLastCloudBackupTimestamp();
    assert(saved === ts, 'El timestamp guardado debe ser recuperable');

    clearBackupStorage();
}

// ===================================================================
// UC6: formatBackupTimestamp — formato legible
// ===================================================================
async function test_cloudBackupStorage_format() {
    console.log('  CloudBackup: formatBackupTimestamp retorna string legible o null');
    const formatted = formatBackupTimestamp('2026-05-04T10:30:00.000Z');
    assert(typeof formatted === 'string' && formatted.length > 0, 'Debe formatear una fecha válida');
    assert(formatted.includes('2026'), 'El año debe aparecer en el string formateado');

    const nullResult = formatBackupTimestamp(null);
    assert(nullResult === null, 'null debe retornar null');
}

// ===================================================================
// UC7: CloudBackupModal — se registra como custom element y renderiza
// ===================================================================
async function test_cloudBackupModal_renders() {
    console.log('  CloudBackup: CloudBackupModal se registra y renderiza la estructura UI');
    const modal = document.createElement('cloud-backup-modal');
    document.body.appendChild(modal);

    // El modal debe renderizar el formulario con los campos requeridos
    const form       = modal.querySelector('#cloud-backup-form');
    const passInput  = modal.querySelector('#cloud-backup-password');
    const passConfirm = modal.querySelector('#cloud-backup-password-confirm');
    const uploadBtn  = modal.querySelector('#cloud-backup-upload-btn');
    const statusEl   = modal.querySelector('#cloud-backup-status');
    const lastEl     = modal.querySelector('#cloud-backup-last');

    assert(form !== null,        'Debe existir el formulario #cloud-backup-form');
    assert(passInput !== null,   'Debe existir el campo de clave #cloud-backup-password');
    assert(passConfirm !== null, 'Debe existir la confirmación de clave #cloud-backup-password-confirm');
    assert(uploadBtn !== null,   'Debe existir el botón #cloud-backup-upload-btn');
    assert(statusEl !== null,    'Debe existir el área de estado #cloud-backup-status');
    assert(lastEl !== null,      'Debe existir el label de último backup #cloud-backup-last');

    assert(
        uploadBtn.textContent.includes('Subir backup ahora'),
        'El botón debe decir "Subir backup ahora"'
    );

    document.body.removeChild(modal);
}

// ===================================================================
// UC8: CloudBackupModal — advertencia de proveedor no conectado
// ===================================================================
async function test_cloudBackupModal_providerWarning() {
    console.log('  CloudBackup: CloudBackupModal muestra advertencia de proveedor no conectado');
    const modal = document.createElement('cloud-backup-modal');
    document.body.appendChild(modal);

    const warning = modal.querySelector('.alert-warning');
    assert(warning !== null, 'Debe mostrar una alerta de advertencia de proveedor');
    assert(
        warning.textContent.toLowerCase().includes('proveedor'),
        'La advertencia debe mencionar el proveedor'
    );

    document.body.removeChild(modal);
}

// ===================================================================
// UC9: SettingsDataModal — incluye sección Privacidad y seguridad con
//      botón "Subir backup ahora"
// ===================================================================
async function test_settingsModal_hasPrivacySection() {
    console.log('  CloudBackup: SettingsDataModal incluye sección Privacidad y seguridad');
    const opener = document.createElement('button');
    document.body.appendChild(opener);

    openSettingsModal(opener);

    const modal         = document.querySelector('#settings-data-modal');
    const privacyTitle  = document.getElementById('settings-privacy-title');
    const cloudBtn      = document.getElementById('settings-cloud-backup');

    assert(modal !== null,        'Debe existir el modal de configuración');
    assert(privacyTitle !== null, 'Debe existir la sección de Privacidad y seguridad');
    assert(
        privacyTitle.textContent.includes('Privacidad'),
        'El título debe mencionar "Privacidad"'
    );
    assert(cloudBtn !== null,     'Debe existir el botón Subir backup ahora');
    assert(
        cloudBtn.textContent.includes('Subir backup ahora'),
        'El botón debe decir "Subir backup ahora"'
    );

    // La sección de privacidad debe estar en una card separada
    const privacyCard = privacyTitle.closest('.card');
    const exportCard  = document.getElementById('settings-export')?.closest('.card');
    assert(privacyCard !== null, 'Privacidad debe estar dentro de un .card');
    assert(privacyCard !== exportCard, 'Privacidad debe estar en una card separada de Datos');

    modal.close();
    modal.parentElement?.remove();
    document.body.removeChild(opener);
}

// ===================================================================
// UC10: SettingsDataModal — sigue teniendo 3 cards (Datos + Privacidad + Zona peligrosa)
// ===================================================================
async function test_settingsModal_cardCount() {
    console.log('  CloudBackup: SettingsDataModal tiene 3 cards: Datos, Privacidad y Zona peligrosa');
    const opener = document.createElement('button');
    document.body.appendChild(opener);

    openSettingsModal(opener);
    const modal = document.querySelector('#settings-data-modal');
    const cards = modal?.querySelectorAll('.card') || [];

    assert(cards.length === 3, `Debe haber 3 cards en Configuración (hay ${cards.length})`);

    modal.close();
    modal.parentElement?.remove();
    document.body.removeChild(opener);
}

export const tests = [
    test_cryptoService_exports,
    test_cryptoService_roundTrip,
    test_cryptoService_wrongPassword,
    test_cryptoService_corruptFile,
    test_cloudBackupStorage_setGet,
    test_cloudBackupStorage_format,
    test_cloudBackupModal_renders,
    test_cloudBackupModal_providerWarning,
    test_settingsModal_hasPrivacySection,
    test_settingsModal_cardCount,
];
