import { el, appendCells } from '../utils/dom.js';
import './AppButton.js';
import './AppTable.js';
import { debtTableColumns } from '../config/tables/debtTableColumns.js';

export class DebtList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.debts = [];
        this.mes = new Date().toISOString().slice(0, 7); // mes actual por defecto
        this.groupBy = 'none'; // agrupamiento por defecto
    }

    connectedCallback() {
        this.render();
        this.loadDebts();
        this.addEventListeners();
        window.addEventListener('ui:group', (event) => {
            this.groupBy = event.detail.groupBy || 'none';
            this.renderTable();
        });
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
        // Totales por moneda
        const totales = {};

        // Unificar todos los montos en un solo array con referencia a la deuda
        let allMontos = this.debts.reduce((arr, deuda) => {
            deuda.montos.forEach(monto => {
                arr.push({ ...monto, acreedor: deuda.acreedor, tipoDeuda: deuda.tipoDeuda });
            });
            return arr;
        }, []);

        // Agrupamiento dinámico
        if (this.groupBy !== 'none') {
            allMontos = this.groupMontos(allMontos, this.groupBy);
        }

        // Ordenar por fecha de vencimiento ascendente
        allMontos.sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));

        // Calcular totales por moneda
        allMontos.forEach(monto => {
            totales[monto.moneda] = (totales[monto.moneda] || 0) + (Number(monto.monto) || 0);
        });

        // Definir columnas para AppTable
        // Clonar y agregar formateador de moneda y handler de edición a cada fila
        const columns = debtTableColumns;
        const tableData = allMontos.map(row => ({
            ...row,
            _fmtMoneda: this.fmtMoneda.bind(this),
            _onEdit: async (monto) => {
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
                    modal.attachOpener();
                }
            }
        }));

        // Renderizar AppTable
        let table = this.shadowRoot.querySelector('app-table');
        if (!table) {
            table = document.createElement('app-table');
            this.shadowRoot.appendChild(table);
        }
        table.columnsConfig = columns;
        table.tableData = tableData;

        // Pasar función para renderizar el footer
        table.footerRenderer = (columns, data) => {
            // Calcular totales por moneda usando los datos
            const totales = {};
            data.forEach(row => {
                totales[row.moneda] = (totales[row.moneda] || 0) + (Number(row.monto) || 0);
            });
            let leyenda = '💰 Totales a pagar este mes: ';
            if (Object.keys(totales).length === 0) {
                leyenda += '🟢 Sin deudas registradas.';
            } else {
                leyenda += Object.entries(totales)
                    .map(([moneda, total]) => {
                        let emoji = '';
                        if (moneda === 'ARS') emoji = '🇦🇷';
                        else if (moneda === 'USD') emoji = '🇺🇸';
                        else emoji = '💱';
                        return `${emoji} ${this.fmtMoneda(moneda, total)}`;
                    })
                    .join(' | ');
            }
            const columnsCount = columns.length;
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="${columnsCount}" style="text-align:right;font-weight:bold;color:var(--accent);">${leyenda}</td>`;
            return tr;
        };
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
            <app-table></app-table>
        `;
    }

    groupMontos(montos, groupBy) {
        // Devuelve un array agrupado según el criterio, siempre separando por moneda salvo si el filtro es 'moneda'
        const grouped = {};
        montos.forEach(monto => {
            let key = '';
            switch (groupBy) {
                case 'acreedor': key = `${monto.acreedor}__${monto.moneda}`; break;
                case 'tipo': key = `${monto.tipoDeuda}__${monto.moneda}`; break;
                case 'vencimiento': key = `${monto.vencimiento}__${monto.moneda}`; break;
                case 'moneda': key = monto.moneda; break;
                default: key = `Otros__${monto.moneda}`;
            }
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(monto);
        });
        // Devuelve un array donde cada elemento es un resumen del grupo
        return Object.entries(grouped).map(([group, items]) => {
            // Sumar montos del grupo
            const total = items.reduce((sum, m) => sum + (Number(m.monto) || 0), 0);
            // Agrupar acreedores, tipos y vencimientos si corresponde
            const acreedores = [...new Set(items.map(m => m.acreedor))].join(', ');
            const tipos = [...new Set(items.map(m => m.tipoDeuda))].join(', ');
            const vencimientos = [...new Set(items.map(m => m.vencimiento))].join(', ');
            // Extraer moneda del key si corresponde
            const moneda = items[0].moneda;
            let groupLabel = group;
            if (group.includes('__')) {
                const [main, mon] = group.split('__');
                groupLabel = main;
            }
            return {
                ...items[0],
                monto: total,
                groupLabel,
                items: items, // para posible expansión futura
                acreedor: (groupBy !== 'acreedor') ? acreedores : groupLabel,
                tipoDeuda: (groupBy !== 'tipo') ? tipos : groupLabel,
                vencimiento: (groupBy !== 'vencimiento') ? vencimientos : groupLabel,
                moneda
            };
        });
    }
}

customElements.define('debt-list', DebtList);