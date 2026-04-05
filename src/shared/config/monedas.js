export default ['ARS', 'USD'];
export const KPI_CURRENCY = 'ARS';
const signos = { 'ARS': '$', 'USD': 'US$' };
const getSigno = (moneda) => signos[moneda] || '$';
export const formatMoneda = (valor, moneda) => {
    const signo = getSigno(moneda);
    return `${signo} ${Intl.NumberFormat('es-AR').format(valor)}`;
}