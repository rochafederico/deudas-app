import '../../../shared/components/AppButton.js';
import '../../../shared/components/AppTable.js';
import '../../../shared/components/AppCheckbox.js';
import { debtTableColumns } from '../../../shared/config/tables/debtTableColumns.js';
import './DebtDetailModal.js';
import './DebtRowItem.js';
import { getSelectedMonth } from '../../../shared/MonthFilter.js';

export class DebtList extends HTMLElement {
    constructor() {
        super();
        this.debts = [];
        this.mes = getSelectedMonth();
        this.groupBy = 'none'; // agrupamiento por defecto
    }

    connectedCallback() {
        this.classList.add('d-block');
        this._excludeColumns = (this.getAttribute('exclude-columns') || '').split(',').filter(Boolean);
        this._showDetailAction = this.hasAttribute('show-detail-action');
        this.render();
        this.loadDebts();
        this.addEventListeners();
    }

    disconnectedCallback() {
        window.removeEventListener('ui:month', this._onMonth);
        window.removeEventListener('ui:group', this._onGroup);
        window.removeEventListener('deuda:saved', this._onLoad);
        window.removeEventListener('deuda:updated', this._onLoad);
        window.removeEventListener('deuda:deleted', this._onLoad);
        window.removeEventListener('data-imported', this._onLoad);
        window.removeEventListener('deuda:edit', this._onEdit);
    }

    addEventListeners() {
        this._onMonth = (event) => {
            this.mes = event.detail.mes;
            this.loadDebts();
        };
        this._onGroup = (event) => {
            this.groupBy = event.detail.groupBy || 'none';
            this.renderTable();
        };
        this._onLoad = () => this.loadDebts();
        this._onEdit = (e) => this.editDebt(e.detail);

        window.addEventListener('ui:month', this._onMonth);
        window.addEventListener('ui:group', this._onGroup);
        window.addEventListener('deuda:saved', this._onLoad);
        window.addEventListener('deuda:updated', this._onLoad);
        window.addEventListener('deuda:deleted', this._onLoad);
        window.addEventListener('data-imported', this._onLoad);
        window.addEventListener('deuda:edit', this._onEdit);
    }

    async loadDebts() {
        if (!this.mes) this.mes = new Date().toISOString().slice(0, 7);
        const debts = await this.listByMes(this.mes);
        this.debts = debts;
        console.log('[DebtList] Deudas cargadas:', debts); // Debug: muestra las deudas recuperadas
        await this.loadTotals();
        this.renderTable();
    }

    async loadTotals() {
        // Consulta los montos originales desde el repository y calcula los totales
        const { countMontosByMes } = await import('../../montos/montoRepository.js');
        const { totalesPendientes, totalesPagados } = await countMontosByMes({ mes: this.mes });
        this.totalesPendientes = totalesPendientes;
        this.totalesPagados = totalesPagados;
    }

    async listByMes(mes) {
        // Usa montoRepository para consultar montos por periodo 'YYYY-MM' y agrupar por deuda
        const { listMontos } = await import('../../montos/montoRepository.js');
        const { getDeuda } = await import('../deudaRepository.js');
        const montos = await listMontos({ mes }); // mes es 'YYYY-MM'
        const deudaIds = [...new Set(montos.map(m => m.deudaId))];
        const deudas = [];
        for (const id of deudaIds) {
            const deuda = await getDeuda(id);
            if (!deuda) continue;
            deuda.montos = montos.filter(m => m.deudaId === id);
            deudas.push(deuda);
        }
        return deudas;
    }

    renderTable() {
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

        // Mapear datos de la tabla enriqueciendo con callbacks
        const tableData = allMontos.map(row => {
            const entry = {
                ...row,
                _fmtMoneda: this.fmtMoneda.bind(this),
                _onDetail: async (monto, opener) => {
                    const detailModal = document.querySelector('app-shell #debtDetailModal')
                        || document.getElementById('debtDetailModal');
                    if (!detailModal) return;
                    const { getDeuda } = await import('../deudaRepository.js');
                    const deudaActualizada = await getDeuda(monto.deudaId);
                    detailModal.openDetail(deudaActualizada);
                    detailModal.attachOpener(opener || null);
                },
                _onEdit: async (monto) => {
                    const { getDeuda } = await import('../deudaRepository.js');
                    const deuda = await getDeuda(monto.deudaId);
                    window.dispatchEvent(new CustomEvent('deuda:edit', { detail: deuda }));
                },
                _reload: this.loadDebts.bind(this)
            };
            entry._onRowClick = (monto, opener) => entry._onDetail(monto, opener || null);
            return entry;
        });

        const container = this.querySelector('.debt-list-container');

        if (this.groupBy !== 'none') {
            // Vista agrupada: usa AppTable (columnas configuradas por debtTableColumns)
            let columns = [...debtTableColumns];
            let hiddenKeys = ['acciones', 'vencimiento'];
            if (this.groupBy === 'vencimiento') hiddenKeys = ['acciones'];
            columns = columns.filter(col => !hiddenKeys.includes(col.key));
            if (this._excludeColumns && this._excludeColumns.length) {
                columns = columns.filter(col => !this._excludeColumns.includes(col.key));
            }

            if (!container.querySelector('app-table')) container.innerHTML = '';
            let table = container.querySelector('app-table');
            if (!table) {
                table = document.createElement('app-table');
                container.appendChild(table);
            }
            table.columnsConfig = columns;
            table.tableData = tableData;
        } else {
            // Vista sin agrupamiento: usa DebtRowItem por fila en tabla responsiva
            if (container.querySelector('app-table')) container.innerHTML = '';
            this._renderRowTable(container, tableData);
        }
    }

    // Renderiza una tabla Bootstrap con <debt-row-item> por fila.
    // Las celdas del componente usan d-table-cell/d-md-none y d-none/d-md-table-cell
    // para mostrar el layout de card en mobile y columnas en desktop.
    _renderRowTable(container, tableData) {
        let tableWrapper = container.querySelector('.table-responsive');
        let thead, tbody;

        if (!tableWrapper) {
            container.innerHTML = '';
            tableWrapper = document.createElement('div');
            tableWrapper.className = 'table-responsive';

            const table = document.createElement('table');
            table.className = 'table table-hover table-striped mb-0';

            thead = document.createElement('thead');
            thead.className = 'table-light';

            tbody = document.createElement('tbody');
            table.appendChild(thead);
            table.appendChild(tbody);
            tableWrapper.appendChild(table);
            container.appendChild(tableWrapper);
        } else {
            thead = tableWrapper.querySelector('thead');
            tbody = tableWrapper.querySelector('tbody');
        }

        // Reconstruir cabecera (puede cambiar si varían excludeColumns)
        thead.innerHTML = '';
        thead.appendChild(this._buildTheadRow());

        // Reconstruir filas
        tbody.innerHTML = '';

        if (tableData.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 99;
            td.className = 'text-muted text-center py-4';
            td.textContent = 'No hay cuotas para este mes.';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        tableData.forEach(row => {
            const rowItem = document.createElement('debt-row-item');
            rowItem.excludeColumns = this._excludeColumns || [];
            rowItem.showDetailAction = this._showDetailAction;
            rowItem.rowData = row; // dispara _render en connectedCallback
            tbody.appendChild(rowItem);
        });
    }

    // Construye el <tr> del <thead> con cabeceras responsivas Bootstrap.
    _buildTheadRow() {
        const tr = document.createElement('tr');
        const excl = this._excludeColumns || [];

        // Cabeceras mobile (2 columnas: info + pago)
        const thInfo = document.createElement('th');
        thInfo.className = 'd-table-cell d-md-none';
        thInfo.textContent = 'Gasto';
        tr.appendChild(thInfo);

        const thPago = document.createElement('th');
        thPago.className = 'd-table-cell d-md-none text-end';
        thPago.textContent = 'Pago';
        tr.appendChild(thPago);

        // Cabeceras desktop (columnas individuales)
        const desktopCols = [
            { label: 'Acreedor', key: 'acreedor' },
            { label: 'Tipo', key: 'tipoDeuda' },
            { label: 'Vencimiento', key: 'vencimiento' },
            { label: 'Monto', key: 'monedaymonto' },
            { label: 'Pagado', key: 'acciones' },
        ];

        desktopCols.forEach(({ label, key }) => {
            if (excl.includes(key)) return;
            const th = document.createElement('th');
            th.className = 'd-none d-md-table-cell';
            th.textContent = label;
            tr.appendChild(th);
        });

        return tr;
    }

    toggleEstado(id) {
        const debt = this.debts.find(d => d.id === id);
        debt.estadoPagada = !debt.estadoPagada;
        window.db.updateDeuda(debt);
        this.renderTable();
    }

    async editDebt(deuda) {
        const editModal = document.querySelector('app-shell #debtModal')
            || document.getElementById('debtModal');
        if (!editModal || !deuda) return;
        editModal.openEdit(deuda);
        editModal.attachOpener();
    }

    deleteDebt(id, acreedor, monto, vencimiento, periodo, moneda) {
        const montoFmt = this.fmtMoneda(moneda, monto);
        if (!confirm(`¿Seguro que quieres borrar los ${montoFmt} que le debes a "${acreedor}"?\nVencimiento: ${vencimiento} | Periodo: ${periodo}`)) return;
        import('../../montos/montoRepository.js').then(({ deleteMonto }) => {
            deleteMonto(id).then(() => {
                this.loadDebts(); // Actualiza la tabla tras borrar
            });
        });
    }

    fmtMoneda(moneda, n) {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(n);
    }

    render() {
        this.innerHTML = '<div class="debt-list-container"></div>';
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
            // Separar por estado pagado
            key += `__${monto.pagado ? 'pagado' : 'pendiente'}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(monto);
        });
        // Devuelve un array donde cada elemento es un resumen del grupo
        return Object.entries(grouped).map(([group, items]) => {
            const total = items.reduce((sum, m) => sum + (Number(m.monto) || 0), 0);
            const acreedores = [...new Set(items.map(m => m.acreedor))].join(', ');
            const tipos = [...new Set(items.map(m => m.tipoDeuda))].join(', ');
            const vencimientos = [...new Set(items.map(m => m.vencimiento))].join(', ');
            const moneda = items[0].moneda;
            let groupLabel = group;
            let pagado = items[0].pagado;
            if (group.includes('__')) {
                const parts = group.split('__');
                groupLabel = parts[0];
                pagado = parts[parts.length - 1] === 'pagado';
            }
            return {
                ...items[0],
                monto: total,
                groupLabel,
                items: items,
                acreedor: (groupBy !== 'acreedor') ? acreedores : groupLabel,
                tipoDeuda: (groupBy !== 'tipo') ? tipos : groupLabel,
                vencimiento: (groupBy !== 'vencimiento') ? vencimientos : groupLabel,
                moneda,
                pagado
            };
        });
    }
}

customElements.define('debt-list', DebtList);
