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

## Funcionalidades

- [x] Alta, edición y borrado de deudas
- [x] Cada deuda puede tener múltiples montos/cuotas, con moneda (ARS/USD) y fecha de vencimiento
- [x] Edición y eliminación de montos/cuotas
- [x] Navegación y filtrado por mes
- [x] Resumen mensual: muestra totales a pagar por moneda en el mes seleccionado
- [x] Confirmación contextual al borrar montos
- [x] Persistencia local en IndexedDB (los datos no salen del navegador)
- [x] Demo de datos realistas al iniciar
- [x] Duplicar montos/cuotas: permite copiar una cuota y elegir la nueva fecha de vencimiento fácilmente.
- [x] Exportar datos
 - [x] Importar datos
- [ ] Encriptar exportación
 - [x] Agregar ingresos (sueldo o ingresos sueltos) para calcular balance mensual
- [ ] Marcar montos como pagados
 - [x] Marcar montos como pagados
- [ ] Dashboard con gráficos y cálculos para ayudar en la toma de decisiones
- [ ] Mejoras en validaciones de formularios
- [ ] Onboarding/tour para nuevos usuarios
- [x] Agrupamiento de montos en la lista por acreedor, tipo, moneda o vencimiento

## Arquitectura y estructura
El proyecto está organizado en carpetas según responsabilidad:
- **components/**: Web Components para UI y lógica de interacción.
- **models/**: Modelos de datos para deudas y montos.
- **entity/**: Entidades para la persistencia en IndexedDB.
- **database/**: Inicialización, esquema y datos demo de la base de datos.
- **repository/**: Acceso y operaciones sobre los datos.
- **utils/**: Utilidades para DOM y validaciones.
- **styles/**: Estilos globales.

Cada componente y módulo está pensado para ser reutilizable y fácil de mantener.

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

Importante:
- La importación/exportación de datos está implementada. La función de importación fusiona deudas por **Acreedor + Tipo de Deuda** para evitar duplicados y agrega montos que no estén ya presentes (comparación por monto, moneda y periodo/vencimiento). Esto permite combinar backups sin crear grupos duplicados.
- Las operaciones de acceso a datos se organizan en los módulos de `src/features/**`, mientras que la infraestructura de `IndexedDB` se encuentra en `src/shared/database`, usando transacciones para consistencia.

## Licencia
MIT

---

## 🗺️ Mapa del sitio

> Estado relevado del código real. Última revisión: 2026-04-06.

- ✅ **Shell de navegación Bootstrap**
  - ✅ **Header desktop (`AppHeader`)**
    - ✅ Marca **Nivva** → redirige a `/`
    - ✅ Navegación principal: **Egresos**, **Ingresos**, **Inversiones**
    - ✅ Acciones secundarias: **⚙️ Config**, **🔔 vencimientos próximos**, **❓ tour**
  - ✅ **Bottom navbar mobile (`BottomNav`)**
    - ✅ Secciones primarias visibles: **Egresos** (`/`), **Ingresos** (`/ingresos`), **Inversiones** (`/inversiones`)
    - ✅ Acceso secundario: **⚙️ Config** abre un offcanvas, no una ruta

### Rutas primarias implementadas

- ✅ **Egresos** (`/`)
  - ✅ Vista inicial de la app
  - ✅ Indicadores globales arriba del contenido
  - ✅ Encabezado **Resumen** + selector global de mes
  - ✅ Lista/tablas de cuotas del mes
  - ✅ Agrupación por acreedor, tipo, moneda o vencimiento
  - ✅ Alta/edición de deuda en modal
  - ✅ Detalle de deuda en modal
  - ✅ Marcar cuotas como pagadas
  - ✅ Duplicar cuotas / montos
  - ⏳ Dashboard dedicado

- ✅ **Ingresos** (`/ingresos`)
  - ✅ Alta de ingreso en modal
  - ✅ Totales del mes
  - ✅ Historial/listado en tabla
  - ✅ Usa el selector global de mes
  - ⏳ Filtro por categoría

- ✅ **Inversiones** (`/inversiones`)
  - ✅ Alta de inversión
  - ✅ Registro de nuevos valores
  - ✅ Listado e historial de valores
  - ✅ Total invertido por moneda
  - 🚧 Rendimiento básico *(hay comparación de valores, pero no gráficos ni analytics dedicados)*

### Rutas secundarias

- ✅ No hay rutas secundarias implementadas además de `/`, `/ingresos` y `/inversiones`
- 🚧 `src/pages/Dashboard.js` existe como placeholder, pero no está conectado al router ni a la navegación Bootstrap
- ⏳ No existen rutas dedicadas para configuración, ayuda, notificaciones o reportes

### Acciones secundarias y modales (sin ruta propia)

- ✅ **⚙️ Config** *(dropdown en desktop, offcanvas en mobile)*
  - ✅ Exportar datos
  - ✅ Importar datos
  - ✅ Eliminar todo *(borra deudas, ingresos e inversiones)*
- ✅ **🔔 Vencimientos próximos**
  - ✅ Popover/panel desde el header
  - ✅ Notificaciones nativas + aviso in-app
  - 🚧 Centro de notificaciones como pantalla independiente
- ✅ **❓ Tour guiado**
  - ✅ Inicio automático en primera visita
  - ✅ Inicio manual desde el header
  - ✅ Navegación por teclado
- ✅ **Otros modales implementados**
  - ✅ Deuda (alta/edición)
  - ✅ Detalle de deuda
  - ✅ Ingreso
  - ✅ Exportación / importación
  - ✅ Alta de inversión / nuevo valor

### Funcionalidades implementadas vs. pendientes

- ✅ Persistencia 100 % local en IndexedDB
- ✅ Fusión inteligente al importar *(acreedor+tipo y monto+moneda+periodo/vencimiento)*
- ✅ Resumen mensual con KPIs de ingresos, gastos, balance, total a pagar e inversiones
- ✅ Notificaciones toast (`AppToast`)
- ⏳ Página de configuración
- ⏳ Página de ayuda / FAQ
- ⏳ Dashboard analítico real
- ⏳ Rutas adicionales para reportes o vistas detalladas
