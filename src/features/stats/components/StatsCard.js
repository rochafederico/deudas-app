// src/components/StatsCard.js
// Utiliza clases Bootstrap para las tarjetas de estadísticas
export default function StatsCard({ title = '', items = [], color = 'secondary' } = {}) {
  const card = document.createElement('div');
  card.className = `card h-100 rounded-4 shadow-sm border-0 bg-${color}-subtle`;

  const body = document.createElement('div');
  body.className = 'card-body p-3';

  const titleEl = document.createElement('div');
  titleEl.className = `fw-bold text-uppercase small text-${color} mb-2`;
  titleEl.textContent = title;
  body.appendChild(titleEl);

  const valuesEl = document.createElement('div');

  if (items.length > 0) {
    const arsEl = document.createElement('p');
    arsEl.className = `h5 fw-bold text-${color} lh-sm mb-0`;
    const arsBadge = document.createElement('span');
    arsBadge.className = `badge bg-${color} me-1`;
    arsBadge.textContent = items[0].currency;
    arsEl.appendChild(arsBadge);
    arsEl.appendChild(document.createTextNode(items[0].value));
    valuesEl.appendChild(arsEl);
  }

  if (items.length > 1) {
    const usdEl = document.createElement('p');
    usdEl.className = 'h6 text-muted mt-1';
    const usdBadge = document.createElement('span');
    usdBadge.className = 'badge bg-secondary me-1';
    usdBadge.textContent = items[1].currency;
    usdEl.appendChild(usdBadge);
    usdEl.appendChild(document.createTextNode(items[1].value));
    valuesEl.appendChild(usdEl);
  }

  body.appendChild(valuesEl);
  card.appendChild(body);

  return card;
}
