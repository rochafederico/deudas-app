import { DeudaModel } from '../models/DeudaModel.js';
import { el } from '../utils/dom.js';
import './AppButton.js';
import './AppInput.js';
import './AppForm.js';
import './MontoForm.js';
import './DuplicateMontoModal.js';

export class DebtForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.montos = [];
        this.editing = false;
        this.deudaId = null;
    }

    connectedCallback() {
        this.render();
        this.montoModal = this.shadowRoot.getElementById('montoModal');
        this.duplicateModal = this.shadowRoot.getElementById('duplicateMontoModal');
        this.montosTbody = this.shadowRoot.getElementById('montos-tbody');
        this.shadowRoot.getElementById('add-monto').addEventListener('click', (event) => {
            event.stopPropagation();
            this.openMontoModal();
        });
        this.form = this.shadowRoot.querySelector('app-form');
        this._onSubmit = this.handleSubmit.bind(this);
        this._onCancel = () => this.reset();
        this.form.addEventListener('deuda:submit', this._onSubmit);
        this.form.addEventListener('form:cancel', this._onCancel);
        this.renderMontosList();
    }

    disconnectedCallback() {
        if (this.form) {
            this.form.removeEventListener('deuda:submit', this._onSubmit);
            this.form.removeEventListener('form:cancel', this._onCancel);
        }
    }

    render() {
        const style = document.createElement('style');
        style.textContent = `
            .montos-list {
                margin: 10px 0;
                background: var(--panel);
                border-radius: 6px;
                padding: 10px;
            }
            .montos-list table {
                width: 100%;
                border-collapse: collapse;
            }
            .montos-list th, .montos-list td {
                padding: 6px;
                border-bottom: 1px solid var(--border);
            }
            .montos-list tr:last-child td {
                border-bottom: none;
            }
            .btn-monto {
                margin-left: 5px;
            }
        `;
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
            className: 'montos-list',
            children: [
                el('div', {
                    attrs: { style: 'display:flex;align-items:center;justify-content:space-between;' },
                    children: [
                        el('strong', { text: 'Montos' }),
                        el('app-button', { attrs: { id: 'add-monto' }, text: 'Agregar monto' })
                    ]
                }),
                el('table', {
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
        });
        const modal = el('ui-modal', { attrs: { id: 'montoModal' } });
        const duplicateModal = el('ui-modal', { attrs: { id: 'duplicateMontoModal' } });
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(form);
        this.shadowRoot.appendChild(montosList);
        this.shadowRoot.appendChild(modal);
        this.shadowRoot.appendChild(duplicateModal);
    }

    openMontoModal(monto = null, index = null) {
        this.montoEditIndex = index;
        this.montoModal.setTitle(monto ? 'Editar monto' : 'Agregar monto');
        this.montoModal.innerHTML = '';
        const montoForm = document.createElement('monto-form');
        if (monto) montoForm.monto = monto;
        montoForm.addEventListener('monto:save', (e) => {
            const nuevoMonto = e.detail;
            if (index !== null) {
                this.montos[index] = nuevoMonto;
            } else {
                this.montos.push(nuevoMonto);
            }
            this.renderMontosList();
            this.montoModal.close();
        }, { once: true });
        montoForm.addEventListener('monto:cancel', () => this.montoModal.close(), { once: true });
        this.montoModal.appendChild(montoForm);
        this.montoModal.open();
    }

    openDuplicateMontoModal(monto, idx) {
        this.duplicateMontoIndex = idx;
        this.duplicateModal.setTitle('Duplicar monto');
        this.duplicateModal.innerHTML = '';
        const duplicateForm = document.createElement('duplicate-monto-modal');
        duplicateForm.monto = monto;
        duplicateForm.addEventListener('duplicate:save', (e) => {
            const nuevaFecha = e.detail.vencimiento;
            // Calcular periodo a partir de la nueva fecha
            const nuevoPeriodo = nuevaFecha ? nuevaFecha.slice(0, 7) : '';
            // Duplicar el monto con la nueva fecha y periodo
            const nuevoMonto = { ...monto, vencimiento: nuevaFecha, periodo: nuevoPeriodo, id: undefined };
            this.montos.push(nuevoMonto);
            this.renderMontosList();
            this.duplicateModal.close();
        }, { once: true });
        duplicateForm.addEventListener('duplicate:cancel', () => this.duplicateModal.close(), { once: true });
        this.duplicateModal.appendChild(duplicateForm);
        this.duplicateModal.open();
    }

    renderMontosList() {
        // Ordenar montos por fecha de vencimiento ascendente
        this.montos.sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));
        this.montosTbody.innerHTML = '';
        this.montos.forEach((monto, idx) => {
            const tr = el('tr');
            const cells = [
                { text: monto.monto },
                { text: monto.moneda },
                { text: monto.vencimiento },
                {
                    children: [
                        el('app-button', {
                            className: 'edit-monto',
                            text: '✎',
                            attrs: { title: 'Editar' },
                            on: {
                                click: () => this.openMontoModal(monto, idx)
                            }
                        }),
                        el('app-button', {
                            className: 'delete-monto',
                            text: '×',
                            attrs: { variant: 'delete', title: 'Eliminar' },
                            on: {
                                click: () => {
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
                                click: () => this.openDuplicateMontoModal(monto, idx)
                            }
                        })
                    ]
                }
            ];
            cells.forEach(cellOpts => tr.appendChild(el('td', cellOpts)));
            this.montosTbody.appendChild(tr);
        });
    }

    load(deuda) {
        this.editing = true;
        this.deudaId = deuda.id;
        this.montos = deuda.montos.map(m => ({ ...m }));
        this.renderMontosList();
        // Precarga los valores en <app-form>
        const form = this.shadowRoot.querySelector('app-form');
        if (form) {
            form.initialValues = {
                acreedor: deuda.acreedor || '',
                tipoDeuda: deuda.tipoDeuda || '',
                notas: deuda.notas || ''
            };
        }
    }

    reset() {
        this.editing = false;
        this.deudaId = null;
        this.montos = [];
        const form = this.shadowRoot.querySelector('app-form');
        if (form) form.initialValues = {};
        this.renderMontosList();
        // Cerrar el modal de deuda si está abierto
        if (this.parentNode && this.parentNode.tagName === 'UI-MODAL' && typeof this.parentNode.close === 'function') {
            this.parentNode.close();
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        // Los datos del formulario ya están validados por AppForm
        const values = e.detail;
        // Validar que haya al menos un monto
        if (!this.montos || this.montos.length === 0) {
            this.showFormError('Debe agregar al menos un monto antes de guardar.');
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
            const { updateDeuda } = await import('../repository/deudaRepository.js');
            await updateDeuda(deuda);
            this.dispatchEvent(new CustomEvent('deuda:updated', { detail: deuda, bubbles: true, composed: true }));
        } else {
            const { addDeuda } = await import('../repository/deudaRepository.js');
            await addDeuda(deuda);
            this.dispatchEvent(new CustomEvent('deuda:saved', { detail: deuda, bubbles: true, composed: true }));
        }
        this.reset();
    }

    showFormError(msg) {
        let err = this.shadowRoot.getElementById('form-error');
        if (!err) {
            err = el('div', {
                attrs: { id: 'form-error' },
                style: 'color:red;margin:8px 0;'
            });
            const form = this.shadowRoot.querySelector('app-form');
            if (form) form.parentNode.insertBefore(err, form);
        }
        err.textContent = msg;
    }

    clearFormError() {
        const err = this.shadowRoot.getElementById('form-error');
        if (err) err.textContent = '';
    }
}
customElements.define('debt-form', DebtForm);