// src/components/ExportDataModal.js
import '../../../shared/components/AppForm.js';
import '../../../shared/components/UiModal.js';
import { injectBootstrap } from '../../../shared/utils/bootstrapStyles.js';

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

    #mapInversionesForExport(inversiones) {
        return inversiones.map(inv => ({
            nombre: inv.nombre,
            fechaCompra: inv.fechaCompra,
            valorInicial: inv.valorInicial,
            moneda: inv.moneda,
            historialValores: (inv.historialValores || []).map(h => ({
                fecha: h.fecha,
                valor: h.valor,
            }))
        }));
    }

    #createAndDownloadJsonFile(deudas, ingresos, inversiones) {
        const json = JSON.stringify({ deudas, ingresos, inversiones }, null, 2);
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
            const { listDeudas } = await import('../../deudas/deudaRepository.js');
            const { getAll } = await import('../../ingresos/ingresoRepository.js');
            const { listInversiones } = await import('../../inversiones/inversionRepository.js');
            let deudas = await listDeudas();
            const ingresos = await getAll();
            const inversiones = await listInversiones();
            deudas = this.#mapDeudasForExport(deudas);
            const inversionesMapped = this.#mapInversionesForExport(inversiones);
            this.#createAndDownloadJsonFile(deudas, ingresos, inversionesMapped);
        }, 100);
    }

    close() {
        this.modal.close();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <ui-modal id="exportModal">
                <div class="p-3">
                    <p>Exporta todos tus datos en un archivo JSON legible.</p>
                    <div class="text-center mt-3"><span class="spinner"></span></div>
                </div>
                <style>
                .spinner {
                    display: inline-block;
                    width: 2rem;
                    height: 2rem;
                    border: 4px solid #eee;
                    border-top: 4px solid var(--accent, rgb(61, 121, 130));
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
        injectBootstrap(this.shadowRoot);
    }
}

customElements.define('export-data-modal', ExportDataModal);
