// src/components/StatsCard.js
// Utiliza clases Bootstrap para las tarjetas de estadísticas
export default function StatsCard({ title = '', items = [], valueClass = 'text-body' } = {}) {
  const card = document.createElement('div');
  card.className = 'card h-100 shadow-sm';

  const header = document.createElement('div');
  header.className = 'card-header text-center text-uppercase small text-body-secondary';
  header.textContent = title;

  const ul = document.createElement('ul');
  ul.className = 'list-group list-group-flush text-center';

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = `list-group-item fw-bold ${valueClass}`;
    li.textContent = item;
    ul.appendChild(li);
  });

  card.appendChild(header);
  card.appendChild(ul);

  return card;
}
