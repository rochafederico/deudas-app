// src/layout/PageSectionLayout.js
// Reusable layout for pages that display a toolbar + content area inside a card.
// Usage:
//   const layout = document.createElement('page-section-layout');
//   layout.toolbarStart = filterElement;       // left side of toolbar (optional)
//   layout.toolbarEnd = actionButtonElement;   // right side of toolbar (optional)
//   layout.content = tableOrContentElement;    // main content area

export class PageSectionLayout extends HTMLElement {
    connectedCallback() {
        this.classList.add('d-block');
        this._render();
        if (this._pendingToolbarStart) { this.setToolbarStart(this._pendingToolbarStart); delete this._pendingToolbarStart; }
        if (this._pendingToolbarEnd) { this.setToolbarEnd(this._pendingToolbarEnd); delete this._pendingToolbarEnd; }
        if (this._pendingContent) { this.setContent(this._pendingContent); delete this._pendingContent; }
    }

    _render() {
        this.innerHTML = `
            <div class="card shadow-sm">
                <div class="card-header d-flex flex-wrap justify-content-between align-items-center p-2 gap-2">
                    <div class="psl-toolbar-start d-flex flex-wrap align-items-center gap-2"></div>
                    <div class="psl-toolbar-end d-flex gap-2 flex-wrap"></div>
                </div>
                <div class="card-body p-3 psl-content"></div>
            </div>
        `;
    }

    set toolbarStart(el) {
        if (!this.isConnected) { this._pendingToolbarStart = el; return; }
        this.setToolbarStart(el);
    }

    set toolbarEnd(el) {
        if (!this.isConnected) { this._pendingToolbarEnd = el; return; }
        this.setToolbarEnd(el);
    }

    set content(el) {
        if (!this.isConnected) { this._pendingContent = el; return; }
        this.setContent(el);
    }

    setToolbarStart(el) {
        const slot = this.querySelector('.psl-toolbar-start');
        if (slot) { slot.innerHTML = ''; if (el) slot.appendChild(el); }
    }

    setToolbarEnd(el) {
        const slot = this.querySelector('.psl-toolbar-end');
        if (slot) { slot.innerHTML = ''; if (el) slot.appendChild(el); }
    }

    setContent(el) {
        const slot = this.querySelector('.psl-content');
        if (slot) { slot.innerHTML = ''; if (el) slot.appendChild(el); }
    }

    getContentSlot() {
        return this.querySelector('.psl-content');
    }
}

customElements.define('page-section-layout', PageSectionLayout);
