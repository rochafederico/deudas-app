# Testing deudas-app (Nivva)

## Local Setup

The app is vanilla JS with no build step. Serve it locally:

```bash
cd /home/ubuntu/repos/deudas-app
python3 -m http.server 8080
```

Then open `http://localhost:8080` in the browser.

## Running Automated Tests

```bash
npm test    # Runs happy-dom + fake-indexeddb test suite
npm run lint  # ESLint checks
```

Tests use `happy-dom` for DOM simulation and `fake-indexeddb` for IndexedDB. Test files are in `test/` and organized by feature (e.g., `test/deudas.test.js`, `test/tour.test.js`).

## Tour Feature Testing

The guided tour auto-starts on first visit when `localStorage.getItem('nivva_tour_completed')` is not `'true'`.

### Key behaviors to verify:
- Tour shows 7 steps: Bienvenida, Indicadores, Navegacion por mes, Nueva deuda, Nuevo ingreso, Menu de navegacion, Privacidad
- Steps 1-6 highlight specific UI elements via SVG mask cutout
- Step 7 (Privacidad) shows centered with no highlight (full overlay)
- Last step button text changes from "Siguiente" to "¡Empezar!"
- "Anterior" button is hidden on step 1
- Keyboard: ArrowRight (next), ArrowLeft (prev), Escape (close)
- Skip button ("Saltar") closes tour immediately
- After completion/skip, `nivva_tour_completed` is set to `'true'` in localStorage
- Tour does NOT reappear on page reload after completion

### Resetting tour state for re-testing:
In browser console:
```js
localStorage.removeItem('nivva_tour_completed');
location.reload();
```

### Shadow DOM considerations:
Tour targets are inside nested Shadow DOMs (e.g., `app-shell > shadowRoot > header-bar > shadowRoot > [data-tour-step]`). The `findTourTarget()` helper in `tourConfig.js` handles traversal. If a target element is not found, the step shows centered without highlight — this may indicate a component restructure broke the selector path.

## General App Testing Notes

- The app uses Web Components with Shadow DOM extensively. When inspecting elements, you may need to expand shadow roots in DevTools.
- IndexedDB stores: `deudas`, `montos`, `ingresos`, `inversiones`
- Port 8080 may be occupied from previous sessions. Kill with `fuser -k 8080/tcp` or use a different port.
- The app has no backend — all data is local (IndexedDB + localStorage).
- Netlify preview deploys are available for PRs targeting `main`. PRs targeting other branches (e.g., stacked PRs) may not get preview deploys.

## Devin Secrets Needed

No secrets are required — the app is fully client-side with no authentication.
