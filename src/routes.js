// src/routes.js

import Home from '/src/pages/Home.js';
import Ingresos from '/src/pages/Ingresos.js';
import Inversiones from '/src/pages/Inversiones.js';


const routes = [
  { path: '/', label: 'Egresos', component: Home },
  { path: '/ingresos', label: 'Ingresos', component: Ingresos },
  { path: '/inversiones', label: 'Inversiones', component: Inversiones },
  // { path: '/deudas', label: 'Deudas', component: Home },
  // ...otras rutas...
];

export default routes;
