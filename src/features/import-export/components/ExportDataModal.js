// src/components/ExportDataModal.js
import '../../../shared/components/AppForm.js';
import '../../../shared/components/UiModal.js';
import {
    trackEvent,
    trackFlowStart,
    trackFlowComplete,
    trackFlowError
} from '../../../shared/observability/index.js';

export class ExportDataModal extends HTMLElement {
    constructor() {
        super();
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
    }

    async open(opener) {
        if (!this._rendered) this.render();
        this.modal = this.querySelector('ui-modal');
        this.modal.setTitle('Exportar datos');
        this.modal.returnFocusTo(opener);
        await this.modal.open();
        trackFlowStart('export_data', { step: 'modal_open' });
        try {
            const { listDeudas } = await import('../../deudas/deudaRepository.js');
            const { getAll } = await import('../../ingresos/ingresoRepository.js');
            const { listInversiones } = await import('../../inversiones/inversionRepository.js');
            let deudas = await listDeudas();
            const ingresos = await getAll();
            const inversiones = await listInversiones();
            deudas = this.#mapDeudasForExport(deudas);
            const inversionesMapped = this.#mapInversionesForExport(inversiones);
            this.#createAndDownloadJsonFile(deudas, ingresos, inversionesMapped);
            this.close();
            trackEvent('export_data_used', {
                flow: 'export_data',
                status: 'completed',
                deudas: deudas.length,
                ingresos: ingresos.length,
                inversiones: inversionesMapped.length
            });
            await trackFlowComplete('export_data', {
                deudas: deudas.length,
                ingresos: ingresos.length,
                inversiones: inversionesMapped.length
            });
            window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: '✅ Exportación exitosa. El archivo se descargó.', type: 'success' } }));
        } catch (error) {
            console.error('Error al exportar:', error);
            trackFlowError('export_data', { step: 'export', reason: error.message });
            window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: '❌ Error al exportar los datos', type: 'danger' } }));
            this.close();
        }
    }

    close() {
        this.modal.close();
    }

    render() {
        this._rendered = true;
        this.innerHTML = `
            <ui-modal id="exportModal">
                <div class="p-3">
                    <p>Exporta todos tus datos en un archivo JSON legible.</p>
                    <div class="text-center mt-3">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('export-data-modal', ExportDataModal);
