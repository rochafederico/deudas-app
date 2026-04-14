

import { listInversiones, deleteInversion } from '../inversionRepository.js';
import { inversionTableColumns } from '../../../shared/config/tables/inversionTableColumns.js';
import { el } from '../../../shared/utils/dom.js';
import { formatMoneda } from '../../../shared/config/monedas.js';
import '../../../layout/PageSectionLayout.js';
import '../../../shared/components/AppButton.js';

export class InversionesList extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.classList.add('d-block');
    this.render();
  }

  async render() {
    this.innerHTML = '';

    const layout = document.createElement('page-section-layout');

    // Toolbar: action button on the right
    const addBtn = document.createElement('app-button');
    addBtn.id = 'add';
    addBtn.setAttribute('aria-label', 'Agregar inversión');
    addBtn.textContent = 'Agregar inversión';
    addBtn.onclick = () => this.openModal();
    layout.toolbarEnd = addBtn;

    // Content: table + modals
    const contentSlot = document.createElement('div');
    const tabla = document.createElement('app-table');
    tabla.id = 'tabla';
    contentSlot.appendChild(tabla);

    const inversionModal = document.createElement('inversion-modal');
    inversionModal.id = 'inversion-modal';
    contentSlot.appendChild(inversionModal);

    layout.content = contentSlot;
    this.appendChild(layout);

    await this.renderTable();
  }

  async renderTable() {
    const inversiones = await listInversiones();
    // Inyectar función de acciones en cada fila usando <app-button>
    inversiones.forEach(inv => {
      inv._acciones = () => {
        const accionesContainer = document.createElement('div');
        accionesContainer.className = 'd-flex gap-2 align-items-center justify-content-center';
        const btn = document.createElement('app-button');
        btn.textContent = 'Agregar valor';
        btn.setAttribute('aria-label', 'Agregar valor');
        btn.onclick = () => this.addValueToInversion(inv);
        accionesContainer.appendChild(btn);
        const deleteBtn = el('app-button', {
          attrs: {
            'aria-label': 'Eliminar inversión',
            'variant': 'delete',
          },
          text: 'Eliminar',
          on: {
            click: async () => {
              if (confirm(`Vas a eliminar la inversión "${inv.nombre}". Esta acción no se puede deshacer. ¿Continuás?`)) {
                await deleteInversion(inv.id);
                await this.renderTable();
              }
            }
          }
        });
        accionesContainer.appendChild(deleteBtn);
        return accionesContainer;
      };
    });
    const tabla = this.querySelector('#tabla');
    tabla.columnsConfig = inversionTableColumns;
    tabla.tableData = inversiones;
    tabla.footerContent = this.renderFooter(inversiones).innerHTML;
    tabla.render();
  }

  openModal() {
    const modal = this.querySelector('#inversion-modal');
    modal.onsave = () => this.renderTable();
    const uiModal = modal.querySelector('ui-modal')
    uiModal.open();
  }

  addValueToInversion(inv) {
    let modal = this.querySelector('valor-modal');
    if (!modal) {
      modal = document.createElement('valor-modal');
      this.appendChild(modal);
    }
    modal.setIdInversion(inv.id);
    modal.onsave = () => this.renderTable();
    const uiModal = modal.querySelector('ui-modal')
    uiModal.setTitle(inv.nombre);
    modal.resetValues();
    uiModal.open();
  }

  renderFooter(inversiones) {
    const footer = document.createElement('tfoot');
    const rowTitle = document.createElement('tr');
    const totalCell = document.createElement('td');

    totalCell.colSpan = inversionTableColumns.length - 1;
    totalCell.className = 'text-end';
    totalCell.textContent = 'Total invertido:';
    const monedas = inversiones.reduce((result, inv) => {
      const moneda = inv.moneda ?? 'ARS';
      if (!result.includes(moneda)) {
        result.push(moneda);
      }
      return result
    }, [])
    totalCell.rowSpan = monedas.length;
    rowTitle.appendChild(totalCell);

    const rowTotals = document.createElement('tr');
    for (let i = 0; i < monedas.length; i++) {
      const moneda = monedas[i];
      const sumaCell = document.createElement('td');
      const totalActual = inversiones.filter(inv => inv.moneda === moneda)
        .reduce((sum, inv) => sum + (inv.historialValores[inv.historialValores.length - 1]?.valor || 0), 0);
      sumaCell.textContent = formatMoneda(totalActual, moneda);
      if (i === 0) {
        rowTitle.appendChild(sumaCell);
      } else {
        rowTotals.appendChild(sumaCell);
      }
    }
    footer.appendChild(rowTitle);
    footer.appendChild(rowTotals);

    return footer;
  }
}

customElements.define('inversiones-list', InversionesList);
