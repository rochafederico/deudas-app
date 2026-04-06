# Microsoft Clarity: flujos y eventos a monitorear

## Configuración mínima

Para que esta instrumentación funcione en Clarity hace falta:

1. Crear un proyecto en Microsoft Clarity.
2. Copiar el **Project ID**.
3. Reemplazar en `index.html` el ID del snippet de Clarity por el del proyecto correspondiente.
4. Publicar la app con ese snippet cargado en el dominio donde se va a usar.

> Importante: los eventos **no se crean manualmente** en Clarity. Aparecen automáticamente cuando la app ejecuta `window.clarity('event', eventName)`.

## Convención de nombres

Todos los eventos se envían con prefijo por dispositivo:

- `mobile_*` cuando `window.innerWidth < 768`
- `desktop_*` cuando `window.innerWidth >= 768`

Ejemplos:

- `mobile_create_debt_started`
- `desktop_create_debt_completed`
- `mobile_shortcut_used`

## Flujos/eventos instrumentados

Usar estos nombres para filtros, segmentos, dashboards y análisis en Clarity.

### Deudas

#### Crear deuda

- `<device>_create_debt_started`
- `<device>_create_debt_completed`
- `<device>_create_debt_validation_error`
- `<device>_create_debt_abandoned`

#### Editar deuda

- `<device>_edit_debt_started`
- `<device>_edit_debt_completed`
- `<device>_edit_debt_validation_error`
- `<device>_edit_debt_abandoned`

#### Eliminar deuda

- `<device>_delete_debt_completed`

#### Duplicar cuota / monto

- `<device>_duplicate_installment_started`
- `<device>_duplicate_installment_completed`
- `<device>_duplicate_installment_abandoned`

### Pagos

- `<device>_payment_registered`
- `<device>_payment_validation_error`

### Shortcuts

- `<device>_shortcut_used`

Se dispara desde:

- tour guiado
- exportar datos
- importar datos
- eliminar todo

Tanto en:

- header
- bottom nav

### Importación y exportación

#### Exportar datos

- `<device>_export_data_started`
- `<device>_export_data_used` (exportación efectivamente ejecutada)
- `<device>_export_data_completed`
- `<device>_export_data_validation_error`

#### Importar datos

- `<device>_import_data_started`
- `<device>_import_data_used` (importación efectivamente ejecutada)
- `<device>_import_data_completed`
- `<device>_import_data_validation_error`
- `<device>_import_data_abandoned`

### Tour guiado

- `<device>_tour_started`
- `<device>_tour_completed`
- `<device>_tour_abandoned`

### Navegación mensual

- `<device>_monthly_navigation_used`

## Recomendación de configuración en Clarity

Armar al menos estos filtros o segmentos:

1. **Dispositivo**
   - `mobile_*`
   - `desktop_*`
2. **Alta fricción**
   - `*_validation_error`
   - `*_abandoned`
3. **Flujos principales**
   - `*_create_debt_*`
   - `*_payment_*`
   - `*_import_data_*`
   - `*_export_data_*`
   - `*_tour_*`

## Nota sobre metadata

La API de tracking acepta metadata para uso interno del flujo, pero hoy Clarity recibe únicamente el **nombre del evento**.

## Cómo leer `started`, `used` y `completed`

- `*_started`: el usuario abrió o inició el flujo.
- `*_used`: la acción principal del flujo se ejecutó.
- `*_completed`: el flujo cerró correctamente.

En importación/exportación hoy conviven `used` y `completed`, por lo que en dashboards conviene tratarlos como eventos complementarios y no como sinónimos.
