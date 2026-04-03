// src/pages/Dashboard.js
// Componente de muestra para el dashboard

export default function Dashboard() {
  const container = document.createElement('div');
  container.className = 'container-fluid py-3';

  const title = document.createElement('h2');
  title.className = 'mb-2';
  title.textContent = 'Dashboard de Deudas';

  const description = document.createElement('p');
  description.className = 'text-muted';
  description.textContent = 'Aquí verás un resumen mes a mes de tus deudas.';

  const link = document.createElement('app-link');
  link.setAttribute('href', '/deudas');
  link.textContent = 'Ver lista de deudas';

  container.appendChild(title);
  container.appendChild(description);
  container.appendChild(link);

  return container;
}
