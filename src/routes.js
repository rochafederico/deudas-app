// src/routes.js

import { navItems, DEFAULT_SUBTITLE } from './layout/navConfig.js';
import Home from '/src/pages/Home.js';
import Gastos from '/src/pages/Gastos.js';
import GastosMensual from '/src/pages/GastosMensual.js';
import Ingresos from '/src/pages/Ingresos.js';
import Inversiones from '/src/pages/Inversiones.js';

const componentMap = {
  '/': Home,
  '/gastos': Gastos,
  '/ingresos': Ingresos,
  '/inversiones': Inversiones,
};

const routes = [
  ...navItems.map(item => ({
    path: item.path,
    label: item.label,
    title: item.title,
    subtitle: item.subtitle,
    component: componentMap[item.path],
  })),
  {
    path: '/gastos/mensual',
    label: 'Cuotas del mes',
    title: 'Cuotas del mes',
    subtitle: DEFAULT_SUBTITLE,
    component: GastosMensual,
  },
];

export default routes;
