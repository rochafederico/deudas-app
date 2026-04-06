// src/components/StatsCard.js
// Utiliza clases Bootstrap para las tarjetas de estadísticas
import { KPI_CURRENCY } from '../../../shared/config/monedas.js';

export default function StatsCard({ title = '', items = [], color = 'secondary' } = {}) {
  const card = document.createElement('div');
  card.className = `card h-100 rounded-4 shadow-sm border border-2 border-${color}`;

  const body = document.createElement('div');
  body.className = 'card-body d-flex flex-column justify-content-between gap-2 p-3';

  const titleEl = document.createElement('div');
  titleEl.className = `d-flex align-items-center gap-2 fw-semibold text-uppercase small text-${color}`;
  titleEl.textContent = title;
  body.appendChild(titleEl);

  const valuesEl = document.createElement('div');

  if (items.length > 0) {
    const mainItem = items.find(i => i.currency === KPI_CURRENCY) || items[0];
    const arsEl = document.createElement('h6');
    arsEl.className = `d-flex align-items-center gap-2 text-nowrap fw-bold text-${color} lh-sm mb-0`;
    const arsBadge = document.createElement('span');
    arsBadge.className = `badge small bg-${color}`;
    arsBadge.textContent = mainItem.currency;
    arsEl.appendChild(document.createTextNode(mainItem.value));
    arsEl.appendChild(arsBadge);
    valuesEl.appendChild(arsEl);
  }

  body.appendChild(valuesEl);
  card.appendChild(body);

  return card;
}
