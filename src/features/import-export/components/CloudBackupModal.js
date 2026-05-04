// src/features/import-export/components/CloudBackupModal.js
// Modal para generar y "subir" un backup cifrado.
// Criterios de aceptación (HU 5.6):
//   - Acción "Subir backup ahora" con confirmación explícita
//   - Cifrado en el dispositivo antes de cualquier transferencia
//   - Muestra fecha/hora del último backup exitoso
//   - Errores claros ante: sin conexión, proveedor no conectado
//   - El archivo no es legible sin la clave del usuario

import '../../../shared/components/UiModal.js';
import '../../../shared/components/AppButton.js';
import '../../../shared/components/AppSpinner.js';
import { encryptBackup } from '../backupCryptoService.js';
import {
    getLastCloudBackupTimestamp,
    setLastCloudBackupTimestamp,
    formatBackupTimestamp,
} from '../cloudBackupStorage.js';
import {
    trackEvent,
    trackFlowStart,
    trackFlowComplete,
    trackFlowError,
} from '../../../shared/observability/index.js';

export class CloudBackupModal extends HTMLElement {
    constructor() {
        super();
        this._rendered = false;
        this._uploading = false;
    }

    connectedCallback() {
        if (this._rendered) return;
        this._rendered = true;
        this.render();
        this._bindEvents();
    }

    _bindEvents() {
        this._modal     = this.querySelector('#cloud-backup-modal');
        this._form      = this.querySelector('#cloud-backup-form');
        this._passInput = this.querySelector('#cloud-backup-password');
        this._passConfirm = this.querySelector('#cloud-backup-password-confirm');
        this._uploadBtn = this.querySelector('#cloud-backup-upload-btn');
        this._statusEl  = this.querySelector('#cloud-backup-status');
        this._lastEl    = this.querySelector('#cloud-backup-last');

        this._uploadBtn?.addEventListener('click', () => this._handleUpload());
    }

    open(opener) {
        this._modal.setTitle('Backup cifrado');
        this._modal.returnFocusTo(opener);
        this._refreshLastBackup();
        this._clearStatus();
        if (this._passInput) this._passInput.value = '';
        if (this._passConfirm) this._passConfirm.value = '';
        this._modal.open();
        trackFlowStart('cloud_backup', { step: 'modal_open' });
    }

    close() {
        this._modal?.close();
    }

    _refreshLastBackup() {
        const ts = getLastCloudBackupTimestamp();
        const formatted = formatBackupTimestamp(ts);
        if (this._lastEl) {
            this._lastEl.textContent = formatted
                ? `Último backup: ${formatted}`
                : 'Sin backups previos.';
        }
    }

    _clearStatus() {
        if (this._statusEl) this._statusEl.innerHTML = '';
    }

    _showStatus(message, type = 'info') {
        if (!this._statusEl) return;
        const typeClass = type === 'error' ? 'alert-danger'
            : type === 'success' ? 'alert-success'
            : 'alert-info';
        this._statusEl.innerHTML = `<div class="alert ${typeClass} py-2 mb-0 small">${message}</div>`;
    }

    _setUploading(loading) {
        this._uploading = loading;
        if (this._uploadBtn) {
            this._uploadBtn.disabled = loading;
            this._uploadBtn.innerHTML = loading
                ? `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Cifrando…`
                : `<i class="bi bi-cloud-upload me-2" aria-hidden="true"></i>Subir backup ahora`;
        }
    }

    async _handleUpload() {
        if (this._uploading) return;

        const password = this._passInput?.value?.trim() ?? '';
        const passwordConfirm = this._passConfirm?.value?.trim() ?? '';

        // Validaciones previas
        if (!password) {
            this._showStatus('⚠️ Ingresá una clave de cifrado para continuar.', 'error');
            this._passInput?.focus();
            return;
        }
        if (password.length < 8) {
            this._showStatus('⚠️ La clave debe tener al menos 8 caracteres.', 'error');
            this._passInput?.focus();
            return;
        }
        if (password !== passwordConfirm) {
            this._showStatus('⚠️ Las claves no coinciden. Verificá e intentá de nuevo.', 'error');
            this._passConfirm?.focus();
            return;
        }

        // Verificar conexión
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            this._showStatus('❌ Sin conexión. Conectate a internet e intentá de nuevo.', 'error');
            trackFlowError('cloud_backup', { step: 'pre_check', reason: 'offline' });
            return;
        }

        // Confirmación explícita del usuario
        const confirmed = confirm(
            '¿Confirmás la subida del backup cifrado?\n\n' +
            '• El archivo se cifrará en tu dispositivo antes de cualquier transferencia.\n' +
            '• Solo vas a poder abrirlo con la clave que ingresaste.\n' +
            '• Guardá tu clave en un lugar seguro.'
        );
        if (!confirmed) {
            trackEvent('cloud_backup_cancelled', { step: 'confirmation' });
            return;
        }

        this._setUploading(true);
        this._clearStatus();

        try {
            // Obtener datos
            const { listDeudas } = await import('../../deudas/deudaRepository.js');
            const { getAll } = await import('../../ingresos/ingresoRepository.js');
            const { listInversiones } = await import('../../inversiones/inversionRepository.js');

            const deudas = await listDeudas();
            const ingresos = await getAll();
            const inversiones = await listInversiones();

            const plaintext = JSON.stringify({ deudas, ingresos, inversiones });

            // Cifrar en el dispositivo
            const encryptedJson = await encryptBackup(plaintext, password);

            // "Subir" = descargar el archivo cifrado localmente
            // (sin proveedor de nube conectado, el archivo cifrado queda en el dispositivo)
            this._downloadEncryptedFile(encryptedJson);

            // Registrar timestamp del último backup exitoso
            const now = new Date().toISOString();
            setLastCloudBackupTimestamp(now);
            this._refreshLastBackup();

            trackFlowComplete('cloud_backup', {
                deudas: deudas.length,
                ingresos: ingresos.length,
                inversiones: inversiones.length,
            });

            this._showStatus('✅ Backup cifrado generado y descargado correctamente.', 'success');
            window.dispatchEvent(new CustomEvent('app:notify', {
                detail: { message: '✅ Backup cifrado descargado.', type: 'success' }
            }));
        } catch (error) {
            console.error('Error al generar backup cifrado:', error);
            const reason = error.message || 'unknown';
            trackFlowError('cloud_backup', { step: 'encrypt_upload', reason });

            const msg = _mapErrorMessage(error);
            this._showStatus(`❌ ${msg}`, 'error');
        } finally {
            this._setUploading(false);
        }
    }

    _downloadEncryptedFile(encryptedJson) {
        const blob = new Blob([encryptedJson], { type: 'application/octet-stream' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        const ts   = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        a.href     = url;
        a.download = `nivva-backup-${ts}.enc`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    render() {
        this.innerHTML = `
            <ui-modal id="cloud-backup-modal">
                <div class="d-grid gap-3">

                    <!-- Estado del proveedor -->
                    <div class="alert alert-warning py-2 mb-0 d-flex align-items-center gap-2 small" role="status">
                        <i class="bi bi-cloud-slash" aria-hidden="true"></i>
                        <span>Proveedor de nube: <strong>ninguno conectado</strong>. El backup cifrado se descargará en tu dispositivo.</span>
                    </div>

                    <!-- Último backup -->
                    <p id="cloud-backup-last" class="text-muted small mb-0"></p>

                    <!-- Instrucciones -->
                    <div class="alert alert-info py-2 mb-0 small" role="note">
                        <p class="mb-1"><strong>ℹ️ Cómo funciona:</strong></p>
                        <ul class="mb-0 ps-3">
                            <li>Ingresá una clave: solo vos podés descifrar el backup.</li>
                            <li>El archivo se cifra <strong>en tu dispositivo</strong> antes de guardarse.</li>
                            <li>Si perdés la clave, no hay forma de recuperar el backup.</li>
                        </ul>
                    </div>

                    <!-- Formulario de clave -->
                    <form id="cloud-backup-form" novalidate>
                        <div class="mb-3">
                            <label for="cloud-backup-password" class="form-label fw-semibold">
                                Clave de cifrado
                            </label>
                            <input
                                type="password"
                                id="cloud-backup-password"
                                class="form-control"
                                placeholder="Mínimo 8 caracteres"
                                autocomplete="new-password"
                                minlength="8"
                                required
                            />
                        </div>
                        <div class="mb-3">
                            <label for="cloud-backup-password-confirm" class="form-label fw-semibold">
                                Confirmá la clave
                            </label>
                            <input
                                type="password"
                                id="cloud-backup-password-confirm"
                                class="form-control"
                                placeholder="Repetí tu clave"
                                autocomplete="new-password"
                                required
                            />
                        </div>
                    </form>

                    <!-- Estado / errores -->
                    <div id="cloud-backup-status"></div>

                    <!-- Acción principal -->
                    <button
                        type="button"
                        id="cloud-backup-upload-btn"
                        class="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                    >
                        <i class="bi bi-cloud-upload" aria-hidden="true"></i>
                        Subir backup ahora
                    </button>

                </div>
            </ui-modal>
        `;
    }
}

/**
 * Mapea errores técnicos a mensajes claros para el usuario.
 */
function _mapErrorMessage(error) {
    const msg = error?.message ?? '';
    if (msg.includes('offline') || msg.includes('network') || msg.includes('NetworkError')) {
        return 'Sin conexión. Conectate a internet e intentá de nuevo.';
    }
    if (msg.includes('permission') || msg.includes('NotAllowedError')) {
        return 'Sin permisos para guardar el archivo. Revisá los permisos del navegador.';
    }
    if (msg.includes('WebCrypto')) {
        return 'Tu navegador no soporta cifrado seguro. Actualizalo e intentá de nuevo.';
    }
    return 'No se pudo generar el backup. Intentá de nuevo.';
}

customElements.define('cloud-backup-modal', CloudBackupModal);
