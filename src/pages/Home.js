
export default function Home() {
  const container = document.createElement('div');
  container.className = 'd-flex flex-column align-items-center justify-content-center py-5 text-center text-muted';

  const msg = document.createElement('p');
  msg.className = 'mb-0';
  msg.textContent = 'Bienvenido. Usá el menú para navegar.';

  container.appendChild(msg);
  return container;
}
