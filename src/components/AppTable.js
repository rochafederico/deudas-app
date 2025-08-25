// src/components/AppTable.js
// Componente de tabla reutilizable

export class AppTable extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
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
        this.shadowRoot.innerHTML = `
            <style>
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                th:last-child, td:last-child { text-align: right; }
                tr:hover { background-color: #f1f1f1; }
                :host-context(body.dark-mode) tr:hover { background-color: #222a3a; }
            </style>
            <table>
                <thead>
                    <tr>
                        ${this.columns.map(col => `<th>${col.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody></tbody>
                <tfoot></tfoot>
            </table>
        `;
        // Renderizar filas dinámicamente
        const tbody = this.shadowRoot.querySelector('tbody');
        tbody.innerHTML = '';
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
            this.columns.forEach(col => {
                const td = document.createElement('td');
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
        const tfoot = this.shadowRoot.querySelector('tfoot');
        tfoot.innerHTML = '';
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
