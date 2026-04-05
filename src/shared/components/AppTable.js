// src/components/AppTable.js
// Componente de tabla reutilizable usando Bootstrap directamente (sin Shadow DOM)

export class AppTable extends HTMLElement {
    constructor() {
        super();
        this.columns = [];
        this.data = [];
        this.footerContent = null;
    }

    static get observedAttributes() {
        return ['columns', 'data'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'columns') {
            this.columns = JSON.parse(newValue);
        }
        if (name === 'data') {
            this.data = JSON.parse(newValue);
        }
        this.render();
    }

    set columnsConfig(cols) {
        this.columns = cols;
        this.render();
    }
    set tableData(data) {
        this.data = data;
        this.render();
    }

    set footer(content) {
        this.footerContent = content;
        this.render();
    }

    set footerRenderer(fn) {
        this._footerRenderer = fn;
        this.render();
    }

    render() {
        this.innerHTML = `
            <div class="table-responsive">
            <table class="table table-hover table-striped mb-0">
                <thead class="table-light">
                    <tr>
                        ${this.columns.map(col => `<th${col.opts && col.opts.classCss ? ` class="${col.opts.classCss}"` : ''}>${col.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody></tbody>
                <tfoot></tfoot>
            </table>
            </div>
        `;
        const tbody = this.querySelector('tbody');
        if (this.data.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = this.columns.length;
            td.textContent = 'No hay datos.';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }
        this.data.forEach(row => {
            const tr = document.createElement('tr');
            if (typeof row._onRowClick === 'function') {
                tr.style.cursor = 'pointer';
                tr.addEventListener('click', () => row._onRowClick(row));
            }
            this.columns.forEach(col => {
                const td = document.createElement('td');
                if (col.opts && col.opts.classCss) {
                    td.className = col.opts.classCss;
                }
                let content;
                if (col.render) {
                    content = col.render(row);
                } else {
                    content = row[col.key] ?? '';
                }
                if (content instanceof Node) {
                    td.appendChild(content);
                } else if (typeof content === 'string') {
                    td.innerHTML = content;
                } else {
                    td.textContent = String(content);
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        // Renderizar footer dinámico
        const tfoot = this.querySelector('tfoot');
        if (this._footerRenderer) {
            const result = this._footerRenderer(this.columns, this.data);
            if (result instanceof Node) {
                tfoot.appendChild(result);
            } else if (Array.isArray(result)) {
                result.forEach(node => {
                    if (node instanceof Node) tfoot.appendChild(node);
                });
            } else if (typeof result === 'string') {
                tfoot.innerHTML = result;
            }
        } else if (this.footerContent) {
            if (this.footerContent instanceof Node) {
                tfoot.appendChild(this.footerContent);
            } else if (Array.isArray(this.footerContent)) {
                this.footerContent.forEach(node => {
                    if (node instanceof Node) tfoot.appendChild(node);
                });
            } else if (typeof this.footerContent === 'string') {
                tfoot.innerHTML = this.footerContent;
            }
        }
    }
}

customElements.define('app-table', AppTable);
