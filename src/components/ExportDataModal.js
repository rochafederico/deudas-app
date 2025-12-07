// src/components/ExportDataModal.js
import './AppForm.js';
import './UiModal.js';

export class ExportDataModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    #mapDeudasForExport(deudas) {
        return deudas.map(d => ({
            acreedor: d.acreedor,
            tipoDeuda: d.tipoDeuda,
            notas: d.notas,
            montos: (d.montos || []).map(m => ({
                monto: m.monto,
                moneda: m.moneda,
                vencimiento: m.vencimiento,
                periodo: m.periodo || (m.vencimiento ? m.vencimiento.slice(0, 7) : ''),
                pagado: m.pagado,
            }))
        }));
    }

    #createAndDownloadJsonFile(deudas) {
        const json = JSON.stringify({ deudas }, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'deudasapp-backup.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            this.#removeDownloadLink(a, url);
        }, 100);
    }

    #removeDownloadLink(a, url) {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setTimeout(() => this.close(), 100);
    }

    async open(opener) {
        this.modal = this.shadowRoot.querySelector('ui-modal');
        this.modal.setTitle('Exportar datos');
        this.modal.open();
        this.modal.returnFocusTo(opener);
        setTimeout(async () => {
            const { listDeudas } = await import('../repository/deudaRepository.js');
            let deudas = await listDeudas();
            deudas = this.#mapDeudasForExport(deudas);
            this.#createAndDownloadJsonFile(deudas);
        }, 100);
    }

    close() {
        this.modal.close();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <ui-modal id="exportModal">
                <div style="padding:16px;">
                    <p>Exporta todos tus datos en un archivo JSON legible.</p>
                    <div style="text-align:center;margin-top:16px;"><span class="spinner"></span></div>
                </div>
                <style>
                .spinner {
                    display: inline-block;
                    width: 32px;
                    height: 32px;
                    border: 4px solid #eee;
                    border-top: 4px solid var(--accent, #4b6cb7);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                </style>
            </ui-modal>
        `;
    }
}

customElements.define('export-data-modal', ExportDataModal);
