// src/components/StatsCard.js
// Utiliza clases Bootstrap para las tarjetas de estadísticas
import { KPI_CURRENCY } from '../../../shared/config/monedas.js';

export default function StatsCard({ title = '', items = [], color = 'secondary' } = {}) {
  const card = document.createElement('div');
  card.className = `card h-100 rounded-4 shadow-sm border border-2 border-${color}`;

  const body = document.createElement('div');
  body.className = 'card-body p-3';

  const titleEl = document.createElement('div');
  titleEl.className = `fw-semibold text-uppercase small text-${color} mb-2`;
  titleEl.textContent = title;
  body.appendChild(titleEl);

  const valuesEl = document.createElement('div');

  if (items.length > 0) {
    const mainItem = items.find(i => i.currency === KPI_CURRENCY) || items[0];
    const arsEl = document.createElement('p');
    arsEl.className = `h6 fw-bold text-${color} lh-sm mb-0`;
    const arsBadge = document.createElement('span');
    arsBadge.className = `badge bg-${color} ms-1`;
    arsBadge.textContent = mainItem.currency;
    arsEl.appendChild(document.createTextNode(mainItem.value));
    arsEl.appendChild(arsBadge);
    valuesEl.appendChild(arsEl);
  }

  body.appendChild(valuesEl);
  card.appendChild(body);

  return card;
}
