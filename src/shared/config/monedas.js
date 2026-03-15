export default ['ARS', 'USD'];
const signos = { 'ARS': '$', 'USD': 'US$' };
const getSigno = (moneda) => signos[moneda] || '$';
export const formatMoneda = (valor, moneda) => {
    const signo = getSigno(moneda);
    return `${signo} ${Intl.NumberFormat('es-AR').format(valor)}`;
}