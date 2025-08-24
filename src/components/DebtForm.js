import { DeudaModel } from '../models/DeudaModel.js';
import { el, getFormValuesAndValidate } from '../utils/dom.js';
import './AppButton.js';
import './AppInput.js';
import './MontoForm.js';

export class DebtForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
        this.form = this.shadowRoot.querySelector('form');
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.editing = false;
        this.deudaId = null;
    }

    render() {
        // Usar el utilitario 'el' para crear el formulario y sus elementos
        const style = document.createElement('style');
        style.textContent = `
            form {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
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
        const form = el('form', {
            children: [
                el('app-input', {
                    attrs: { type: 'text', name: 'acreedor', label: 'Acreedor:', required: '' }
                }),
                el('app-input', {
                    attrs: { type: 'text', name: 'tipoDeuda', label: 'Tipo de Deuda:' }
                }),
                el('app-input', {
                    attrs: { type: 'text', name: 'numeroExterno', label: 'Número Externo:' }
                }),
                el('app-input', {
                    attrs: { type: 'textarea', name: 'notas', label: 'Notas:' }
                }),
                el('div', {
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
                }),
                el('app-button', { attrs: { type: 'submit', variant: 'success' }, text: 'Guardar' })
            ]
        });
        const modal = el('ui-modal', { attrs: { id: 'montoModal' } });
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(form);
        this.shadowRoot.appendChild(modal);
    }

    connectedCallback() {
        this.montos = [];
        this.montoEditIndex = null;
        this.montoModal = this.shadowRoot.getElementById('montoModal');
        this.montosTbody = this.shadowRoot.getElementById('montos-tbody');
        this.shadowRoot.getElementById('add-monto').addEventListener('click', () => this.openMontoModal());
        this.renderMontosList();
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
        });
        montoForm.addEventListener('monto:cancel', () => this.montoModal.close());
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
        // Precarga datos para edición
        this.editing = true;
        this.deudaId = deuda.id;
        this.montos = deuda.montos.map(m => ({ ...m }));
        this.renderMontosList();
        // Precarga los valores en los <app-input>
        for (const key in deuda) {
            if (key === 'montos') continue;
            const input = this.form.querySelector(`app-input[name="${key}"]`);
            if (input && deuda[key] !== undefined && deuda[key] !== null) {
                input.value = deuda[key];
            }
        }
    }

    reset() {
        this.editing = false;
        this.deudaId = null;
        this.montos = [];
        // Resetea los <app-input>
        this.form.querySelectorAll('app-input').forEach(input => input.value = '');
        this.renderMontosList();
    }

    _buildDeudaFromForm() {
        const get = name => this.form.querySelector(`app-input[name="${name}"]`)?.value;
        return new DeudaModel({
            acreedor: get('acreedor'),
            tipoDeuda: get('tipoDeuda'),
            notas: get('notas'),
            montos: this.montos
        });
    }

    async handleSubmit(event) {
        event.preventDefault();
        // Validación de los campos del formulario principal
        const { values, valid, errors } = getFormValuesAndValidate(this.form);
        // Limpiar errores previos
        this.form.querySelectorAll('app-input').forEach(input => input.clearError());
        if (!valid) {
            Object.entries(errors).forEach(([name, msg]) => {
                const input = this.form.querySelector(`app-input[name="${name}"]`);
                if (input) input.showError(msg);
            });
            return;
        }
        // Validación: requiere al menos un monto
        if (!this.montos || this.montos.length === 0) {
            this.showFormError('Debe agregar al menos un monto antes de guardar.');
            return;
        }
        this.clearFormError();
        const deuda = new DeudaModel({
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
            this.form.parentNode.insertBefore(err, this.form);
        }
        err.textContent = msg;
    }

    clearFormError() {
        const err = this.shadowRoot.getElementById('form-error');
        if (err) err.textContent = '';
    }

    yymm(fecha) {
        const date = new Date(fecha);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
}

customElements.define('debt-form', DebtForm);