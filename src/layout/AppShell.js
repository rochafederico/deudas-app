import '../features/deudas/components/DebtModal.js';
import '../features/deudas/components/DebtDetailModal.js';
import '../shared/components/AppInput.js';
import '../shared/components/AppButton.js';
import './PageSectionLayout.js';
import { groupOptions } from '../shared/config/tables/groupOptions.js';
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
        this._onRefreshList = this.refreshList.bind(this);
        window.addEventListener('deuda:saved', this._onRefreshList);
        window.addEventListener('deuda:updated', this._onRefreshList);
    }

    disconnectedCallback() {
        window.removeEventListener('deuda:saved', this._onRefreshList);
        window.removeEventListener('deuda:updated', this._onRefreshList);
    }

    refreshList() {
        window.dispatchEvent(new CustomEvent('ui:month', { detail: { mes: getSelectedMonth() } }));
    }

    async render() {
        const layout = document.createElement('page-section-layout');

        // Toolbar start: group filter
        const optionsHtml = groupOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
        const groupFilter = document.createElement('app-input');
        groupFilter.setAttribute('type', 'select');
        groupFilter.setAttribute('id', 'group-filter');
        groupFilter.setAttribute('name', 'group-filter');
        groupFilter.setAttribute('title', 'Agrupar montos');
        groupFilter.innerHTML = optionsHtml;
        groupFilter.addEventListener('change', (e) => {
            this.groupBy = e.target.value;
            this.onGroupChange(this.groupBy);
        });

        layout.toolbarStart = groupFilter;

        // Toolbar end: add debt button
        const addDebtBtn = document.createElement('app-button');
        addDebtBtn.id = 'add-debt';
        addDebtBtn.setAttribute('aria-label', 'Agregar egreso');
        addDebtBtn.setAttribute('data-tour-step', 'nueva-deuda');
        addDebtBtn.textContent = 'Agregar egreso';
        addDebtBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = this.querySelector('#debtModal');
            modal.openCreate();
            modal.attachOpener(addDebtBtn);
        });

        layout.toolbarEnd = addDebtBtn;

        // Content: debt list + modals
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `<debt-modal id="debtModal"></debt-modal><debt-detail-modal id="debtDetailModal"></debt-detail-modal><debt-list></debt-list>`;

        layout.content = contentDiv;

        this.innerHTML = '';
        this.appendChild(layout);
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
