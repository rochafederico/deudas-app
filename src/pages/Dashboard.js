// src/pages/Dashboard.js
// Componente de muestra para el dashboard

export default function Dashboard() {
  const container = document.createElement('div');
  container.className = 'dashboard-container';

  const title = document.createElement('h2');
  title.textContent = 'Dashboard de Deudas';

  const description = document.createElement('p');
  description.textContent = 'Aquí verás un resumen mes a mes de tus deudas.';

  // Ejemplo de navegación
  const link = document.createElement('app-link');
  link.setAttribute('href', '/deudas');
  link.textContent = 'Ver lista de deudas';

  container.appendChild(title);
  container.appendChild(description);
  container.appendChild(link);

  return container;
}