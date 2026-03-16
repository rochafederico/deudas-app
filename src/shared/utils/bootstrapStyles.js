// src/shared/utils/bootstrapStyles.js
// Utilidad para inyectar Bootstrap 5 en Shadow DOM de Web Components

const BOOTSTRAP_CDN = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';

/**
 * Crea un elemento <link> para Bootstrap CSS.
 * El navegador cachea el archivo, asi que multiples shadow roots no causan descargas repetidas.
 * @returns {HTMLLinkElement}
 */
export function createBootstrapLink() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = BOOTSTRAP_CDN;
    return link;
}

/**
 * CSS personalizado que sobreescribe variables de Bootstrap con los colores de la marca Nivva.
 * Se usa junto con Bootstrap dentro de cada shadow root.
 */
export const brandOverrides = `
    :host {
        --bs-primary: rgb(61, 121, 130);
        --bs-primary-rgb: 61, 121, 130;
        --bs-danger: #d9534f;
        --bs-danger-rgb: 217, 83, 79;
        --bs-success: #5cb85c;
        --bs-success-rgb: 92, 184, 92;
        --bs-body-font-family: 'Inter', Arial, sans-serif;
    }
    .btn-primary, .btn-primary:active {
        background-color: rgb(61, 121, 130);
        border-color: rgb(61, 121, 130);
        color: #fff;
    }
    .btn-primary:hover, .btn-primary:focus {
        background-color: rgb(51, 101, 110);
        border-color: rgb(51, 101, 110);
        color: #fff;
    }
    .btn-outline-primary {
        color: rgb(61, 121, 130);
        border-color: rgb(61, 121, 130);
    }
    .btn-outline-primary:hover, .btn-outline-primary:focus {
        background-color: rgb(61, 121, 130);
        border-color: rgb(61, 121, 130);
        color: #fff;
    }
    .form-control:focus, .form-select:focus {
        border-color: rgb(61, 121, 130);
        box-shadow: 0 0 0 0.25rem rgba(61, 121, 130, 0.25);
    }
    .form-check-input:checked {
        background-color: rgb(61, 121, 130);
        border-color: rgb(61, 121, 130);
    }
    .text-primary { color: rgb(61, 121, 130) !important; }
    a { color: rgb(61, 121, 130); }
    a:hover { color: rgb(51, 101, 110); }
`;

/**
 * Crea un elemento <style> con los overrides de la marca.
 * @returns {HTMLStyleElement}
 */
export function createBrandStyle() {
    const style = document.createElement('style');
    style.textContent = brandOverrides;
    return style;
}

/**
 * Inyecta Bootstrap y los overrides de marca en un shadowRoot.
 * @param {ShadowRoot} shadowRoot
 */
export function injectBootstrap(shadowRoot) {
    shadowRoot.prepend(createBrandStyle());
    shadowRoot.prepend(createBootstrapLink());
}

export { BOOTSTRAP_CDN };
