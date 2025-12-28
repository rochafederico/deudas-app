

import { listInversiones } from '../../../repository/inversionRepository.js';
import { inversionTableColumns } from '../../../config/tables/inversionTableColumns.js';

export class InversionesList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  async render() {
    this.shadowRoot.innerHTML = `<style>
      app-button { margin-bottom: 1em; }
    </style>
    <h2>Inversiones</h2>
    <app-button id="add" aria-label="Agregar inversión">Agregar inversión</app-button>
    <app-table id="tabla"></app-table>
    <inversion-modal id="inversion-modal"></inversion-modal>`;
    this.shadowRoot.getElementById('add').onclick = () => this.openModal();
    await this.renderTable();
  }

  async renderTable() {
    const inversiones = await listInversiones();
    // Inyectar función de acciones en cada fila usando <app-button>
    inversiones.forEach(inv => {
      inv._acciones = () => {
        const btn = document.createElement('app-button');
        btn.textContent = 'Nuevo valor';
        btn.setAttribute('aria-label', 'Nuevo valor');
        btn.onclick = () => this.addValueToInversion(inv);
        return btn;
      };
    });
    const tabla = this.shadowRoot.getElementById('tabla');
    tabla.columnsConfig = inversionTableColumns;
    tabla.tableData = inversiones;
  }

  openModal() {
    const modal = this.shadowRoot.querySelector('#inversion-modal');
    const uiModal = modal.querySelector('ui-modal')
    uiModal.onsave = () => this.renderTable();
    uiModal.open();
  }

  addValueToInversion(inv) {
    let modal = this.shadowRoot.querySelector('valor-modal');
    if(!modal) {
        modal = document.createElement('valor-modal');
        this.shadowRoot.appendChild(modal);
    }
    modal.setIdInversion(inv.id);
    const uiModal = modal.querySelector('ui-modal')
    uiModal.setTitle(inv.nombre);
    uiModal.onsave = () => this.renderTable();
    modal.resetValues();
    uiModal.open();
  }
}

customElements.define('inversiones-list', InversionesList);
