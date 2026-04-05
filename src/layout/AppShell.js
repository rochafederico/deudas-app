import '../features/deudas/components/DebtModal.js';
import '../shared/components/AppInput.js';
import './HeaderBar.js';

export class AppShell extends HTMLElement {
    constructor() {
        super();
        this.month = new Date().toISOString().slice(0, 7); // Mes actual por defecto
        this.showForm = false;
    }

    connectedCallback() {
        this.classList.add('d-block');
        this.render();
        // Usar el id para seleccionar el input correctamente
        const input = this.querySelector('#month-filter');
        if (input) input.value = this.month;
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

    onMonthChange(event) {
        this.month = event.target.value;
        console.log('[AppShell] Mes cambiado a:', this.month);
        window.dispatchEvent(new CustomEvent('ui:month', { detail: { mes: this.month } }));
    }

    refreshList() {
        window.dispatchEvent(new CustomEvent('ui:month', { detail: { mes: this.month } }));
    }

    async render() {
        // Usar el nuevo subcomponente HeaderBar
        const header = document.createElement('header-bar');
        header.month = this.month;
        header.mode = 'deudas';
        header.addEventListener('month-change', (e) => {
            this.month = e.detail.mes;
            this.onMonthChange({ target: { value: this.month } });
        });
        header.addEventListener('group-change', (e) => {
            this.groupBy = e.detail.groupBy;
            this.onGroupChange(this.groupBy);
        });
        header.addEventListener('add-debt', () => {
            const modal = this.querySelector('#debtModal');
            modal.openCreate();
            modal.attachOpener(header.querySelector('#add-debt'));
        });

        const card = document.createElement('div');
        card.className = 'card shadow-sm';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body p-3';
        cardBody.innerHTML = `<debt-modal id="debtModal"></debt-modal><debt-list></debt-list>`;

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
