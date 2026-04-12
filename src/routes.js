// src/routes.js

import { navItems } from './layout/navConfig.js';
import Home from '/src/pages/Home.js';
import Egresos from '/src/pages/Egresos.js';
import Ingresos from '/src/pages/Ingresos.js';
import Inversiones from '/src/pages/Inversiones.js';

const componentMap = {
  '/': Home,
  '/egresos': Egresos,
  '/ingresos': Ingresos,
  '/inversiones': Inversiones,
};

const routes = navItems.map(item => ({
  path: item.path,
  label: item.label,
  component: componentMap[item.path],
}));

export default routes;
