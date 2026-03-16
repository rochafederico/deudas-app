// src/components/StatsCard.js
export default function StatsCard({ title = '', value = '', subtitle = '', color } = {}) {
  const card = document.createElement('div');
  card.className = 'stats-card';

  const titleEl = document.createElement('h2');
  titleEl.innerHTML = title;

  const valueEl = document.createElement('h3');
  valueEl.innerHTML = value;

  if (color) valueEl.style.color = color;

  const subEl = document.createElement('p');
  subEl.className = 'stats-card-sub';
  subEl.textContent = subtitle || '';

  card.appendChild(titleEl);
  card.appendChild(subEl);
  card.appendChild(valueEl);

  return card;
}
