import '../features/deudas/components/DebtModal.js';
import '../features/deudas/components/DebtDetailModal.js';
import '../features/ingresos/components/IngresoModal.js';
import '../shared/components/AppInput.js';
import './HeaderBar.js';
import { getSelectedMonth } from '../shared/MonthFilter.js';

export class AppShell extends HTMLElement {
    constructor() {
        super();
        this.showForm = false;
    }

    connectedCallback() {
        this.classList.add('d-block');
        this.render();
        const opener = this.querySelector('[data-add-debt]');
        if (opener) {
            opener.addEventListener('click', () => {
                const modal = this.querySelector('#debtModal');
                modal.openCreate();
                modal.attachOpener(opener);
            });
        }
        window.addEventListener('deuda:saved', this.refreshList.bind(this));
        window.addEventListener('deuda:updated', this.refreshList.bind(this));
    }

    refreshList() {
        window.dispatchEvent(new CustomEvent('ui:month', { detail: { mes: getSelectedMonth() } }));
    }

    async render() {
        // Usar el nuevo subcomponente HeaderBar
        const header = document.createElement('header-bar');
        header.mode = 'deudas';
        header.addEventListener('group-change', (e) => {
            this.groupBy = e.detail.groupBy;
            this.onGroupChange(this.groupBy);
        });
        header.addEventListener('add-debt', () => {
            const modal = this.querySelector('#debtModal');
            modal.openCreate();
            modal.attachOpener(header.querySelector('#add-debt'));
        });
        header.addEventListener('add-income', () => {
            let modal = this.querySelector('#ingresoModal');
            if (!modal) {
                modal = document.createElement('ingreso-modal');
                modal.id = 'ingresoModal';
                this.appendChild(modal);
            }
            modal.openCreate();
            modal.attachOpener(header.querySelector('#add-income'));
        });

        const card = document.createElement('div');
        card.className = 'card shadow-sm';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body p-3';
        cardBody.innerHTML = `<debt-modal id="debtModal"></debt-modal><debt-detail-modal id="debtDetailModal"></debt-detail-modal><debt-list></debt-list>`;

        card.appendChild(header);
        card.appendChild(cardBody);

        this.innerHTML = '';
        this.appendChild(card);
    }

    onGroupChange(groupBy) {
        window.dispatchEvent(new CustomEvent('ui:group', { detail: { groupBy } }));
    }

    updateFormVisibility() {
        const container = this.querySelector('#form-container');
        container.innerHTML = this.showForm ? '<debt-form></debt-form>' : '';
    }
}

customElements.define('app-shell', AppShell);
