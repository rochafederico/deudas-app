// src/routes.js
import Dashboard from '/src/pages/Dashboard.js';
import Home from '/src/pages/Home.js';

const routes = [
  { path: '/', label: 'Dashboard', component: Dashboard },
  { path: '/deudas', label: 'Deudas', component: Home },
  // ...otras rutas...
];

export default routes;
