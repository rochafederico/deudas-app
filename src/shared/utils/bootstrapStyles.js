// src/shared/utils/bootstrapStyles.js
// Inyecta Bootstrap 5 CSS en Shadow DOM de Web Components.
// Los colores de marca se definen en :root (base.css) y se heredan via CSS custom properties.

const BOOTSTRAP_CDN = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';

/**
 * Inyecta el <link> de Bootstrap en un shadowRoot.
 * El navegador cachea el archivo, multiples shadow roots no causan descargas repetidas.
 * @param {ShadowRoot} shadowRoot
 */
export function injectBootstrap(shadowRoot) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = BOOTSTRAP_CDN;
    shadowRoot.prepend(link);
}

export { BOOTSTRAP_CDN };
