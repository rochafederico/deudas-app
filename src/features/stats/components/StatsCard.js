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
    const arsEl = document.createElement('div');
    arsEl.className = `h5 fw-bold text-${color} lh-sm mb-0`;
    arsEl.textContent = items[0];
    valuesEl.appendChild(arsEl);
  }

  if (items.length > 1) {
    const usdEl = document.createElement('div');
    usdEl.className = 'fs-5 text-muted mt-1';
    usdEl.textContent = items[1];
    valuesEl.appendChild(usdEl);
  }

  body.appendChild(valuesEl);
  card.appendChild(body);

  return card;
}
