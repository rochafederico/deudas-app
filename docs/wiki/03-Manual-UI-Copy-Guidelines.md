# 03 — Manual UI + Copy Guidelines

> **Objetivo:** guía operativa por componente Bootstrap: qué texto va, longitud, tono y plantilla aplicable.  
> **Links:** [← 02 Relevamiento](https://github.com/rochafederico/deudas-app/wiki/02-Relevamiento) | [04 — Voz y tono →](https://github.com/rochafederico/deudas-app/wiki/04-Voz-y-tono)

---

## 📌 Principios generales

1. **Cada componente tiene un rol comunicacional claro.** El copy debe reforzarlo, no confundirlo.
2. **El componente manda el contexto.** Un toast dice algo que pasó; un modal pide una decisión.
3. **Menos es más, pero completo es necesario.** Breve no es ambiguo. Ver [08-Textos breves](https://github.com/rochafederico/deudas-app/wiki/08-Textos-breves-overflow).
4. **Todo texto sigue voz/tono** definido en [04-Voz y tono](https://github.com/rochafederico/deudas-app/wiki/04-Voz-y-tono).

---

## 🔲 Botones (CTA)

**Regla:** infinitivo + objeto cuando el contexto no es suficiente.

| Tipo de botón | Patrón | Ejemplo | Bootstrap class |
|---|---|---|---|
| Acción primaria | `Verbo [objeto]` | `Guardar`, `Agregar egreso` | `btn btn-primary` / `btn btn-success` |
| Acción secundaria | `Verbo` | `Cancelar`, `Cerrar` | `btn btn-secondary` |
| Acción destructiva | `Eliminar [objeto]` | `Eliminar`, `Eliminar todos los datos` | `btn btn-danger` |
| Acción neutral | `Verbo` | `Editar`, `Ver detalle` | `btn btn-outline-*` |

**Límite:** 30 caracteres. Ver [08 — Textos breves](https://github.com/rochafederico/deudas-app/wiki/08-Textos-breves-overflow).  
**Lista completa de verbos:** ver [06 — CTAs](https://github.com/rochafederico/deudas-app/wiki/06-CTAs).

---

## 📝 Formularios

### Labels

- Formato: primera letra mayúscula, resto minúsculas. Ej: `Tipo de deuda`, `Fecha de compra`.
- Sin dos puntos al final (el `:` lo agrega el diseño/componente si aplica).
- Campos requeridos: marcados con indicador visual (asterisco o texto), no solo con `required` en HTML.

| Campo actual | ✅ Correcto | Nota |
|---|---|---|
| `Acreedor` | ✅ | |
| `Tipo de Deuda` | ❌ → `Tipo de deuda` | Mayúscula extra en "Deuda" |
| `Valor Inicial` | ❌ → `Valor inicial` | Mayúscula extra en "Inicial" |
| `Fecha Compra` | ❌ → `Fecha de compra` | Falta "de" + mayúscula extra |
| `Notas` | ✅ | |
| `Monto` | ✅ | |
| `Moneda` | ✅ | |
| `Vencimiento` | ✅ | |

### Placeholders

- Deben ser descriptivos, no repetir el label.
- Usan imperativo vos cuando son instrucciones: "Seleccioná un tipo…".
- Usan ejemplo cuando muestran formato: "ej: Banco Galicia".
- **No reemplazan al label:** la accesibilidad requiere label siempre.

### Mensajes de validación inline

- Usan template de [07 — Plantillas](https://github.com/rochafederico/deudas-app/wiki/07-Plantillas-de-mensajes) — Plantilla 7.
- Se muestran con Bootstrap `.invalid-feedback` bajo el campo.
- Límite: 80 caracteres.

**Ejemplos:**
```
✅ "El campo Acreedor es obligatorio."
✅ "Ingresá un monto mayor a 0."
✅ "Seleccioná una moneda."
✅ "Debe agregar al menos un monto antes de guardar."
```

---

## 🪟 Modales

### Títulos de modal

- Formato: primera letra mayúscula, resto minúsculas. Sin punto final.
- Máximo 45 caracteres.
- **Evitar:** incluir datos del usuario en el título (ej: no "Editar deuda de Banco Galicia").

| Título actual | Estado | Nota |
|---|---|---|
| `Agregar deuda` | ⚠️ → `Agregar egreso` | "deuda" → "egreso" según glosario |
| `Editar deuda` | ⚠️ → `Editar egreso` | idem |
| `Detalle de deuda` | ⚠️ → `Detalle del egreso` | idem |
| `Agregar ingreso` | ✅ | |
| `Enviar feedback` | ⚠️ → `Enviar comentario` | "feedback" en inglés |

> **Nota sobre "deuda" → "egreso":** esta migración de término es un cambio progresivo. La v1 de esta guía lo documenta; la implementación es una HU separada.

### Footer del modal

- Modal de formulario: 2 botones — `Cancelar` (secundario, izquierda) + `Guardar` (primario, derecha).
- Modal de confirmación destructiva: `Cancelar` + `Eliminar [objeto]`.
- Modal de solo lectura: `Cerrar` (único botón o + `Editar` a la izquierda).

---

## 🔔 Toasts / Alertas

Ver plantillas completas en [07 — Plantillas](https://github.com/rochafederico/deudas-app/wiki/07-Plantillas-de-mensajes).

| Tipo | Bootstrap | Ícono | Uso |
|---|---|---|---|
| Éxito | `text-bg-success` | ✅ | Acción completada |
| Error | `text-bg-danger` | ❌ | Acción fallida |
| Advertencia | `text-bg-warning` | ⚠️ | Resultado parcial / riesgo |
| Info | `text-bg-info` / implícito | ℹ️ | Información contextual |

**Delay actual:** 5000ms (5 segundos). Suficiente para mensajes de hasta ~100 chars a velocidad normal de lectura.

---

## 📭 Empty states

**Estructura:** descripción + acción sugerida (ver Plantilla 4 en [07 — Plantillas](https://github.com/rochafederico/deudas-app/wiki/07-Plantillas-de-mensajes)).

| Pantalla | ✅ Copy recomendado |
|---|---|
| Egresos — mes sin datos | "Todavía no hay egresos este mes. Agregá el primero." |
| Ingresos — mes sin datos | "No tenés ingresos registrados para este período." |
| Inversiones — sin datos | "Todavía no registraste inversiones. Agregá la primera." |
| Notificaciones — sin vencimientos | "No hay vencimientos próximos este mes." |

---

## 🧭 Tour (onboarding)

**Estructura por paso:**
- **Título:** sustantivo descriptivo de la función (ej: "Indicadores", "Navegación por mes").
- **Texto:** imperativo vos + beneficio concreto. Máximo 100 chars.

| # | Título actual | Texto actual | Estado | Propuesta (si aplica) |
|---|---|---|---|---|
| 1 | `Bienvenida` | "Organizá tus deudas y gastos fijos en un solo lugar" | ⚠️ | "Organizá tus compromisos financieros en un solo lugar." |
| 2 | `Indicadores` | "Acá vas a ver tu resumen mensual de un vistazo" | ✅ | — |
| 3 | `Navegación por mes` | "Navegá entre meses para ver tus pagos pasados y futuros" | ✅ | — |
| 4 | `Nueva deuda` | "Cargá tus deudas: tarjeta, alquiler, préstamos, servicios" | ⚠️ | "Cargá tus egresos: tarjeta, alquiler, préstamos y servicios." |
| 5 | `Exportar e importar datos` | "Desde Ajustes podés hacer un backup de tu información o restaurarla desde un archivo JSON" | ⚠️ | "Desde Ajustes podés hacer una copia de seguridad o restaurar tus datos." |
| 6 | `Menú de navegación` | "Explorá las distintas secciones desde acá" | ✅ | — |
| 7 | `Privacidad` | "Tus datos se guardan solo en tu navegador. Nunca se envían a ningún servidor." | ✅ | — |

---

## 🔔 Notificaciones de vencimiento

| Elemento | Copy actual | Estado |
|---|---|---|
| Título notificación nativa | "Pagos vencidos o por vencer" | ✅ |
| Panel header | "⚠️ Vencimientos próximos" | ✅ |
| Fecha relativa | "hoy", "mañana", "ayer", "hace N días", "en N días" | ✅ |
| Verbo | "Venció" / "Vence" | ✅ |

---

## 📊 Dashboard (StatsIndicators)

| Elemento | Copy actual | Estado |
|---|---|---|
| Loading | "Cargando resumen..." | ✅ |
| Error | "Error cargando resumen" | ⚠️ → "No pudimos cargar el resumen. Actualizá la página." |
| Card: ingresos | "Ingresos" | ✅ |
| Card: egresos | "Gastos" | ⚠️ Inconsistente con "Egresos" del glosario — evaluar |
| Card: balance | "Balance" | ✅ |
| Card: pendientes | "Pendientes" | ✅ |

> **Nota sobre "Gastos" vs "Egresos":** la StatsCard usa "Gastos" — el glosario define "Egreso". Esta inconsistencia está documentada. La decisión de migrar es del PO. V1 la documenta sin cambiar.

---

## ✅ Checklist QA — 03-Manual UI

- [x] Reglas de copy para botones (CTAs)
- [x] Reglas para labels de formulario y correcciones identificadas
- [x] Reglas para placeholders
- [x] Reglas para mensajes de validación inline
- [x] Reglas para títulos de modal + correcciones identificadas
- [x] Reglas para footer de modal
- [x] Reglas para toasts (referencia a plantillas)
- [x] Reglas para empty states con ejemplos
- [x] Tour: 7 pasos revisados con estado y propuesta
- [x] Notificaciones documentadas
- [x] Dashboard documentado con inconsistencia "Gastos" vs "Egresos" registrada
- [x] Links cruzados con 04, 06, 07, 08

---

*← [02 — Relevamiento](https://github.com/rochafederico/deudas-app/wiki/02-Relevamiento) | [04 — Voz y tono →](https://github.com/rochafederico/deudas-app/wiki/04-Voz-y-tono)*
