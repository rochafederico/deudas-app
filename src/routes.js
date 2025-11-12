// src/routes.js
import Home from '/src/pages/Home.js';
import Ingresos from '/src/pages/Ingresos.js';

const routes = [
  { path: '/', label: 'Dashboard', component: Home },
  { path: '/ingresos', label: 'Ingresos', component: Ingresos },
  // { path: '/deudas', label: 'Deudas', component: Home },
  // ...otras rutas...
];

export default routes;
