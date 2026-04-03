// src/components/StatsCard.js
// Utiliza clases Bootstrap para las tarjetas de estadísticas
export default function StatsCard({ title = '', items = [], theme = 'bg-secondary text-white' } = {}) {
  const card = document.createElement('div');
  card.className = `card h-100 shadow-sm ${theme}`;

  const header = document.createElement('div');
  header.className = 'card-header bg-transparent border-bottom border-white border-opacity-25 text-center text-uppercase small fw-semibold';
  header.textContent = title;

  const ul = document.createElement('ul');
  ul.className = 'list-group list-group-flush text-center';

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'list-group-item bg-transparent border-0 fw-bold';
    li.textContent = item;
    ul.appendChild(li);
  });

  card.appendChild(header);
  card.appendChild(ul);

  return card;
}
