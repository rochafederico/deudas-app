// Shared navigation items used by the desktop menu (Menu.js) and mobile bottom navbar (BottomNav.js)
export const DEFAULT_SUBTITLE = 'Gestioná y visualizá la información del período seleccionado.';

export const navItems = [
  { label: 'Inicio', icon: 'bi-house', path: '/', key: 'inicio', title: 'Panorama financiero', subtitle: DEFAULT_SUBTITLE },
  { label: 'Ingresos', icon: 'bi-cash-stack', path: '/ingresos', key: 'ingresos', title: 'Ingresos del mes', subtitle: DEFAULT_SUBTITLE },
  { label: 'Deudas', icon: 'bi-wallet2', path: '/gastos', key: 'gastos', title: 'Deudas', subtitle: DEFAULT_SUBTITLE, hideMonthSelector: true },
  { label: 'Inversiones', icon: 'bi-graph-up-arrow', path: '/inversiones', key: 'inversiones', title: 'Seguimiento de inversiones', subtitle: DEFAULT_SUBTITLE },
];
