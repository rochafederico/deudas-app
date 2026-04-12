import { DeudaModel } from '../DeudaModel.js';
import { el } from '../../../shared/utils/dom.js';
import monedas from '../../../shared/config/monedas.js';
import '../../../shared/components/AppButton.js';
import '../../../shared/components/AppCheckbox.js';
import '../../../shared/components/AppInput.js';
import '../../../shared/components/AppForm.js';
import {
    trackFlowStart,
    trackFlowComplete,
    trackFlowError,
    trackFlowAbandoned,
    updateFlowStep
} from '../../../shared/observability/index.js';

export class DebtForm extends HTMLElement {
    constructor() {
        super();
        this.montos = [];
        this.editing = false;
        this.deudaId = null;
        this._analyticsFlow = null;
        this._analyticsStep = 'form';
        this._analyticsCompleted = false;
        this._analyticsStartedFor = null;
        // Inline editing state: null = no inline open, 'new' = adding, number = editing existing
        this._inlineEditIdx = null;
        this._inlineEditOrig = null;
    }

    connectedCallback() {
        this.classList.add('d-block');
        if (!this._rendered) {
            this._rendered = true;
            this.render();
            this.montosTbody = this.querySelector('#montos-tbody');
        }
        this._addMontoBtn = this.querySelector('#add-monto');
        this._onAddMontoClick = (event) => {
            event.stopPropagation();
            this.startAnalyticsFlow(this._getFlowName(), { step: 'monto_list' });
            this.openInlineAdd();
        };
        this._addMontoBtn.removeEventListener('click', this._onAddMontoClick);
        this._addMontoBtn.addEventListener('click', this._onAddMontoClick);
        // Re-attach form listeners on every (re)connect so they survive DOM moves
        this.form = this.querySelector('app-form');
        this._onSubmit = this.handleSubmit.bind(this);
        this._onCancel = () => this.reset();
        this._onValidationError = (event) => {
            const flowName = this._analyticsFlow || this._getFlowName();
            this.startAnalyticsFlow(flowName, { step: this._analyticsStep });
            trackFlowError(flowName, {
                step: this._analyticsStep,
                errors: event.detail.errors
            });
        };
        this._onInteraction = () => this.startAnalyticsFlow(this._getFlowName(), { step: this._analyticsStep });
        this.form.addEventListener('deuda:submit', this._onSubmit);
        this.form.addEventListener('form:cancel', this._onCancel);
        this.form.addEventListener('form:validation-error', this._onValidationError);
        this.form.addEventListener('input', this._onInteraction);
        this.form.addEventListener('change', this._onInteraction);
        this.renderMontosList();
    }

    disconnectedCallback() {
        if (this.form) {
            this.form.removeEventListener('deuda:submit', this._onSubmit);
            this.form.removeEventListener('form:cancel', this._onCancel);
            this.form.removeEventListener('form:validation-error', this._onValidationError);
            this.form.removeEventListener('input', this._onInteraction);
            this.form.removeEventListener('change', this._onInteraction);
        }
        if (this._addMontoBtn) {
            this._addMontoBtn.removeEventListener('click', this._onAddMontoClick);
        }
    }

    render() {
        // Formulario principal con <app-form>
        const form = document.createElement('app-form');
        form.fields = [
            { name: 'acreedor', type: 'text', label: 'Acreedor', required: true },
            { name: 'tipoDeuda', type: 'text', label: 'Tipo de Deuda' },
            { name: 'notas', type: 'textarea', label: 'Notas' }
        ];
        form.submitText = 'Guardar';
        form.cancelText = 'Cancelar';
        // Usar evento personalizado para submit SOLO una vez
        form.addEventListener('form:submit', e => {
            form.dispatchEvent(new CustomEvent('deuda:submit', { detail: e.detail, bubbles: true, composed: true }));
        });
        // Restaurar el listener para cancelar
        form.addEventListener('form:cancel', () => this.reset());
        // Lista de montos y botón para agregar
        const montosList = el('div', {
            className: 'montos-list mt-3',
            children: [
                el('div', {
                    className: 'd-flex align-items-center justify-content-between mb-2',
                    children: [
                        el('strong', { text: 'Montos' }),
                        el('app-button', { attrs: { id: 'add-monto' }, text: 'Agregar monto' })
                    ]
                }),
                el('div', {
                    className: 'overflow-auto',
                    style: 'min-height: 100px; max-height: 220px;',
                    children: [
                        el('table', {
                            className: 'table table-sm w-100',
                            children: [
                                el('thead', {
                                    children: [
                                        el('tr', {
                                            children: [
                                                el('th', { text: 'Monto' }),
                                                el('th', { text: 'Moneda' }),
                                                el('th', { text: 'Vencimiento' }),
                                                el('th', { text: 'Acciones' })
                                            ]
                                        })
                                    ]
                                }),
                                el('tbody', { attrs: { id: 'montos-tbody' } })
                            ]
                        })
                    ]
                })
            ]
        });
        this.innerHTML = '';
        this.appendChild(form);
        this.appendChild(montosList);
    }

    // Open inline form to add a new monto at the bottom of the table.
    // Rule: only 1 inline open at a time; if one is already open, ask user via confirm().
    openInlineAdd() {
        if (this._inlineEditIdx !== null) {
            if (!confirm('¿Cancelar los cambios actuales?')) return;
            this._inlineEditIdx = null;
            this._inlineEditOrig = null;
        }
        this._analyticsStep = 'add_installment';
        updateFlowStep(this._analyticsFlow || this._getFlowName(), this._analyticsStep);
        this._inlineEditIdx = 'new';
        this._inlineEditOrig = null;
        this.renderMontosList();
        this._focusFirstInlineInput();
    }

    // Open inline form to edit an existing monto at the given index.
    // Rule: only 1 inline open at a time; if one is already open, ask user via confirm().
    openInlineEdit(monto, idx) {
        if (this._inlineEditIdx !== null) {
            if (!confirm('¿Cancelar los cambios actuales?')) return;
            this._inlineEditIdx = null;
            this._inlineEditOrig = null;
        }
        this._analyticsStep = 'edit_installment';
        updateFlowStep(this._analyticsFlow || this._getFlowName(), this._analyticsStep);
        this._inlineEditIdx = idx;
        this._inlineEditOrig = { ...monto };
        this.renderMontosList();
        this._focusFirstInlineInput();
    }

    // Save the currently open inline form.
    _saveInline() {
        const row = this.montosTbody && this.montosTbody.querySelector('.inline-edit-row');
        if (!row) return;
        const montoInput = row.querySelector('input[name="monto"]');
        const monedaSelect = row.querySelector('select[name="moneda"]');
        const vencimientoInput = row.querySelector('input[name="vencimiento"]');
        // Use native HTML validation; stay in edit mode if invalid
        if (!montoInput.reportValidity() || !monedaSelect.reportValidity() || !vencimientoInput.reportValidity()) {
            return;
        }
        const existing = this._inlineEditIdx !== 'new' ? this.montos[this._inlineEditIdx] : null;
        const nuevoMonto = {
            monto: parseFloat(montoInput.value),
            moneda: monedaSelect.value,
            vencimiento: vencimientoInput.value,
            pagado: existing ? (existing.pagado ?? false) : false,
            ...(existing && existing.id !== undefined ? { id: existing.id } : {})
        };
        if (this._inlineEditIdx === 'new') {
            this.montos.push(nuevoMonto);
        } else {
            this.montos[this._inlineEditIdx] = nuevoMonto;
        }
        this._inlineEditIdx = null;
        this._inlineEditOrig = null;
        this.renderMontosList();
    }

    // Cancel the currently open inline form without saving changes.
    _cancelInline() {
        // montos array was never modified during inline editing, just clear the UI state
        this._inlineEditIdx = null;
        this._inlineEditOrig = null;
        this.renderMontosList();
    }

    // Focus the first input/select in the active inline row.
    _focusFirstInlineInput() {
        setTimeout(() => {
            const input = this.montosTbody && this.montosTbody.querySelector('.inline-edit-row input, .inline-edit-row select');
            if (input) input.focus();
        }, 0);
    }

    // Build the inline editing row (used for both add and edit).
    _buildInlineRow(monto) {
        const montoInput = el('input', {
            attrs: {
                type: 'number', name: 'monto', min: '0', required: '',
                class: 'form-control form-control-sm',
                ...(monto ? { value: String(monto.monto) } : {})
            }
        });
        const monedaSelect = el('select', {
            attrs: { name: 'moneda', required: '', class: 'form-select form-select-sm' }
        });
        monedas.forEach(m => {
            const opt = el('option', { text: m, attrs: { value: m } });
            if (monto && monto.moneda === m) opt.selected = true;
            monedaSelect.appendChild(opt);
        });
        const vencInput = el('input', {
            attrs: {
                type: 'date', name: 'vencimiento', required: '',
                class: 'form-control form-control-sm',
                ...(monto ? { value: monto.vencimiento } : {})
            }
        });
        const saveBtn = el('app-button', {
            className: 'save-inline', text: '✓',
            attrs: { title: 'Guardar' },
            on: { click: () => this._saveInline() }
        });
        const cancelBtn = el('app-button', {
            className: 'cancel-inline', text: '✕',
            attrs: { variant: 'secondary', title: 'Cancelar' },
            on: { click: () => this._cancelInline() }
        });
        const tr = el('tr', { className: 'inline-edit-row' });
        tr.appendChild(el('td', { children: [montoInput] }));
        tr.appendChild(el('td', { children: [monedaSelect] }));
        tr.appendChild(el('td', { children: [vencInput] }));
        tr.appendChild(el('td', { children: [el('div', { className: 'd-flex gap-1 align-items-center', children: [saveBtn, cancelBtn] })] }));
        return tr;
    }

    // Duplicate a monto in memory: copies monto/moneda/vencimiento, forces pagado=false.
    // No modal is opened (inline only).
    duplicateMonto(monto) {
        trackFlowStart('duplicate_installment', { step: 'inline_duplicate', deudaId: this.deudaId, source: 'DebtForm' });
        const nuevoMonto = { ...monto, pagado: false };
        delete nuevoMonto.id;
        this.montos.push(nuevoMonto);
        this.renderMontosList();
        const nuevoPeriodo = nuevoMonto.vencimiento ? nuevoMonto.vencimiento.slice(0, 7) : '';
        trackFlowComplete('duplicate_installment', { deudaId: this.deudaId, period: nuevoPeriodo });
    }

    renderMontosList() {
        // Ordenar montos por fecha de vencimiento ascendente
        this.montos.sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));
        this.montosTbody.innerHTML = '';
        this.montos.forEach((monto, idx) => {
            if (this._inlineEditIdx === idx) {
                // Render inline edit row for this existing monto
                this.montosTbody.appendChild(this._buildInlineRow(monto));
                return;
            }
            const tr = el('tr');
            const cells = [
                { text: monto.monto },
                { text: monto.moneda },
                { text: monto.vencimiento },
                {
                    children: [
                        el('div', {
                            className: 'd-flex gap-1 align-items-center',
                            children: [
                                el('app-button', {
                                    className: 'edit-monto',
                                    text: '✎',
                                    attrs: { title: 'Editar' },
                                    on: {
                                        click: () => this.openInlineEdit(monto, idx)
                                    }
                                }),
                                el('app-button', {
                                    className: 'delete-monto',
                                    text: '×',
                                    attrs: { variant: 'delete', title: 'Eliminar' },
                                    on: {
                                        click: () => {
                                            if (!confirm('¿Seguro quiere eliminar el monto "' + monto.monto + '"?')) return;
                                            this.montos.splice(idx, 1);
                                            this.renderMontosList();
                                        }
                                    }
                                }),
                                el('app-button', {
                                    className: 'duplicate-monto',
                                    text: '⧉',
                                    attrs: { variant: 'success', title: 'Duplicar' },
                                    on: {
                                        click: () => this.duplicateMonto(monto)
                                    }
                                }),
                                (() => {
                                    const id = `app-checkbox-${monto.id ?? monto.vencimiento ?? idx}`;
                                    const appCheckbox = document.createElement('app-checkbox');
                                    appCheckbox.inputId = id;
                                    appCheckbox.checked = !!monto.pagado;
                                    appCheckbox.title = 'Marcar como pagado';
                                    appCheckbox.addEventListener('checkbox-change', async (e) => {
                                        monto.pagado = e.detail.checked;
                                    });
                                    return appCheckbox;
                                })()
                            ]
                        })
                    ]
                }
            ];
            cells.forEach(cellOpts => tr.appendChild(el('td', cellOpts)));
            this.montosTbody.appendChild(tr);
        });
        // If adding a new monto, append the inline add row at the bottom
        if (this._inlineEditIdx === 'new') {
            this.montosTbody.appendChild(this._buildInlineRow(null));
        }
    }

    load(deuda) {
        this.editing = true;
        this.deudaId = deuda.id;
        this.montos = deuda.montos.map(m => ({ ...m }));
        this._inlineEditIdx = null;
        this._inlineEditOrig = null;
        this.renderMontosList();
        this.startAnalyticsFlow('edit_debt', { step: 'form', deudaId: deuda.id });
        // Precarga los valores en <app-form>
        const form = this.querySelector('app-form');
        if (form) {
            form.initialValues = {
                acreedor: deuda.acreedor || '',
                tipoDeuda: deuda.tipoDeuda || '',
                notas: deuda.notas || ''
            };
        }
    }

    reset(options = {}) {
        const { trackAbandonment = true, reason = 'cancel' } = options;
        if (trackAbandonment) {
            this.abandonAnalyticsFlow(reason);
        } else {
            this.clearAnalyticsFlow();
        }
        this.editing = false;
        this.deudaId = null;
        this.montos = [];
        this._inlineEditIdx = null;
        this._inlineEditOrig = null;
        const form = this.querySelector('app-form');
        if (form) form.initialValues = {};
        this.renderMontosList();
        // Cerrar el modal de deuda si está abierto
        if (this.parentNode && this.parentNode.tagName === 'UI-MODAL' && typeof this.parentNode.close === 'function') {
            this.parentNode.close();
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        const flowName = this._analyticsFlow || this._getFlowName();
        this.startAnalyticsFlow(flowName, { step: 'submit' });
        // Los datos del formulario ya están validados por AppForm
        const values = e.detail;
        // Validar que haya al menos un monto
        if (!this.montos || this.montos.length === 0) {
            this.showFormError('Debe agregar al menos un monto antes de guardar.');
            trackFlowError(flowName, {
                step: 'submit',
                errors: { montos: 'Debe agregar al menos un monto antes de guardar.' }
            });
            return;
        }
        this.clearFormError();
        const deuda = new DeudaModel({
            id: this.editing ? this.deudaId : undefined,
            acreedor: values.acreedor,
            tipoDeuda: values.tipoDeuda,
            notas: values.notas,
            montos: this.montos
        });
        if (this.editing && this.deudaId) {
            const { updateDeuda } = await import('../deudaRepository.js');
            await updateDeuda(deuda);
            this.dispatchEvent(new CustomEvent('deuda:updated', { detail: deuda, bubbles: true, composed: true }));
            await trackFlowComplete('edit_debt', { deudaId: this.deudaId, montosCount: this.montos.length });
        } else {
            const { addDeuda } = await import('../deudaRepository.js');
            const deudaId = await addDeuda(deuda);
            deuda.id = deudaId;
            this.dispatchEvent(new CustomEvent('deuda:saved', { detail: deuda, bubbles: true, composed: true }));
            await trackFlowComplete('create_debt', { deudaId, montosCount: this.montos.length });
        }
        this._analyticsCompleted = true;
        this.reset({ trackAbandonment: false });
    }

    showFormError(msg) {
        let err = this.querySelector('#form-error');
        if (!err) {
            err = el('div', {
                attrs: { id: 'form-error' },
                className: 'text-danger my-2'
            });
            const form = this.querySelector('app-form');
            if (form) form.parentNode.insertBefore(err, form);
        }
        err.textContent = msg;
    }

    clearFormError() {
        const err = this.querySelector('#form-error');
        if (err) err.textContent = '';
    }

    startAnalyticsFlow(flowName, metadata = {}) {
        if (!flowName) return;
        this._analyticsFlow = flowName;
        this._analyticsStep = metadata.step || this._analyticsStep || 'form';
        updateFlowStep(flowName, this._analyticsStep, metadata);
        if (this._analyticsStartedFor === flowName) return;
        this._analyticsStartedFor = flowName;
        this._analyticsCompleted = false;
        trackFlowStart(flowName, metadata);
    }

    abandonAnalyticsFlow(reason = 'cancel') {
        if (!this._analyticsFlow || this._analyticsCompleted) {
            this.clearAnalyticsFlow();
            return;
        }
        trackFlowAbandoned(this._analyticsFlow, this._analyticsStep, { deudaId: this.deudaId, reason });
        this.clearAnalyticsFlow();
    }

    clearAnalyticsFlow() {
        this._analyticsFlow = null;
        this._analyticsStep = 'form';
        this._analyticsCompleted = false;
        this._analyticsStartedFor = null;
    }

    _getFlowName() {
        return this.editing ? 'edit_debt' : 'create_debt';
    }
}
customElements.define('debt-form', DebtForm);
