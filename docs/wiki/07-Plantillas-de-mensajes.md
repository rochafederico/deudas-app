# 07 — Plantillas de mensajes

> **Objetivo:** definir la estructura obligatoria para cada tipo de mensaje de la app.  
> **Links:** [← 06 CTAs](https://github.com/rochafederico/deudas-app/wiki/06-CTAs) | [08 — Textos breves →](https://github.com/rochafederico/deudas-app/wiki/08-Textos-breves-overflow)

---

## 📐 Estructura obligatoria

Todo mensaje visible al usuario debe tener como mínimo:

```
[ícono] [Qué pasó.] [Próximo paso.]
```

| Parte | Obligatorio | Descripción |
|---|---|---|
| **Ícono** | ✅ (recomendado) | Emoji semafórico: ✅ éxito, ❌ error, ⚠️ advertencia, ℹ️ info |
| **Qué pasó** | ✅ | Descripción breve en lenguaje de usuario |
| **Próximo paso** | ✅ (en errores y advertencias) | Qué debe hacer o qué va a pasar |
| **Detalle** | ⚠️ Opcional | Solo si aporta valor; evitar si hace el mensaje muy largo |

---

## ✅ Plantilla 1 — Éxito (toast success)

**Estructura:** `✅ [Qué se hizo].`

| Campo | Descripción |
|---|---|
| Ícono | ✅ |
| Qué pasó | Acción completada en pasado simple |
| Próximo paso | No requerido (el éxito es autoexplicativo) |
| Largo máximo | 80 caracteres |

**Ejemplos:**

| ✅ Do | ❌ Don't |
|---|---|
| `✅ Egreso guardado.` | `✅ Se guardó exitosamente el egreso.` |
| `✅ Ingreso guardado.` | `✅ El ingreso fue registrado de manera correcta.` |
| `✅ Datos exportados. El archivo se descargó.` | `✅ Exportación exitosa. El archivo se descargó.` (ok, pero leve redundancia) |
| `✅ Importación exitosa: 5 egresos, 2 ingresos.` | `✅ Se importaron todos tus datos correctamente.` |
| `✅ Monto marcado como pagado.` | `✅ OK` |

---

## ❌ Plantilla 2 — Error (toast danger / alert)

**Estructura:** `❌ [Qué falló]. [Qué hacer ahora.]`

| Campo | Descripción |
|---|---|
| Ícono | ❌ |
| Qué pasó | Qué operación falló, en lenguaje de usuario |
| Próximo paso | Acción clara que puede tomar el usuario (imperativo vos) |
| Largo máximo | 120 caracteres |

**Ejemplos:**

| ✅ Do | ❌ Don't |
|---|---|
| `❌ No pudimos guardar los cambios. Revisá los campos marcados.` | `❌ Error de validación.` |
| `❌ El archivo no es válido. Asegurate de usar una copia de seguridad de Nivva.` | `❌ Archivo JSON no válido. Asegúrate de que sea un backup de DeudasApp.` |
| `❌ No pudimos importar. Revisá el archivo e intentá de nuevo.` | `❌ Error durante la importación` |
| `❌ No pudimos exportar tus datos. Intentá de nuevo.` | `❌ Error al exportar los datos` |
| `❌ Algo falló al eliminar. Intentá de nuevo más tarde.` | `❌ Error al cargar los módulos de datos.` |
| `❌ El archivo no es un JSON válido. Asegurate de que no esté dañado.` | `❌ Error al leer el archivo. Asegúrate de que sea un JSON válido.` |

---

## ⚠️ Plantilla 3 — Advertencia / confirmación destructiva

**Estructura:** `[Descripción de la consecuencia.] [Pregunta o confirmación de intención.]`

> Usado en modales de confirmación antes de acciones irreversibles.

| Campo | Descripción |
|---|---|
| Descripción | Qué va a pasar si continúan |
| Confirmación | Pregunta directa al usuario |
| Largo máximo | 150 caracteres |

**Ejemplos:**

| ✅ Do | ❌ Don't |
|---|---|
| `Vas a eliminar todos tus egresos, ingresos e inversiones. Esta acción no se puede deshacer. ¿Continuás?` | `¿Estás seguro de que deseas eliminar todos los datos?` |
| `Vas a eliminar este egreso y todos sus montos. No se puede recuperar.` | `¿Seguro que querés borrar esto?` |

---

## 📭 Plantilla 4 — Estado vacío (empty state)

**Estructura:** `[Descripción de qué no hay] + [Qué puede hacer para cambiar eso.]`

| Campo | Descripción |
|---|---|
| Descripción | Qué está vacío, en contexto del período/sección |
| Próximo paso | CTA o sugerencia de acción (imperativo vos) |
| Largo máximo | 100 caracteres |

**Ejemplos:**

| Pantalla | ✅ Do | ❌ Don't |
|---|---|---|
| DebtList (mes sin egresos) | `Todavía no hay egresos este mes. Agregá el primero.` | `No hay datos.` |
| Ingresos vacíos | `No tenés ingresos registrados para este período.` | `Sin registros.` |
| Inversiones vacías | `Todavía no registraste inversiones. Agregá la primera.` | `Lista vacía.` |
| Notificaciones sin vencimientos | `No hay vencimientos próximos. Buen momento para revisar el mes.` | `Sin vencimientos.` |

---

## ℹ️ Plantilla 5 — Información / ayuda contextual

**Estructura:** `ℹ️ [Información útil o aclaración.] [Acción opcional.]`

**Ejemplos:**

| ✅ Do | ❌ Don't |
|---|---|
| `ℹ️ Los datos se guardan solo en tu dispositivo. Hacé una copia de seguridad para no perderlos.` | `ℹ️ Información sobre privacidad.` |
| `ℹ️ La importación agrega datos sin borrar los existentes.` | `ℹ️ Nota: datos no se eliminan.` |
| `ℹ️ Sin registros: Ingresos.` | — |

---

## 🔄 Plantilla 6 — Importación parcial / advertencia con detalle

**Estructura:** `⚠️ [Resultado parcial]. [Detalle de lo que falló.]`

**Ejemplos:**

| ✅ Do | ❌ Don't |
|---|---|
| `⚠️ Importación parcial: 5 egresos importados (2 con error), 3 ingresos.` | `⚠️ Hubo errores.` |
| `⚠️ No había datos para eliminar.` | `⚠️ Warning: empty.` |

---

## 📋 Plantilla 7 — Validación de formulario

**Estructura:** `[Qué campo / qué falta]. [Cómo corregirlo.]`

> Aparece inline en el formulario, no como toast.

| Campo | Descripción |
|---|---|
| Qué falta | Nombre del campo o descripción del error |
| Cómo corregir | Imperativo vos |
| Largo máximo | 80 caracteres |

**Ejemplos:**

| ✅ Do | ❌ Don't |
|---|---|
| `El campo Acreedor es obligatorio.` | `Este campo es requerido.` |
| `Debe agregar al menos un monto antes de guardar.` | `Error en montos.` |
| `Ingresá un monto mayor a 0.` | `Monto inválido.` |
| `Seleccioná una moneda.` | `Campo requerido.` |

---

## 📊 Resumen: cuándo usar cada plantilla

| Situación | Plantilla | Componente Bootstrap |
|---|---|---|
| Acción completada con éxito | 1 — Éxito | Toast success |
| Error no recuperable | 2 — Error | Toast danger |
| Error recuperable en formulario | 7 — Validación | Alert danger inline |
| Confirmación antes de eliminar | 3 — Advertencia | Modal confirm / `confirm()` |
| Sección sin datos | 4 — Vacío | Texto inline o empty-state component |
| Información de contexto | 5 — Info | Alert info / tooltip |
| Resultado parcial / mixto | 6 — Parcial | Toast warning |
| Importación parcial | 6 — Parcial | Toast warning |

---

## ✅ Checklist QA — 07-Plantillas

- [x] Estructura obligatoria definida (qué pasó + próximo paso)
- [x] Plantilla de éxito con ejemplos do/don't
- [x] Plantilla de error con ejemplos do/don't
- [x] Plantilla de advertencia (acciones destructivas)
- [x] Plantilla de estado vacío (empty state)
- [x] Plantilla de información/ayuda
- [x] Plantilla de importación parcial/advertencia con detalle
- [x] Plantilla de validación de formulario inline
- [x] Tabla resumen con mapeo a componentes Bootstrap
- [x] Todos los mensajes actuales de la app tienen plantilla correspondiente (cross-reference con 02-Relevamiento)
- [x] Links cruzados con 04-Voz y tono y 06-CTAs

---

*← [06 — CTAs](https://github.com/rochafederico/deudas-app/wiki/06-CTAs) | [08 — Textos breves →](https://github.com/rochafederico/deudas-app/wiki/08-Textos-breves-overflow)*
