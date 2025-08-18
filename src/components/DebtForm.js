import { DeudaModel } from '../models/DeudaModel.js';

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
        this.shadowRoot.innerHTML = `
            <style>
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
            </style>
            <form>
                <label>
                    Acreedor:
                    <input type="text" name="acreedor" required />
                </label>
                <label>
                    Tipo de Deuda:
                    <input type="text" name="tipoDeuda" />
                </label>
                <label>
                    Número Externo:
                    <input type="text" name="numeroExterno" />
                </label>
                <label>
                    Notas:
                    <textarea name="notas"></textarea>
                </label>
                <div class="montos-list">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                        <strong>Montos</strong>
                        <button type="button" id="add-monto" class="btn-monto">Agregar monto</button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Monto</th>
                                <th>Moneda</th>
                                <th>Vencimiento</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="montos-tbody"></tbody>
                    </table>
                </div>
                <button type="submit">Guardar</button>
            </form>
            <ui-modal id="montoModal"></ui-modal>
        `;
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
        this.montoModal.innerHTML = `
            <form id="formMonto" style="display:flex;flex-direction:column;gap:10px;min-width:220px;">
                <label>Monto:<input type="number" name="monto" required value="${monto?.monto ?? ''}" /></label>
                <label>Moneda:
                    <select name="moneda">
                        <option value="ARS" ${monto?.moneda === 'ARS' ? 'selected' : ''}>ARS</option>
                        <option value="USD" ${monto?.moneda === 'USD' ? 'selected' : ''}>USD</option>
                    </select>
                </label>
                <label>Vencimiento:<input type="date" name="vencimiento" required value="${monto?.vencimiento ?? ''}" /></label>
                <div style="display:flex;justify-content:flex-end;gap:8px;">
                    <button type="button" id="cancelMonto">Cancelar</button>
                    <button type="submit">Guardar</button>
                </div>
            </form>
        `;
        this.montoModal.open();
        const formMonto = this.montoModal.querySelector('#formMonto');
        formMonto.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = new FormData(formMonto);
            const nuevoMonto = {
                monto: data.get('monto'),
                moneda: data.get('moneda'),
                vencimiento: data.get('vencimiento')
            };
            if (index !== null) {
                this.montos[index] = nuevoMonto;
            } else {
                this.montos.push(nuevoMonto);
            }
            this.renderMontosList();
            this.montoModal.close();
        });
        this.montoModal.querySelector('#cancelMonto').addEventListener('click', () => this.montoModal.close());
    }

    renderMontosList() {
        this.montosTbody.innerHTML = '';
        this.montos.forEach((monto, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${monto.monto}</td>
                <td>${monto.moneda}</td>
                <td>${monto.vencimiento}</td>
                <td>
                    <button type="button" class="edit-monto">Editar</button>
                    <button type="button" class="delete-monto">Eliminar</button>
                </td>
            `;
            tr.querySelector('.edit-monto').addEventListener('click', () => this.openMontoModal(monto, idx));
            tr.querySelector('.delete-monto').addEventListener('click', () => {
                this.montos.splice(idx, 1);
                this.renderMontosList();
            });
            this.montosTbody.appendChild(tr);
        });
    }

    load(deuda) {
        // Precarga datos para edición
        this.editing = true;
        this.deudaId = deuda.id;
        this.montos = deuda.montos.map(m => ({ ...m }));
        this.renderMontosList();
        for (const key in deuda) {
            if (key === 'montos') continue;
            if (this.form.elements[key] && deuda[key] !== undefined && deuda[key] !== null) {
                this.form.elements[key].value = deuda[key];
            }
        }
    }

    reset() {
        this.editing = false;
        this.deudaId = null;
        this.montos = [];
        this.form.reset();
        this.renderMontosList();
    }

    _buildDeudaFromForm() {
        const get = name => this.form.elements[name]?.value;
        return new DeudaModel({
            acreedor: get('acreedor'),
            tipoDeuda: get('tipoDeuda'),
            notas: get('notas'),
            montos: this.montos
        });
    }

    async handleSubmit(event) {
        event.preventDefault();
        // Validation: require at least one monto
        if (!this.montos || this.montos.length === 0) {
            this.showFormError('Debe agregar al menos un monto antes de guardar.');
            return;
        }
        this.clearFormError();
        const deuda = this._buildDeudaFromForm();
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
            err = document.createElement('div');
            err.id = 'form-error';
            err.style.color = 'red';
            err.style.margin = '8px 0';
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