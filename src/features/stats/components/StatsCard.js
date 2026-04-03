// src/components/StatsCard.js
// Utiliza clases Bootstrap para las tarjetas de estadísticas
export default function StatsCard({ title = '', value = '', subtitle = '', valueClass = 'text-body' } = {}) {
  const card = document.createElement('div');
  card.className = 'card h-100 shadow-sm';

  const body = document.createElement('div');
  body.className = 'card-body text-center';

  const titleEl = document.createElement('h6');
  titleEl.className = 'card-title text-body-secondary text-uppercase small';
  titleEl.innerHTML = title;

  const valueEl = document.createElement('h4');
  valueEl.className = `card-text fw-bold mb-0 ${valueClass}`;
  valueEl.innerHTML = value;

  const subEl = document.createElement('p');
  subEl.className = 'card-text text-body-secondary small mb-1';
  subEl.textContent = subtitle || '';

  body.appendChild(titleEl);
  body.appendChild(subEl);
  body.appendChild(valueEl);
  card.appendChild(body);

  return card;
}
