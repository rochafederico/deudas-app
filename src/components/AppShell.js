import './DebtModal.js';
import './AppInput.js';
import './ExportDataModal.js';
import './ImportDataModal.js';
import './HeaderBar.js';

export class AppShell extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.month = new Date().toISOString().slice(0, 7); // Mes actual por defecto
        this.showForm = false;
        this.render();
    }

    connectedCallback() {
        // Usar el id para seleccionar el input correctamente
        const input = this.shadowRoot.getElementById('month-filter');
        if (input) input.value = this.month;
        const opener = this.shadowRoot.querySelector('[data-add-debt]');
        if (opener) {
            opener.addEventListener('click', () => {
                const modal = this.shadowRoot.querySelector('#debtModal');
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
            const modal = this.shadowRoot.querySelector('#debtModal');
            modal.openCreate();
            modal.attachOpener(header.shadowRoot.getElementById('add-debt'));
        });
        header.addEventListener('export-data', () => {
            this.openExportModal(header.shadowRoot.getElementById('export-data'));
        });
        header.addEventListener('import-data', () => {
            this.openImportModal(header.shadowRoot.getElementById('import-data'));
        });

        const panel = document.createElement('div');
        panel.className = 'panel';
        panel.innerHTML = `<debt-modal id="debtModal"></debt-modal><debt-list></debt-list>`;

        this.shadowRoot.innerHTML = `
            <style>
                .panel { margin-top: 20px; }
            </style>
        `;
        this.shadowRoot.appendChild(header);
        this.shadowRoot.appendChild(panel);
    }

    onGroupChange(groupBy) {
        window.dispatchEvent(new CustomEvent('ui:group', { detail: { groupBy } }));
    }

    async openExportModal(opener) {
        let modal = this.shadowRoot.getElementById('exportDataModal');
        if (!modal) {
            modal = document.createElement('export-data-modal');
            modal.id = 'exportDataModal';
            this.shadowRoot.appendChild(modal);
        }
        modal.open(opener);
    }

    async openImportModal(opener) {
        let modal = this.shadowRoot.getElementById('importDataModal');
        if (!modal) {
            modal = document.createElement('import-data-modal');
            modal.id = 'importDataModal';
            this.shadowRoot.appendChild(modal);
            
            // Escuchar el evento de datos importados para refrescar la vista
            window.addEventListener('data-imported', () => {
                // Refrescar la lista de deudas
                const debtList = this.shadowRoot.querySelector('debt-list');
                if (debtList && typeof debtList.refresh === 'function') {
                    debtList.refresh();
                }
                // Emitir evento global para que otros componentes se actualicen
                window.dispatchEvent(new CustomEvent('ui:refresh'));
            });
        }
        modal.open(opener);
    }

    async openImportModal(opener) {
        let modal = this.shadowRoot.getElementById('importDataModal');
        if (!modal) {
            modal = document.createElement('import-data-modal');
            modal.id = 'importDataModal';
            this.shadowRoot.appendChild(modal);
            
            // Escuchar el evento de datos importados para refrescar la vista
            modal.addEventListener('data-imported', () => {
                // Refrescar la lista de deudas
                const debtList = this.shadowRoot.querySelector('debt-list');
                if (debtList && typeof debtList.refresh === 'function') {
                    debtList.refresh();
                }
                // Emitir evento global para que otros componentes se actualicen
                window.dispatchEvent(new CustomEvent('ui:refresh'));
            });
        }
        modal.open(opener);
    }

    updateFormVisibility() {
        const container = this.shadowRoot.querySelector('#form-container');
        container.innerHTML = this.showForm ? '<debt-form></debt-form>' : '';
    }
}

customElements.define('app-shell', AppShell);