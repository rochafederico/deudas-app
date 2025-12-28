// Página para mostrar el módulo de inversiones
export default function Inversiones() {
  const container = document.createElement('div');
  import('../modules/inversiones/index.js').then(mod => {
    container.innerHTML = '';
    container.appendChild(mod.default());
  });
  return container;
}
