import './components/InversionesList.js';
import './components/InversionModal.js';
import './components/valorInversionModal.js';

export default function InversionesModule() {
  const container = document.createElement('div');
  const list = document.createElement('inversiones-list');
  container.appendChild(list);
  return container;
}
