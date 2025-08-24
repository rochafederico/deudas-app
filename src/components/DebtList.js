import { el, appendCells } from '../utils/dom.js';
import './AppButton.js';

export class DebtList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.debts = [];
        this.mes = new Date().toISOString().slice(0, 7); // mes actual por defecto
    }

    connectedCallback() {
        this.render();
        this.loadDebts();
        this.addEventListeners();
    }

    addEventListeners() {
        window.addEventListener('ui:month', (event) => {
            this.mes = event.detail.mes;
            this.loadDebts();
        });

        window.addEventListener('deuda:added', () => this.loadDebts());
        window.addEventListener('deuda:updated', () => this.loadDebts());
        window.addEventListener('deuda:deleted', () => this.loadDebts());
    }

    async loadDebts() {
        if (!this.mes) this.mes = new Date().toISOString().slice(0, 7);
        const debts = await this.listByMes(this.mes);
        this.debts = debts;
        console.log('[DebtList] Deudas cargadas:', debts); // Debug: muestra las deudas recuperadas
        this.renderTable();
    }

    async listByMes(mes) {
        // Usa montoRepository para consultar montos por periodo 'YYYY-MM' y agrupar por deuda
        const { listMontos } = await import('../repository/montoRepository.js');
        const { getDeuda } = await import('../repository/deudaRepository.js');
        const montos = await listMontos({ mes }); // mes es 'YYYY-MM'
        const deudaIds = [...new Set(montos.map(m => m.deudaId))];
        const deudas = [];
        for (const id of deudaIds) {
            const deuda = await getDeuda(id);
            deuda.montos = montos.filter(m => m.deudaId === id);
            deudas.push(deuda);
        }
        return deudas;
    }

    renderTable() {
        const tableBody = this.shadowRoot.querySelector('tbody');
        tableBody.innerHTML = '';

        // Totales por moneda
        const totales = {};

        if (this.debts.length === 0) {
            tableBody.appendChild(el('tr', {
                children: [el('td', { text: 'No hay deudas para el mes seleccionado.', attrs: { colspan: 7 }, className: '', })]
            }));
            this.renderTotales(totales);
            return;
        }

        // Unificar todos los montos en un solo array con referencia a la deuda
        const allMontos = this.debts.reduce((arr, deuda) => {
            deuda.montos.forEach(monto => {
                arr.push({ ...monto, acreedor: deuda.acreedor, tipoDeuda: deuda.tipoDeuda });
            });
            return arr;
        }, []);

        // Ordenar por fecha de vencimiento ascendente
        allMontos.sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));

        // Renderizar cada monto
        allMontos.forEach(monto => {
            totales[monto.moneda] = (totales[monto.moneda] || 0) + (Number(monto.monto) || 0);
            const row = document.createElement('tr');
            appendCells(row, [
                { text: monto.acreedor },
                { text: monto.tipoDeuda || '-' },
                { text: monto.moneda },
                { text: this.fmtMoneda(monto.moneda, monto.monto) },
                { text: monto.vencimiento },
                { text: monto.periodo },
                {
                    children: [
                        el('app-button', {
                            text: '✎',
                            attrs: { title: 'Editar deuda' },
                            on: {
                                click: async () => {
                                    let modal = null;
                                    const appShell = document.querySelector('app-shell');
                                    if (appShell && appShell.shadowRoot) {
                                        modal = appShell.shadowRoot.getElementById('debtModal');
                                    }
                                    if (!modal) {
                                        modal = document.getElementById('debtModal');
                                    }
                                    if (modal) {
                                        const { getDeuda } = await import('../repository/deudaRepository.js');
                                        const deudaActualizada = await getDeuda(monto.deudaId);
                                        modal.openEdit(deudaActualizada);
                                        modal.attachOpener(row.querySelector('app-button'));
                                    }
                                }
                            }
                        })
                    ]
                }
            ]);
            tableBody.appendChild(row);
        });

        // Muestra los totales por moneda al final de la tabla
        this.renderTotales(totales);
    }

    renderTotales(totales) {
        let totalRow = this.shadowRoot.getElementById('total-row');
        let leyenda = '💰 Totales a pagar este mes: ';
        if (Object.keys(totales).length === 0) {
            leyenda += '🟢 Sin deudas registradas.';
        } else {
            leyenda += Object.entries(totales)
                .map(([moneda, total]) => {
                    let emoji = '';
                    if (moneda === 'ARS') emoji = '🇦🇷';
                    else if (moneda === 'USD') emoji = '🇺🇸';
                    else if (moneda === 'EUR') emoji = '🇪🇺';
                    else emoji = '💱';
                    return `${emoji} ${this.fmtMoneda(moneda, total)}`;
                })
                .join(' | ');
        }
        if (!totalRow) {
            totalRow = document.createElement('tr');
            totalRow.id = 'total-row';
            totalRow.innerHTML = `<td colspan="7" style="text-align:right;font-weight:bold;color:var(--accent);">${leyenda}</td>`;
            this.shadowRoot.querySelector('tbody').appendChild(totalRow);
        } else {
            totalRow.innerHTML = `<td colspan="7" style="text-align:right;font-weight:bold;color:var(--accent);">${leyenda}</td>`;
        }
    }

    toggleEstado(id) {
        const debt = this.debts.find(d => d.id === id);
        debt.estadoPagada = !debt.estadoPagada;
        window.db.updateDeuda(debt);
        this.renderTable();
    }

    editDebt(id) {
        const debt = this.debts.find(d => d.id === id);
        // Logic to populate the form with debt data for editing
        // Emit an event to open the form with debt data
    }

    deleteDebt(id, acreedor, monto, vencimiento, periodo, moneda) {
        const montoFmt = this.fmtMoneda(moneda, monto);
        if (!confirm(`¿Seguro que quieres borrar los ${montoFmt} que le debes a "${acreedor}"?\nVencimiento: ${vencimiento} | Periodo: ${periodo}`)) return;
        import('../repository/montoRepository.js').then(({ deleteMonto }) => {
            deleteMonto(id).then(() => {
                this.loadDebts(); // Actualiza la tabla tras borrar
            });
        });
    }

    fmtMoneda(moneda, n) {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(n);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    padding: 8px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                th:last-child, td:last-child {
                    text-align: right;
                }
                tr:hover {
                    background-color: #f1f1f1;
                }
                /* Dark mode row hover */
                :host-context(body.dark-mode) tr:hover {
                    background-color: #222a3a;
                }
            </style>
            <table>
                <thead>
                    <tr>
                        <th>Acreedor</th>
                        <th>Tipo</th>
                        <th>Moneda</th>
                        <th>Monto</th>
                        <th>Vencimiento</th>
                        <th>Periodo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        `;
    }
}

customElements.define('debt-list', DebtList);