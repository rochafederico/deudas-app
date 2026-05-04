import '../../../shared/components/AppButton.js';
import '../../../shared/components/AppTable.js';
import { debtTableColumns } from '../../../shared/config/tables/debtTableColumns.js';
import './DebtDetailModal.js';
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

        // Definir columnas para AppTable, ocultando 'Acciones' y 'Pagado' si hay agrupamiento
        let columns = [...debtTableColumns];
        // Filtrar columnas 'Acciones' y 'vencimiento' si hay agrupamiento, pero mostrar 'vencimiento' solo si el agrupamiento es por 'vencimiento'
        if (this.groupBy !== 'none') {
            let hiddenKeys = ['acciones', 'vencimiento'];
            if (this.groupBy === 'vencimiento') {
                hiddenKeys = ['acciones'];
            }
            columns = columns.filter(col => !hiddenKeys.includes(col.key));
        }
        // Filtrar columnas excluidas via atributo exclude-columns
        if (this._excludeColumns && this._excludeColumns.length) {
            columns = columns.filter(col => !this._excludeColumns.includes(col.key));
        }

        // Agregar columna de acción "ver deuda" si se solicitó explícitamente
        if (this._showDetailAction) {
            columns = [...columns, {
                key: 'ver-deuda',
                label: '',
                opts: { classCss: 'd-none d-md-table-cell' },
                render: row => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'btn btn-sm btn-outline-secondary';
                    btn.setAttribute('aria-label', `Ver detalle de ${row.acreedor || ''}`);
                    btn.innerHTML = '<i class="bi bi-eye" aria-hidden="true"></i>';
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (typeof row._onDetail === 'function') {
                            row._onDetail(row, btn);
                        }
                    });
                    return btn;
                }
            }];
        }

        // Mapear datos de la tabla
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

        // Renderizar AppTable
        let table = this.querySelector('app-table');
        if (!table) {
            table = document.createElement('app-table');
            this.appendChild(table);
        }
        table.columnsConfig = columns;
        table.tableData = tableData;

        this._renderTotals();
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

    _renderTotals() {
        let totalsEl = this.querySelector('.debt-list-totals');
        if (!totalsEl) return;

        const pendiente = this.totalesPendientes || {};
        const pagado = this.totalesPagados || {};
        const currencies = new Set([...Object.keys(pendiente), ...Object.keys(pagado)]);

        if (currencies.size === 0) {
            totalsEl.innerHTML = '';
            return;
        }

        const fmt = (moneda, n) => this.fmtMoneda(moneda, n || 0);

        const pendienteItems = [...currencies]
            .filter(m => Number(pendiente[m]) > 0)
            .map(m => `<span class="badge text-bg-warning me-1">${fmt(m, pendiente[m])}</span>`)
            .join('');
        const pagadoItems = [...currencies]
            .filter(m => Number(pagado[m]) > 0)
            .map(m => `<span class="badge text-bg-success me-1">${fmt(m, pagado[m])}</span>`)
            .join('');

        if (!pendienteItems && !pagadoItems) {
            totalsEl.innerHTML = '';
            return;
        }

        totalsEl.innerHTML = `
            <div class="d-flex flex-wrap justify-content-end align-items-center gap-3 px-3 py-2 border-top text-end">
                ${pendienteItems ? `<div class="d-flex align-items-center gap-1"><span class="text-muted small me-1">Pendiente:</span>${pendienteItems}</div>` : ''}
                ${pagadoItems ? `<div class="d-flex align-items-center gap-1"><span class="text-muted small me-1">Pagado:</span>${pagadoItems}</div>` : ''}
            </div>
        `;
    }

    render() {
        this.innerHTML = `
            <app-table></app-table>
            <div class="debt-list-totals"></div>
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
