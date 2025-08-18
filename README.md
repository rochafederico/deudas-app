# Registro de Deudas

Aplicación web para gestionar deudas, montos y vencimientos usando JavaScript puro, Web Components y IndexedDB.

## Características
- **Frontend moderno:** HTML5, CSS y JavaScript sin frameworks.
- **Web Components:** UI modular con componentes personalizados (`AppShell`, `DebtForm`, `DebtList`, etc).
- **IndexedDB:** Persistencia local de datos, sin backend.
- **Modelo flexible:** Cada deuda puede tener múltiples montos, cada uno con moneda, vencimiento y periodo.
- **Navegación por mes:** Filtra y navega deudas por mes con flechas.
- **CRUD completo:** Alta, edición y borrado de deudas y montos.
- **Confirmación contextual:** Al borrar, muestra acreedor, monto, moneda, vencimiento y periodo.
- **Demo data:** Se generan datos de ejemplo realistas al iniciar.
- **Estilo oscuro:** UI moderna y responsiva.

## Estructura del Proyecto
```
index.html                # Entrada principal
styles/base.css            # Estilos globales
src/
  main.js                 # Inicialización principal
  components/             # Web Components
    AppShell.js           # Layout y navegación
    DebtForm.js           # Formulario de alta/edición
    DebtList.js           # Tabla de deudas y montos
    DebtModal.js, UiModal.js # Modales
  models/                 # Modelos de datos
    DeudaModel.js, MontoModel.js
  entity/                 # Entidades para IndexedDB
    DeudaEntity.js, MontoEntity.js
  database/               # Lógica de base de datos
    initDB.js, schema.js, seedDemo.js
  repository/             # Repositorios (acceso a datos)
    deudaRepository.js, montoRepository.js
  utils/                  # Utilidades
    dom.js                # Helpers para DOM
```

## Cómo usar
1. Clona el repositorio.
2. Abre `index.html` en tu navegador (no requiere servidor).
3. Comienza a registrar y gestionar tus deudas.

## Requisitos
- Navegador moderno compatible con Web Components y IndexedDB.

## Notas técnicas
- No se usan frameworks ni librerías externas.
- Los datos se guardan localmente en el navegador.
- El código está modularizado y es fácil de mantener.

## Licencia
MIT