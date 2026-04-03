import '../features/deudas/components/DebtModal.js';
import '../features/ingresos/components/IngresoModal.js';
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
        header.addEventListener('delete-data', async () => {
            const confirmed = confirm('¿Estás seguro de que deseas eliminar todos los datos? Esta acción no se puede deshacer.');
            if (confirmed) {
                try {
                    const { deleteDeudas } = await import('../features/deudas/deudaRepository.js');
                    await deleteDeudas();
                } catch (error) {
                    console.error('Error al eliminar los datos:', error);
                }
                window.dispatchEvent(new CustomEvent('ui:refresh'));
            }
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
