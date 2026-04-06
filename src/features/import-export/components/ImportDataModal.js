// src/components/ImportDataModal.js
import '../../../shared/components/UiModal.js';
import '../../../shared/components/AppButton.js';
import '../../../shared/components/AppSpinner.js';
import { DeudaModel } from '../../deudas/DeudaModel.js';
import { MontoModel } from '../../montos/MontoModel.js';
import {
    trackEvent,
    trackFlowStart,
    trackFlowComplete,
    trackFlowError,
    trackFlowAbandoned,
    updateFlowStep
} from '../../../shared/analytics/analytics.service.js';

export class ImportDataModal extends HTMLElement {
    constructor() {
        super();
        this.importData = null;
        this.fileInput = null;
    }

    connectedCallback() {
        this.classList.add('d-block');
        this.render();

        // Cache element references now, before UiModal.open() moves the .modal
        // node to document.body (which would make this.querySelector return null).
        this._fileSelector = this.querySelector('.file-selector');
        this._importWarning = this.querySelector('.import-warning');
        this._fileContent = this.querySelector('.file-content');
        this._importStatus = this.querySelector('.import-status');
        this._importActions = this.querySelector('.import-actions');

        this.querySelector('#select-file-btn').addEventListener('click', () => this.selectFile());
        this.querySelector('#import-btn').addEventListener('click', () => this.importDataToDb());
        this.querySelector('#cancel-btn').addEventListener('click', () => this.close());

        // Crear input file oculto
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.json';
        this.fileInput.className = 'd-none';
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        document.body.appendChild(this.fileInput);
    }

    disconnectedCallback() {
        if (this.fileInput) {
            document.body.removeChild(this.fileInput);
        }
    }

    selectFile() {
        if (!this._analyticsStarted) {
            this._analyticsStarted = true;
            trackFlowStart('import_data', { step: 'file_picker' });
        } else {
            updateFlowStep('import_data', 'file_picker');
        }
        trackEvent('shortcut_used', {
            flow: 'shortcut',
            status: 'completed',
            shortcut: 'import_data',
            location: 'import_modal'
        });
        this.fileInput.click();
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validar estructura del archivo
            if (!this.#validateImportData(data)) {
                trackFlowError('import_data', { step: 'file_validation', reason: 'invalid_structure' });
                this.#showError('❌ Archivo JSON no válido. Asegúrate de que sea un backup de DeudasApp.');
                return;
            }

            this.importData = data;
            updateFlowStep('import_data', 'preview_ready');
            this.#showPreview(data);

        } catch (error) {
            console.error('Error al leer archivo:', error);
            trackFlowError('import_data', { step: 'file_read', reason: 'invalid_json' });
            this.#showError('❌ Error al leer el archivo. Asegúrate de que sea un JSON válido.');
        }
    }

    #validateImportData(data) {
        // Validar estructura básica
        if (!data || typeof data !== 'object') {
            return false;
        }

        // Verificar si tiene la estructura de deudas directamente o en data.deudas (nuevo formato)
        const deudas = data.deudas || (data.data && data.data.deudas);

        if (!Array.isArray(deudas)) {
            return false;
        }

        // Validar que al menos una deuda tenga la estructura correcta
        if (deudas.length > 0) {
            const primeraDeuda = deudas[0];
            if (!primeraDeuda.acreedor || !primeraDeuda.tipoDeuda) {
                return false;
            }
        }

        const ingresos = data.ingresos || (data.data && data.data.ingresos);
        if (ingresos && !Array.isArray(ingresos)) {
            return false;
        }

        const inversiones = data.inversiones || (data.data && data.data.inversiones);
        if (inversiones && !Array.isArray(inversiones)) {
            return false;
        }

        return true;
    }

    #showPreview(data) {
        const deudas = data.deudas || (data.data && data.data.deudas) || [];
        const ingresos = data.ingresos || (data.data && data.data.ingresos) || [];
        const inversiones = data.inversiones || (data.data && data.data.inversiones) || [];
        const totalMontos = deudas.reduce((sum, d) => sum + (d.montos?.length || 0), 0);

        const previewHtml = `
            <div class="border rounded p-3">
                <h3 class="h5 text-primary mb-3">📋 Vista previa del archivo</h3>
                <div class="bg-body-tertiary rounded p-3 mb-3">
                    <p class="mb-1"><strong>📊 Resumen:</strong></p>
                    <p class="mb-1">• ${deudas.length} deudas</p>
                    <p class="mb-1">• ${totalMontos} montos</p>
                    <p class="mb-1">• ${ingresos.length} ingresos</p>
                    <p class="mb-1">• ${inversiones.length} inversiones</p>
                    ${data.metadata ? `<p>• Exportado: ${new Date(data.metadata.exportDate).toLocaleDateString()}</p>` : ''}
                </div>
                
                <div class="mb-3">
                    <h4 class="h6">Deudas a importar:</h4>
                    ${deudas.slice(0, 3).map(deuda => `
                        <div class="border-start border-primary border-3 rounded px-2 py-2 mb-2 bg-body-tertiary">
                            <strong>${deuda.acreedor}</strong> - ${deuda.tipoDeuda}
                            ${deuda.montos?.length ? `(${deuda.montos.length} montos)` : ''}
                        </div>
                    `).join('')}
                    ${deudas.length > 3 ? `<p>... y ${deudas.length - 3} más</p>` : ''}
                </div>
                
                <div class="mb-3">
                    <h4 class="h6">Ingresos a importar:</h4>
                    ${ingresos.slice(0, 3).map(ingreso => `
                        <div class="border-start border-primary border-3 rounded px-2 py-2 mb-2 bg-body-tertiary">
                            <strong>${ingreso.descripcion || 'Ingreso'} ${ingreso.fecha}</strong> - ${ingreso.monto} ${ingreso.moneda || 'ARS'}
                        </div>
                    `).join('')}
                    ${ingresos.length > 3 ? `<p>... y ${ingresos.length - 3} más</p>` : ''}
                </div>
                
                <div class="mb-0">
                    <h4 class="h6">Inversiones a importar:</h4>
                    ${inversiones.slice(0, 3).map(inv => `
                        <div class="border-start border-primary border-3 rounded px-2 py-2 mb-2 bg-body-tertiary">
                            <strong>${inv.nombre}</strong> - ${inv.valorInicial} ${inv.moneda || 'ARS'}
                            ${inv.historialValores?.length ? `(${inv.historialValores.length} valores)` : ''}
                        </div>
                    `).join('')}
                    ${inversiones.length > 3 ? `<p>... y ${inversiones.length - 3} más</p>` : ''}
                </div>
                
            </div>
        `;

        this._fileContent.innerHTML = previewHtml;
        this._fileSelector.classList.add('d-none');
        this._importWarning.classList.add('d-none');
        this._importActions.classList.remove('d-none');
    }

    async importDataToDb() {
        if (!this.importData) {
            this.#showError('❌ No hay datos para importar');
            return;
        }

        try {
            this.#showLoading('Importando datos...');
            if (!this._analyticsStarted) {
                this._analyticsStarted = true;
                trackFlowStart('import_data', { step: 'import' });
            } else {
                updateFlowStep('import_data', 'import');
            }

            const { addOrMergeDeuda } = await import('../../deudas/deudaRepository.js');
            const { addIngreso } = await import('../../ingresos/ingresoRepository.js');
            const { addInversion } = await import('../../inversiones/inversionRepository.js');
            const deudas = this.importData.deudas || (this.importData.data && this.importData.data.deudas) || [];
            const ingresos = this.importData.ingresos || (this.importData.data && this.importData.data.ingresos) || [];
            const inversiones = this.importData.inversiones || (this.importData.data && this.importData.data.inversiones) || [];
            let importedCount = 0;
            let errorCount = 0;

            for (const deudaData of deudas) {
                try {
                    // Crear instancia de DeudaModel sin ID para que se genere uno nuevo
                    const montos = (deudaData.montos || []).map(m => new MontoModel({
                        monto: m.monto,
                        moneda: m.moneda || 'ARS',
                        vencimiento: m.vencimiento,
                        periodo: m.periodo,
                        pagado: m.pagado || false
                    }));

                    const deuda = new DeudaModel({
                        acreedor: deudaData.acreedor,
                        tipoDeuda: deudaData.tipoDeuda,
                        notas: deudaData.notas || '',
                        montos: montos
                    });

                    await addOrMergeDeuda(deuda);
                    importedCount++;

                } catch (error) {
                    console.error('Error al importar deuda:', deudaData, error);
                    errorCount++;
                }
            }

            let ingresosImported = 0;
            let ingresosErrors = 0;
            if (ingresos && ingresos.length > 0) {
                this.#showLoading('Importando ingresos...');
                for (const ingreso of ingresos) {
                    try {
                        await addIngreso(ingreso);
                        ingresosImported++;
                    } catch (error) {
                        console.error('Error al importar ingreso:', ingreso, error);
                        ingresosErrors++;
                    }
                }
            }

            let inversionesImported = 0;
            let inversionesErrors = 0;
            if (inversiones && inversiones.length > 0) {
                this.#showLoading('Importando inversiones...');
                for (const inv of inversiones) {
                    try {
                        const inversionData = {
                            nombre: inv.nombre,
                            fechaCompra: inv.fechaCompra,
                            valorInicial: inv.valorInicial,
                            moneda: inv.moneda || 'ARS',
                            historialValores: inv.historialValores || []
                        };
                        await addInversion(inversionData);
                        inversionesImported++;
                    } catch (error) {
                        console.error('Error al importar inversión:', inv, error);
                        inversionesErrors++;
                    }
                }
            }

            const totalErrors = errorCount + ingresosErrors + inversionesErrors;
            const notifyType = totalErrors === 0 ? 'success' : 'warning';
            const notifyMsg = totalErrors === 0
                ? `✅ Importación exitosa: ${importedCount} deudas, ${ingresosImported} ingresos, ${inversionesImported} inversiones`
                : `⚠️ Importación parcial: ${importedCount} deudas (${errorCount} err), ${ingresosImported} ingresos (${ingresosErrors} err), ${inversionesImported} inversiones (${inversionesErrors} err)`;

            window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: notifyMsg, type: notifyType } }));
            window.dispatchEvent(new CustomEvent('data-imported', {
                bubbles: true,
                detail: { deudasImported: importedCount, deudasErrors: errorCount, ingresosImported, ingresosErrors, inversionesImported, inversionesErrors }
            }));
            await trackFlowComplete('import_data', {
                deudasImported: importedCount,
                ingresosImported,
                inversionesImported,
                errors: totalErrors
            });
            this._analyticsStarted = false;
            await this.close();

        } catch (error) {
            console.error('Error en importación:', error);
            trackFlowError('import_data', { step: 'import', reason: error.message });
            this.#showError('❌ Error durante la importación');
            window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: '❌ Error durante la importación', type: 'danger' } }));
        }
    }

    #showLoading(label = 'Cargando...') {
        this._fileSelector.classList.add('d-none');
        this._importWarning.classList.add('d-none');
        this._importActions.classList.add('d-none');
        this._importStatus.innerHTML = '';
        this._fileContent.innerHTML = `<app-spinner label="${label}"></app-spinner>`;
    }

    #showError(message) {
        this._importStatus.innerHTML = `<div class="alert alert-danger py-2 mb-0" role="alert">${message}</div>`;
    }

    open(opener) {
        this.modal = this.querySelector('ui-modal');
        this.modal.setTitle('Importar datos');
        this._analyticsStarted = false;

        // Reset state before opening (elements are moved to document.body on open)
        this.importData = null;
        this._fileSelector.classList.remove('d-none');
        this._importWarning.classList.remove('d-none');
        this._fileContent.innerHTML = '';
        this._importStatus.innerHTML = '';
        this._importActions.classList.add('d-none');

        this.modal.open();
        this.modal.returnFocusTo(opener);
    }

    async close() {
        if (this._analyticsStarted) {
            await trackFlowAbandoned('import_data', 'modal_close', { reason: 'close' });
            this._analyticsStarted = false;
        }
        this.modal = this.modal || this.querySelector('ui-modal');
        this.modal?.close();
    }

    render() {
        this.innerHTML = `
            <ui-modal id="importModal">
                <div class="p-3 d-grid gap-3">
                    <div class="file-selector text-center p-4 border border-2 border-secondary border-opacity-25 rounded">
                        <p class="mb-3">📁 Selecciona un archivo JSON de backup para importar</p>
                        <app-button id="select-file-btn" variant="primary">
                            Seleccionar archivo
                        </app-button>
                    </div>
                    <div class="import-warning alert alert-warning mb-0" role="alert">
                        <p class="mb-2">⚠️ <strong>Importante:</strong></p>
                        <ul>
                            <li>La importación añade datos (no elimina):
                                <ul>
                                    <li>Por defecto no borra registros existentes.</li>
                                </ul>
                            </li>
                            <li>Fusión por grupo (Acreedor + Tipo de Deuda):
                                <ul>
                                    <li>Si existe el mismo Acreedor y Tipo de Deuda (p. ej. <strong>Banco Galicia</strong> + <strong>Préstamo</strong>), las cuotas se agrupan en esa deuda en vez de crear otra.</li>
                                </ul>
                            </li>
                            <li>Detección de montos duplicados:
                                <ul>
                                    <li>Se consideran iguales si coinciden: <strong>monto</strong>, <strong>moneda</strong> y <strong>periodo</strong>.</li>
                                    <li>Fallback: si no hay periodo, se compara <em>vencimiento</em> exacto.</li>
                                    <li>Mismo monto pero distinta fecha → se importa como monto distinto.</li>
                                </ul>
                            </li>
                            <li>Forzar nuevo grupo:
                                <ul>
                                    <li>Cambia el <em>acreedor</em> o el <em>tipoDeuda</em> en el JSON antes de importar.</li>
                                </ul>
                            </li>
                            <li>Nota técnica (breve):
                                <ul>
                                    <li>La fusión reutiliza las funciones de creación/actualización; puede ejecutarse en varias transacciones (muy raro que cause duplicados por concurrencia).</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="file-content my-2"></div>
                    
                    <div class="import-actions d-none d-flex flex-column flex-sm-row gap-3 pt-3 border-top">
                        <app-button id="import-btn" variant="success">
                            📥 Importar datos
                        </app-button>
                        <app-button id="cancel-btn" variant="secondary">
                            Cancelar
                        </app-button>
                    </div>
                    
                    <div class="import-status mt-3"></div>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('import-data-modal', ImportDataModal);
