// src/config/tables/inversionTableColumns.js
// Configuración de columnas para la tabla de inversiones

export const inversionTableColumns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'valorInicial', label: 'Valor inicial', render: row => `$ ${Intl.NumberFormat('es-AR').format(row.valorInicial)}` },
  { key: 'variacion', label: 'Variación', render: row => {
    if (row.historialValores.length === 0) return '$ 0';
    return `$ ${Intl.NumberFormat('es-AR').format(row.valorInicial - row.historialValores[row.historialValores.length - 1].valor)}`;
  } },
  { key: 'fechaCompra', label: 'Fecha compra' },
  { key: 'acciones', label: '', render: row => row._acciones && row._acciones(row) }
];
