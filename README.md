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

> Estado relevado del código real. Última revisión: 2026-04-04.

- ✅ **NIVVA**

  - 🚧 **Inicio / Dashboard** *(la home es Egresos, no existe dashboard dedicado)*
    - ✅ KPIs
      - ✅ Ingresos
      - ✅ Gastos
      - ✅ Balance
      - ✅ Total a pagar
      - ✅ Inversiones
    - 🚧 Resumen mensual *(los KPIs muestran datos del mes, pero no hay una sección de resumen independiente)*
    - ⏳ Próximos vencimientos *(panel flotante con alertas en PR #75)*
    - ⏳ Alertas / recordatorios

  - ✅ **Movimientos**

    - ✅ Ingresos (`/ingresos`)
      - ✅ Nuevo ingreso
      - ✅ Historial
      - 🚧 Filtros por mes / categoría *(filtro por mes implementado; sin filtro por categoría)*

    - ✅ Gastos / Deudas (`/` — home)
      - ✅ Nueva deuda
      - 🚧 Próximas cuotas *(navegación por mes implementada; panel de próximos vencimientos en PR #75)*
      - ✅ Acreedores *(agrupamiento por acreedor disponible)*
      - ✅ Estado de pago *(marca pagado/pendiente por cuota)*

    - ✅ Inversiones (`/inversiones`)
      - ✅ Nuevo registro
      - ✅ Historial de valores
      - 🚧 Rendimiento *(muestra valor actual vs. inicial; sin gráficos ni % de retorno)*

  - 🚧 **Gestión de datos** *(accesible desde el menú Datos del header)*
    - ✅ Importar datos *(con previsualización y fusión inteligente por acreedor+tipo)*
    - ✅ Exportar datos *(JSON descargable con deudas, ingresos e inversiones)*
    - 🚧 Backup / restaurar *(exportar/importar cumple la función; sin flujo dedicado de backup)*
    - 🚧 Reiniciar información *("Eliminar todo" borra deudas y montos; ingresos e inversiones no se borran)*

  - ⏳ **Configuración** *(no existe página ni sección de configuración)*
    - ⏳ Moneda *(ARS/USD están hardcodeados en `monedas.js`)*
    - ⏳ Formato ARS / USD
    - ⏳ Preferencias visuales *(existe `DarkToggle.js` pero no está integrado en la UI)*
    - ⏳ Notificaciones

  - 🚧 **Ayuda**
    - ✅ Tour guiado *(9 pasos; se lanza automáticamente en el primer acceso y manualmente desde el header)*
    - 🚧 Cómo usar la app *(cubierto por el tour; sin página de ayuda independiente)*
    - ⏳ Preguntas frecuentes
    - ⏳ Contacto / feedback

### Funcionalidades adicionales encontradas en el código

- ✅ Duplicar cuotas / montos *(modal dedicado con selección de nueva fecha)*
- ✅ Agrupamiento de deudas *(por acreedor, tipo, moneda o vencimiento)*
- ✅ Múltiples cuotas por deuda *(modelo Deuda → Montos 1:N)*
- ✅ Notificaciones toast (`AppToast`)
- ✅ Persistencia 100 % local en IndexedDB *(sin backend)*
- ✅ Fusión inteligente al importar *(deduplica por acreedor+tipo y por monto+moneda+periodo)*
- ✅ Navegación por teclado en el tour *(flechas y Escape)*