// src/components/ImportDataModal.js
import './UiModal.js';
import './AppButton.js';
import { DeudaModel } from '../models/DeudaModel.js';
import { MontoModel } from '../models/MontoModel.js';

export class ImportDataModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
        this.importData = null;
        this.fileInput = null;
    }

    connectedCallback() {
        this.shadowRoot.getElementById('select-file-btn').addEventListener('click', () => this.selectFile());
        this.shadowRoot.getElementById('import-btn').addEventListener('click', () => this.importDataToDb());
        this.shadowRoot.getElementById('cancel-btn').addEventListener('click', () => this.close());

        // Crear input file oculto
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.json';
        this.fileInput.style.display = 'none';
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        document.body.appendChild(this.fileInput);
    }

    disconnectedCallback() {
        if (this.fileInput) {
            document.body.removeChild(this.fileInput);
        }
    }

    selectFile() {
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
                this.#showError('❌ Archivo JSON no válido. Asegúrate de que sea un backup de DeudasApp.');
                return;
            }

            this.importData = data;
            this.#showPreview(data);

        } catch (error) {
            console.error('Error al leer archivo:', error);
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

        return true;
    }

    #showPreview(data) {
        const deudas = data.deudas || (data.data && data.data.deudas) || [];
        const ingresos = data.ingresos || (data.data && data.data.ingresos) || [];
        const totalMontos = deudas.reduce((sum, d) => sum + (d.montos?.length || 0), 0);

        const previewHtml = `
            <div class="import-preview">
                <h3>📋 Vista previa del archivo</h3>
                <div class="preview-stats">
                    <p><strong>📊 Resumen:</strong></p>
                    <p>• ${deudas.length} deudas</p>
                    <p>• ${totalMontos} montos</p>
                    ${data.metadata ? `<p>• Exportado: ${new Date(data.metadata.exportDate).toLocaleDateString()}</p>` : ''}
                </div>
                
                <div class="preview-items">
                    <h4>Deudas a importar:</h4>
                    ${deudas.slice(0, 3).map(deuda => `
                        <div class="preview-item">
                            <strong>${deuda.acreedor}</strong> - ${deuda.tipoDeuda}
                            ${deuda.montos?.length ? `(${deuda.montos.length} montos)` : ''}
                        </div>
                    `).join('')}
                    ${deudas.length > 3 ? `<p>... y ${deudas.length - 3} más</p>` : ''}
                </div>
                
                <div class="preview-items">
                    <h4>Ingresos a importar:</h4>
                    ${ingresos.slice(0, 3).map(ingreso => `
                        <div class="preview-item">
                            <strong>${ingreso.descripcion || 'Ingreso'} ${ingreso.fecha}</strong> - ${ingreso.monto} ${ingreso.moneda || 'ARS'}
                        </div>
                    `).join('')}
                    ${ingresos.length > 3 ? `<p>... y ${ingresos.length - 3} más</p>` : ''}
                </div>
                
                
            </div>
        `;

        this.shadowRoot.querySelector('.file-content').innerHTML = previewHtml;
        this.shadowRoot.querySelector('.import-actions').style.display = 'flex';
    }

    async importDataToDb() {
        if (!this.importData) {
            this.#showError('❌ No hay datos para importar');
            return;
        }

        try {
            this.#showProgress('Importando datos...');

            const { addOrMergeDeuda } = await import('../repository/deudaRepository.js');
            const { addIngreso } = await import('../repository/ingresoRepository.js');
            const deudas = this.importData.deudas || (this.importData.data && this.importData.data.deudas) || [];
            const ingresos = this.importData.ingresos || (this.importData.data && this.importData.data.ingresos) || [];
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
                this.#showProgress('Importando ingresos...');
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

            // Mostrar resultado combinando errores de deudas e ingresos
            const totalErrors = errorCount + ingresosErrors;
            if (totalErrors === 0) {
                this.#showSuccess(`✅ Importación exitosa: ${importedCount} deudas importadas, ${ingresosImported} ingresos importados`);
            } else {
                this.#showWarning(`⚠️ Importación parcial: ${importedCount} deudas importadas (${errorCount} errores), ${ingresosImported} ingresos importados (${ingresosErrors} errores)`);
            }

            // Refrescar la vista después de la importación
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('data-imported', {
                    bubbles: true,
                    detail: { deudasImported: importedCount, deudasErrors: errorCount, ingresosImported, ingresosErrors }
                }));
                this.close();
            }, 2000);

        } catch (error) {
            console.error('Error en importación:', error);
            this.#showError('❌ Error durante la importación');
        }
    }

    #showProgress(message) {
        const statusDiv = this.shadowRoot.querySelector('.import-status');
        statusDiv.innerHTML = `
            <div class="progress-message">
                <div class="spinner"></div>
                <span>${message}</span>
            </div>
        `;
    }

    #showSuccess(message) {
        const statusDiv = this.shadowRoot.querySelector('.import-status');
        statusDiv.innerHTML = `<div class="success-message">${message}</div>`;
    }

    #showError(message) {
        const statusDiv = this.shadowRoot.querySelector('.import-status');
        statusDiv.innerHTML = `<div class="error-message">${message}</div>`;
    }

    #showWarning(message) {
        const statusDiv = this.shadowRoot.querySelector('.import-status');
        statusDiv.innerHTML = `<div class="warning-message">${message}</div>`;
    }

    open(opener) {
        this.modal = this.shadowRoot.querySelector('ui-modal');
        this.modal.setTitle('Importar datos');
        this.modal.open();
        this.modal.returnFocusTo(opener);

        // Reset state
        this.importData = null;
        this.shadowRoot.querySelector('.file-content').innerHTML = '';
        this.shadowRoot.querySelector('.import-status').innerHTML = '';
        this.shadowRoot.querySelector('.import-actions').style.display = 'none';
    }

    close() {
        this.modal.close();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .import-content {
                    padding: 16px;
                    min-height: 300px;
                }

                .file-selection {
                    text-align: center;
                    padding: 20px;
                    border: 2px dashed #ccc;
                    border-radius: 8px;
                    margin-bottom: 16px;
                }

                .file-selection p {
                    margin: 0 0 16px 0;
                }

                .file-content {
                    margin: 16px 0;
                }

                .import-preview {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 16px;
                }

                .import-preview h3 {
                    margin-top: 0;
                    color: #ddd;
                }

                .preview-stats {
                    margin: 12px 0;
                    padding: 12px;
                    border-radius: 4px;
                }

                .preview-stats p {
                    margin: 4px 0;
                }

                .preview-items {
                    margin: 12px 0;
                }

                .preview-item {
                    padding: 8px;
                    margin: 4px 0;
                    border-radius: 4px;
                    border-left: 3px solid #4b6cb7;
                }

                .import-warning {
                    margin: 12px 0;
                    padding: 12px;
                    border: 1px solid #ffeaa7;
                    border-radius: 4px;
                    max-width: 600px;
                }

                .import-warning p {
                    margin: 4px 0;
                }

                .import-actions {
                    display: none;
                    gap: 12px;
                    margin-top: 16px;
                    padding-top: 16px;                }
                }

                .import-status {
                    margin-top: 16px;
                    min-height: 30px;
                }

                .success-message {
                    color: green;
                    padding: 12px;
                    border: 1px solid green;
                    border-radius: 4px;
                }

                .error-message {
                    color: red;
                    padding: 12px;
                    border: 1px solid red;
                    border-radius: 4px;
                }

                .warning-message {
                    color: #856404;
                    padding: 12px;
                    border: 1px solid #ffeaa7;
                    border-radius: 4px;
                }

                .progress-message {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border: 1px solid #2196f3;
                    border-radius: 4px;
                }

                .spinner {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border: 2px solid #eee;
                    border-top: 2px solid var(--accent, #4b6cb7);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @media (max-width: 600px) {
                    .import-actions {
                        flex-direction: column;
                    }
                }
            </style>
            
            <ui-modal id="importModal">
                <div class="import-content">
                    <div class="file-selection">
                        <p>📁 Selecciona un archivo JSON de backup para importar</p>
                        <app-button id="select-file-btn" variant="primary">
                            Seleccionar archivo
                        </app-button>
                    </div>
                    <div class="import-warning">
                        <p>⚠️ <strong>Importante:</strong></p>
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
                    
                    <div class="file-content"></div>
                    
                    <div class="import-actions">
                        <app-button id="import-btn" variant="success">
                            📥 Importar datos
                        </app-button>
                        <app-button id="cancel-btn" variant="secondary">
                            Cancelar
                        </app-button>
                    </div>
                    
                    <div class="import-status"></div>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('import-data-modal', ImportDataModal);