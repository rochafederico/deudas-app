// src/features/deudas/components/DebtRowItem.js
// Web Component que representa una fila de deuda con diseño responsivo Bootstrap.
// En mobile (< md): 2 celdas — info (avatar + nombre + tipo + fecha) y acciones (monto + badge + toggle).
// En desktop (md+): celdas individuales por columna — acreedor, tipo, vencimiento, monto, toggle.

import '../../../shared/components/AppCheckbox.js';
import { formatMoneda } from '../../../shared/config/monedas.js';

// ── Helpers exportados (usados también en tests) ──────────────────────────────

export function getInitials(name) {
    const parts = (name || '').trim().split(/\s+/).filter(p => p.length > 0);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return '';
}

export function getAvatarClasses(name) {
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

export function getTipoIcon(tipo) {
    const t = (tipo || '').toLowerCase();
    if (t.includes('alquiler')) return 'bi-house';
    if (t.includes('préstamo') || t.includes('prestamo')) return 'bi-bank2';
    if (t.includes('tarjeta')) return 'bi-credit-card';
    if (t.includes('servicio')) return 'bi-tools';
    return 'bi-tag';
}

export function getEstado(row) {
    if (row?.pagado) return { label: 'Pagado', className: 'text-bg-success' };
    const v = String(row?.vencimiento ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const today = new Date().toISOString().slice(0, 10);
    if (v < today) return { label: 'Vencido', className: 'text-bg-danger' };
    if (v === today) return { label: 'Vence hoy', className: 'text-bg-warning' };
    return null;
}

// ── Componente ────────────────────────────────────────────────────────────────

export class DebtRowItem extends HTMLElement {
    connectedCallback() {
        // display:contents hace que el elemento sea transparente al layout de la tabla,
        // por lo que el <tr> interno aparece como hijo directo del <tbody>.
        this.style.display = 'contents';
        if (this._rowData) this._render();
    }

    set rowData(data) {
        this._rowData = data;
        if (this.isConnected) this._render();
    }

    get rowData() {
        return this._rowData;
    }

    set excludeColumns(arr) {
        this._excludeColumns = arr || [];
    }

    set showDetailAction(val) {
        this._showDetailAction = !!val;
    }

    _render() {
        this.innerHTML = '';
        const row = this._rowData;
        if (!row) return;
        const excl = this._excludeColumns || [];

        // ── Estado badges (mobile + desktop compartidos) ──────────────
        const mobileBadgeDiv = document.createElement('div');
        const desktopBadgeDiv = document.createElement('div');
        desktopBadgeDiv.className = 'mt-1';

        const renderEstadoMobile = () => {
            mobileBadgeDiv.innerHTML = '';
            const estado = getEstado(row);
            if (!estado) return;
            const b = document.createElement('span');
            b.className = `badge ${estado.className} text-nowrap`;
            b.textContent = estado.label;
            mobileBadgeDiv.appendChild(b);
        };

        const renderEstadoDesktop = () => {
            desktopBadgeDiv.innerHTML = '';
            const estado = getEstado(row);
            if (!estado) { desktopBadgeDiv.classList.add('d-none'); return; }
            desktopBadgeDiv.classList.remove('d-none');
            const b = document.createElement('span');
            b.className = `badge ${estado.className} text-nowrap`;
            b.textContent = estado.label;
            desktopBadgeDiv.appendChild(b);
        };

        // Exponer callbacks para sincronización externa (ej. debtTableColumns en vista agrupada)
        row._renderEstadoPago = () => { renderEstadoMobile(); renderEstadoDesktop(); };
        row._renderEstadoPagoCard = () => { renderEstadoMobile(); renderEstadoDesktop(); };

        renderEstadoMobile();
        renderEstadoDesktop();

        // ── Checkboxes (mobile + desktop) — se sincronizan entre sí ──────
        const cbMobile = document.createElement('app-checkbox');
        cbMobile.inputId = `debt-m-${row.id ?? Math.random().toString(36).slice(2)}`;
        cbMobile.checked = !!row.pagado;
        cbMobile.title = 'Marcar como pagado';

        const cbDesktop = document.createElement('app-checkbox');
        cbDesktop.inputId = `debt-d-${row.id ?? Math.random().toString(36).slice(2)}`;
        cbDesktop.checked = !!row.pagado;
        cbDesktop.title = 'Marcar como pagado';

        const syncChecked = (val) => {
            cbMobile.checked = val;
            cbDesktop.checked = val;
        };

        const handleToggle = async (e) => {
            const nextChecked = !!e.detail.checked;
            const previousChecked = !!row.pagado;
            row.pagado = nextChecked;
            syncChecked(nextChecked);
            renderEstadoMobile();
            renderEstadoDesktop();
            try {
                const { setPagado } = await import('../../montos/montoRepository.js');
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
                syncChecked(previousChecked);
                renderEstadoMobile();
                renderEstadoDesktop();
                window.dispatchEvent(new CustomEvent('app:notify', {
                    detail: {
                        message: '❌ No pudimos actualizar el estado de pago. Intentá de nuevo.',
                        type: 'danger'
                    }
                }));
            }
        };

        cbMobile.addEventListener('checkbox-change', handleToggle);
        cbDesktop.addEventListener('checkbox-change', handleToggle);

        // ── Fila principal ────────────────────────────────────────────
        const tr = document.createElement('tr');
        if (typeof row._onRowClick === 'function') {
            tr.classList.add('cursor-pointer');
            tr.addEventListener('click', () => row._onRowClick(row, tr));
        }

        // ── MOBILE COL 1: info (avatar + nombre + tipo + fecha) ───────
        const tdInfo = document.createElement('td');
        tdInfo.className = 'd-table-cell d-md-none py-3';

        const infoFlex = document.createElement('div');
        infoFlex.className = 'd-flex align-items-center gap-3';

        const avatar = document.createElement('div');
        avatar.className = `debt-card-avatar d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-semibold ${getAvatarClasses(row.acreedor)}`;
        avatar.textContent = getInitials(row.acreedor);
        infoFlex.appendChild(avatar);

        const nameBlock = document.createElement('div');
        nameBlock.className = 'flex-grow-1 min-w-0';

        const nameEl = document.createElement('div');
        nameEl.className = 'fw-semibold text-truncate';
        nameEl.textContent = row.acreedor ?? '';
        nameBlock.appendChild(nameEl);

        const tipo = String(row.tipoDeuda ?? '').trim();
        if (tipo && !excl.includes('tipoDeuda')) {
            const tipoBadge = document.createElement('span');
            tipoBadge.className = 'badge rounded-pill bg-light text-secondary border fw-normal mt-1 d-inline-block';
            tipoBadge.innerHTML = `<i class="bi ${getTipoIcon(tipo)} me-1" aria-hidden="true"></i>${tipo}`;
            nameBlock.appendChild(tipoBadge);
        }

        const venc = String(row.vencimiento ?? '').trim();
        if (venc) {
            const vencEl = document.createElement('div');
            vencEl.className = 'text-muted small mt-1';
            vencEl.innerHTML = `<i class="bi bi-calendar3 me-1" aria-hidden="true"></i>${venc}`;
            nameBlock.appendChild(vencEl);
        }

        infoFlex.appendChild(nameBlock);
        tdInfo.appendChild(infoFlex);
        tr.appendChild(tdInfo);

        // ── MOBILE COL 2: acciones (monto + badge + toggle + chevron) ─
        const tdMActions = document.createElement('td');
        tdMActions.className = 'd-table-cell d-md-none text-end align-top py-3';
        tdMActions.addEventListener('click', e => e.stopPropagation());

        const mActWrap = document.createElement('div');
        mActWrap.className = 'd-flex flex-column align-items-end gap-1';

        const amountEl = document.createElement('div');
        amountEl.className = 'fw-semibold text-nowrap';
        amountEl.textContent = formatMoneda(row.monto, row.moneda);
        mActWrap.appendChild(amountEl);
        mActWrap.appendChild(mobileBadgeDiv);
        mActWrap.appendChild(cbMobile);

        if (typeof row._onRowClick === 'function') {
            const chevron = document.createElement('i');
            chevron.className = 'bi bi-chevron-right text-muted small';
            chevron.setAttribute('aria-hidden', 'true');
            mActWrap.appendChild(chevron);
        }

        tdMActions.appendChild(mActWrap);
        tr.appendChild(tdMActions);

        // ── DESKTOP COLS (d-none d-md-table-cell) ─────────────────────

        // Acreedor
        const tdAcreedor = document.createElement('td');
        tdAcreedor.className = 'd-none d-md-table-cell fw-semibold align-middle';
        tdAcreedor.textContent = row.acreedor ?? '';
        tr.appendChild(tdAcreedor);

        // Tipo (si no está excluido)
        if (!excl.includes('tipoDeuda')) {
            const tdTipo = document.createElement('td');
            tdTipo.className = 'd-none d-md-table-cell align-middle';
            tdTipo.textContent = row.tipoDeuda ?? '';
            tr.appendChild(tdTipo);
        }

        // Vencimiento
        const tdVenc = document.createElement('td');
        tdVenc.className = 'd-none d-md-table-cell align-middle';
        tdVenc.textContent = row.vencimiento ?? '';
        tr.appendChild(tdVenc);

        // Monto + badge de estado
        const tdMonto = document.createElement('td');
        tdMonto.className = 'd-none d-md-table-cell align-middle';
        const montoWrap = document.createElement('div');
        montoWrap.className = 'd-flex flex-column align-items-start';
        const montoSpan = document.createElement('span');
        montoSpan.className = 'text-nowrap';
        montoSpan.textContent = formatMoneda(row.monto, row.moneda);
        montoWrap.appendChild(montoSpan);
        montoWrap.appendChild(desktopBadgeDiv);
        tdMonto.appendChild(montoWrap);
        tr.appendChild(tdMonto);

        // Toggle + botón ver (si showDetailAction)
        const tdToggle = document.createElement('td');
        tdToggle.className = 'd-none d-md-table-cell align-middle';
        tdToggle.addEventListener('click', e => e.stopPropagation());

        const toggleWrap = document.createElement('div');
        toggleWrap.className = 'd-flex align-items-center justify-content-end gap-2';
        toggleWrap.appendChild(cbDesktop);

        if (this._showDetailAction && typeof row._onDetail === 'function') {
            const eyeBtn = document.createElement('button');
            eyeBtn.type = 'button';
            eyeBtn.className = 'btn btn-sm btn-outline-secondary';
            eyeBtn.setAttribute('aria-label', `Ver detalle de ${row.acreedor || ''}`);
            eyeBtn.innerHTML = '<i class="bi bi-eye" aria-hidden="true"></i>';
            eyeBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await row._onDetail(row, eyeBtn);
            });
            toggleWrap.appendChild(eyeBtn);
        }

        tdToggle.appendChild(toggleWrap);
        tr.appendChild(tdToggle);

        this.appendChild(tr);
    }
}

customElements.define('debt-row-item', DebtRowItem);
