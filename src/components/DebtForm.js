import { DeudaModel } from '../models/DeudaModel.js';
import { el } from '../utils/dom.js';
import './AppButton.js';
import './AppInput.js';
import './AppForm.js';
import './MontoForm.js';

export class DebtForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.montos = [];
        this.editing = false;
        this.deudaId = null;
        this.render();
    }

    connectedCallback() {
        this.montoModal = this.shadowRoot.getElementById('montoModal');
        this.montosTbody = this.shadowRoot.getElementById('montos-tbody');
        this.shadowRoot.getElementById('add-monto').addEventListener('click', () => this.openMontoModal());
        this.form = this.shadowRoot.querySelector('app-form');
        this.renderMontosList();
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
            { name: 'numeroExterno', type: 'text', label: 'Número Externo' },
            { name: 'notas', type: 'textarea', label: 'Notas' }
        ];
        form.submitText = 'Guardar';
        form.cancelText = 'Cancelar';
        // Listeners agregados aquí, no en connectedCallback
        form.addEventListener('form:submit', this.handleSubmit.bind(this), { once: true });
        form.addEventListener('form:cancel', () => this.reset(), { once: true });
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
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(form);
        this.shadowRoot.appendChild(montosList);
        this.shadowRoot.appendChild(modal);
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

    renderMontosList() {
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
                            text: 'Editar',
                            on: {
                                click: () => this.openMontoModal(monto, idx)
                            }
                        }),
                        el('app-button', {
                            className: 'delete-monto',
                            text: 'Eliminar',
                            attrs: { variant: 'delete' },
                            on: {
                                click: () => {
                                    this.montos.splice(idx, 1);
                                    this.renderMontosList();
                                }
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
                numeroExterno: deuda.numeroExterno || '',
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
    }

    async handleSubmit(e) {
        e.preventDefault();
        const form = this.shadowRoot.querySelector('app-form');
        // Usar el evento detail para obtener los valores y validación
        const { values, valid, errors } = form ? form.lastSubmitResult || {} : {};
        // Si no hay resultado, usar el evento directamente
        if (!values) {
            // fallback: usar e.detail si viene del evento 'form:submit'
            if (e.detail) {
                // No hay validación, solo valores
                if (!this.montos || this.montos.length === 0) {
                    this.showFormError('Debe agregar al menos un monto antes de guardar.');
                    return;
                }
                this.clearFormError();
                const deuda = new DeudaModel({
                    id: this.editing ? this.deudaId : undefined,
                    acreedor: e.detail.acreedor,
                    tipoDeuda: e.detail.tipoDeuda,
                    numeroExterno: e.detail.numeroExterno,
                    notas: e.detail.notas,
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
                return;
            }
            return;
        }
        // Validación: requiere al menos un monto
        if (!this.montos || this.montos.length === 0) {
            this.showFormError('Debe agregar al menos un monto antes de guardar.');
            return;
        }
        this.clearFormError();
        const deuda = new DeudaModel({
            id: this.editing ? this.deudaId : undefined,
            acreedor: values.acreedor,
            tipoDeuda: values.tipoDeuda,
            numeroExterno: values.numeroExterno,
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