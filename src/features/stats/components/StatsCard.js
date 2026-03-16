// src/components/StatsCard.js
// Utiliza clases Bootstrap para las tarjetas de estadísticas
export default function StatsCard({ title = '', value = '', subtitle = '', color } = {}) {
  const card = document.createElement('div');
  card.className = 'card stats-card h-100 shadow-sm';

  const body = document.createElement('div');
  body.className = 'card-body text-center';

  const titleEl = document.createElement('h6');
  titleEl.className = 'card-title text-muted';
  titleEl.innerHTML = title;

  const valueEl = document.createElement('h4');
  valueEl.className = 'card-text fw-bold';
  valueEl.innerHTML = value;

  if (color) valueEl.style.color = color;

  const subEl = document.createElement('p');
  subEl.className = 'card-text text-muted small stats-card-sub';
  subEl.textContent = subtitle || '';

  body.appendChild(titleEl);
  body.appendChild(subEl);
  body.appendChild(valueEl);
  card.appendChild(body);

  return card;
}
