import '../../../shared/components/AppButton.js';
import '../../../shared/components/AppTable.js';
import '../../../shared/components/AppCheckbox.js';
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

        // Renderizar vista móvil (cards) y vista escritorio (tabla)
        let mobileSection = this.querySelector('.debt-mobile-cards');
        if (!mobileSection) {
            mobileSection = document.createElement('div');
            mobileSection.className = 'debt-mobile-cards d-md-none';
            this.insertBefore(mobileSection, this.querySelector('.debt-table-wrapper'));
        }
        mobileSection.replaceChildren(this._renderMobileCards(tableData));

        let tableWrapper = this.querySelector('.debt-table-wrapper');
        let table = tableWrapper ? tableWrapper.querySelector('app-table') : null;
        if (!table) {
            if (!tableWrapper) {
                tableWrapper = document.createElement('div');
                tableWrapper.className = 'debt-table-wrapper d-none d-md-block';
                this.appendChild(tableWrapper);
            }
            table = document.createElement('app-table');
            tableWrapper.appendChild(table);
        }
        table.columnsConfig = columns;
        table.tableData = tableData;
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
        this.innerHTML = `
            <div class="debt-mobile-cards d-md-none"></div>
            <div class="debt-table-wrapper d-none d-md-block"><app-table></app-table></div>
        `;
    }

    _getInitials(name) {
        const parts = (name || '').trim().split(/\s+/).filter(p => p.length > 0);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return '';
    }

    _getAvatarStyle(name) {
        const palettes = [
            'bg-danger-subtle text-danger-emphasis',
            'bg-warning-subtle text-warning-emphasis',
            'bg-success-subtle text-success-emphasis',
            'bg-primary-subtle text-primary-emphasis',
            'bg-info-subtle text-info-emphasis',
            'bg-secondary-subtle text-secondary-emphasis',
            'bg-dark-subtle text-dark-emphasis',
        ];
        return palettes[(name?.charCodeAt(0) || 0) % palettes.length];
    }

    _getTipoIcon(tipo) {
        const t = (tipo || '').toLowerCase();
        if (t.includes('alquiler')) return 'bi-house';
        if (t.includes('préstamo') || t.includes('prestamo')) return 'bi-bank2';
        if (t.includes('tarjeta')) return 'bi-credit-card';
        if (t.includes('servicio')) return 'bi-tools';
        return 'bi-tag';
    }

    _getCardEstado(row) {
        if (row.pagado) return { label: 'Pagado', className: 'text-bg-success' };
        const v = String(row.vencimiento ?? '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
        const today = new Date().toISOString().slice(0, 10);
        if (v < today) return { label: 'Vencido', className: 'text-bg-danger' };
        if (v === today) return { label: 'Vence hoy', className: 'text-bg-warning' };
        return null;
    }

    _renderMobileCards(tableData) {
        const container = document.createElement('div');
        container.className = 'd-flex flex-column gap-2';

        if (tableData.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'text-muted text-center py-4 mb-0';
            empty.textContent = 'No hay cuotas para este mes.';
            container.appendChild(empty);
            return container;
        }

        tableData.forEach(row => {
            const card = document.createElement('div');
            card.className = 'card border-0 shadow-sm rounded-3';
            if (typeof row._onRowClick === 'function') {
                card.classList.add('cursor-pointer');
                card.addEventListener('click', () => row._onRowClick(row, card));
            }

            const body = document.createElement('div');
            body.className = 'card-body px-3 py-3';

            const flex = document.createElement('div');
            flex.className = 'd-flex align-items-center gap-3';

            // Avatar
            const avClasses = this._getAvatarStyle(row.acreedor);
            const avatar = document.createElement('div');
            avatar.className = `debt-card-avatar d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-semibold ${avClasses}`;
            avatar.textContent = this._getInitials(row.acreedor);
            flex.appendChild(avatar);

            // Info column
            const info = document.createElement('div');
            info.className = 'flex-grow-1 min-w-0';

            const nameLine = document.createElement('div');
            nameLine.className = 'fw-semibold text-truncate';
            nameLine.textContent = row.acreedor ?? '';
            info.appendChild(nameLine);

            const tipoDeuda = String(row.tipoDeuda ?? '').trim();
            if (tipoDeuda) {
                const tipoWrap = document.createElement('div');
                tipoWrap.className = 'mt-1';
                const tipoBadge = document.createElement('span');
                tipoBadge.className = 'badge rounded-pill bg-light text-secondary border fw-normal';
                tipoBadge.innerHTML = `<i class="bi ${this._getTipoIcon(tipoDeuda)} me-1" aria-hidden="true"></i>${tipoDeuda}`;
                tipoWrap.appendChild(tipoBadge);
                info.appendChild(tipoWrap);
            }

            const vencimiento = String(row.vencimiento ?? '').trim();
            if (vencimiento) {
                const vencLine = document.createElement('div');
                vencLine.className = 'text-muted small mt-1';
                vencLine.innerHTML = `<i class="bi bi-calendar3 me-1" aria-hidden="true"></i>${vencimiento}`;
                info.appendChild(vencLine);
            }

            flex.appendChild(info);

            // Right column: amount, estado badge, toggle, chevron
            const rightCol = document.createElement('div');
            rightCol.className = 'd-flex flex-column align-items-end flex-shrink-0 gap-1';
            rightCol.addEventListener('click', e => e.stopPropagation());

            const amountDiv = document.createElement('div');
            amountDiv.className = 'fw-semibold text-nowrap';
            amountDiv.textContent = this.fmtMoneda(row.moneda, row.monto);
            rightCol.appendChild(amountDiv);

            // Estado badge (keeps in sync with toggle)
            const estadoDiv = document.createElement('div');
            const renderEstadoCard = () => {
                estadoDiv.innerHTML = '';
                const estado = this._getCardEstado(row);
                if (estado) {
                    const badge = document.createElement('span');
                    badge.className = `badge ${estado.className} text-nowrap`;
                    badge.textContent = estado.label;
                    estadoDiv.appendChild(badge);
                }
            };
            row._renderEstadoPagoCard = renderEstadoCard;
            renderEstadoCard();
            rightCol.appendChild(estadoDiv);

            // Toggle (app-checkbox)
            const checkId = `card-cb-${row.id != null ? row.id : Math.random().toString(36).slice(2)}`;
            const appCheckbox = document.createElement('app-checkbox');
            appCheckbox.inputId = checkId;
            appCheckbox.checked = !!row.pagado;
            appCheckbox.title = 'Marcar como pagado';
            appCheckbox.addEventListener('checkbox-change', async (e) => {
                const { setPagado } = await import('../../montos/montoRepository.js');
                const nextChecked = !!e.detail.checked;
                const previousChecked = !!row.pagado;
                row.pagado = nextChecked;
                renderEstadoCard();
                if (typeof row._renderEstadoPago === 'function') row._renderEstadoPago();
                try {
                    await setPagado(row.id, nextChecked);
                    window.dispatchEvent(new CustomEvent('app:notify', {
                        detail: {
                            message: nextChecked
                                ? '✅ Cuota marcada como pagada.'
                                : '⚠️ Cuota marcada como pendiente.',
                            type: nextChecked ? 'success' : 'warning'
                        }
                    }));
                    if (typeof row._reload === 'function') row._reload();
                } catch {
                    row.pagado = previousChecked;
                    appCheckbox.checked = previousChecked;
                    renderEstadoCard();
                    if (typeof row._renderEstadoPago === 'function') row._renderEstadoPago();
                    window.dispatchEvent(new CustomEvent('app:notify', {
                        detail: {
                            message: '❌ No pudimos actualizar el estado de pago. Intentá de nuevo.',
                            type: 'danger'
                        }
                    }));
                }
            });
            rightCol.appendChild(appCheckbox);

            // Chevron (visual affordance for detail navigation)
            if (typeof row._onRowClick === 'function') {
                const chevron = document.createElement('i');
                chevron.className = 'bi bi-chevron-right text-muted small';
                chevron.setAttribute('aria-hidden', 'true');
                rightCol.appendChild(chevron);
            }

            flex.appendChild(rightCol);
            body.appendChild(flex);
            card.appendChild(body);
            container.appendChild(card);
        });

        return container;
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
