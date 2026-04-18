import '../layout/AppShell.js';

function navigate(path) {
  if (path !== window.location.pathname) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

export default function GastosMensual() {
  const wrapper = document.createElement('div');

  const backBtn = document.createElement('a');
  backBtn.href = '/gastos';
  backBtn.className = 'btn btn-outline-secondary btn-sm mb-3';
  backBtn.setAttribute('data-back-to-gastos', '');
  backBtn.innerHTML = '<i class="bi bi-arrow-left" aria-hidden="true"></i> Volver a Deudas';
  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/gastos');
  });

  wrapper.appendChild(backBtn);
  wrapper.appendChild(document.createElement('app-shell'));
  return wrapper;
}
