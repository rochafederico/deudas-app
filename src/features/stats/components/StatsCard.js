// src/components/StatsCard.js
// Utiliza clases Bootstrap para las tarjetas de estadísticas
export default function StatsCard({ title = '', items = [], color = 'secondary' } = {}) {
  const card = document.createElement('div');
  card.className = `card h-100 border border-${color}`;

  const header = document.createElement('div');
  header.className = `card-header bg-${color} text-white text-center text-uppercase small fw-semibold`;
  header.textContent = title;

  const ul = document.createElement('ul');
  ul.className = 'list-group list-group-flush text-center';

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = `list-group-item border-0 fw-bold text-${color}`;
    li.textContent = item;
    ul.appendChild(li);
  });

  card.appendChild(header);
  card.appendChild(ul);

  return card;
}
