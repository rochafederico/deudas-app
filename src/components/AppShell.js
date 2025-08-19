import './DebtModal.js';
import './AppInput.js';

export class AppShell extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.month = new Date().toISOString().slice(0, 7); // Mes actual por defecto
        this.showForm = false;
        this.render();
    }

    connectedCallback() {
        this.shadowRoot.querySelector('app-input[type="month"]').value = this.month;
        const opener = this.shadowRoot.querySelector('[data-add-debt]');
        opener.addEventListener('click', () => {
            const modal = this.shadowRoot.querySelector('#debtModal');
            modal.openCreate();
            modal.attachOpener(opener);
        });
        window.addEventListener('deuda:saved', this.refreshList.bind(this));
        window.addEventListener('deuda:updated', this.refreshList.bind(this));
    }

    onMonthChange(event) {
        this.month = event.target.value;
        console.log('[AppShell] Mes cambiado a:', this.month);
        window.dispatchEvent(new CustomEvent('ui:month', { detail: { mes: this.month } }));
    }

    refreshList() {
        window.dispatchEvent(new CustomEvent('ui:month', { detail: { mes: this.month } }));
    }

    async render() {
        const { el } = await import('../utils/dom.js');
        // Renderiza el header con flechas y filtro de mes usando utilidades dom.js
        const header = el('header', {
            children: [
                el('div', {
                    className: 'month-nav',
                    children: [
                        el('app-button', {
                            className: 'month-btn',
                            text: '<',
                            attrs: { id: 'prev-month', title: 'Mes anterior', type: 'button' }
                        }),
                        el('app-input', {
                            attrs: { type: 'month', name: 'month-filter', id: 'month-filter', value: this.month, label: '' }
                        }),
                        el('app-button', {
                            className: 'month-btn',
                            text: '>',
                            attrs: { id: 'next-month', title: 'Mes siguiente', type: 'button' }
                        })
                    ]
                }),
                el('div', {
                    children: [
                        el('app-button', {
                            attrs: { 'data-add-debt': '', id: 'add-debt', type: 'button' },
                            text: 'Agregar deuda',
                            variant: 'success'
                        })
                    ]
                })
            ]
        });

        const panel = el('div', {
            className: 'panel',
            html: `<debt-modal id="debtModal"></debt-modal><debt-list></debt-list>`
        });

        this.shadowRoot.innerHTML = `
            <style>
                .month-nav { display: flex; align-items: center; gap: 8px; }
                .month-btn { background: none; border: none; font-size: 1.5em; color: var(--accent, #ff4081); cursor: pointer; padding: 0 8px; }
                header { display: flex; justify-content: space-between; align-items: center; padding: 10px; background-color: var(--panel); }
                .panel { margin-top: 20px; }
            </style>
        `;
        this.shadowRoot.appendChild(header);
        this.shadowRoot.appendChild(panel);

        // Listeners para navegación de mes y agregar deuda
        const input = this.shadowRoot.getElementById('month-filter');
        const prevBtn = this.shadowRoot.getElementById('prev-month');
        const nextBtn = this.shadowRoot.getElementById('next-month');
        const addBtn = this.shadowRoot.getElementById('add-debt');
        input.addEventListener('change', e => {
            this.onMonthChange(e);
        });
        prevBtn.addEventListener('click', () => {
            const d = new Date(this.month + '-01T12:00:00');
            d.setMonth(d.getMonth() - 1);
            this.month = d.toISOString().slice(0, 7);
            input.value = this.month;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        nextBtn.addEventListener('click', () => {
            const d = new Date(this.month + '-01T12:00:00');
            d.setMonth(d.getMonth() + 1);
            this.month = d.toISOString().slice(0, 7);
            input.value = this.month;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        addBtn.addEventListener('click', () => {
            const modal = this.shadowRoot.querySelector('#debtModal');
            modal.openCreate();
            modal.attachOpener(addBtn);
        });
    }

    updateFormVisibility() {
        const container = this.shadowRoot.querySelector('#form-container');
        container.innerHTML = this.showForm ? '<debt-form></debt-form>' : '';
    }
}

customElements.define('app-shell', AppShell);