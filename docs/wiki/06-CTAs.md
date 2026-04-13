# 06 — Convención de CTAs

> **Objetivo:** definir el patrón de verbos, la lista de verbos permitidos y ejemplos de uso para todos los CTAs de Nivva.  
> **Links:** [← 05 Glosario](https://github.com/rochafederico/deudas-app/wiki/05-Glosario) | [07 — Plantillas →](https://github.com/rochafederico/deudas-app/wiki/07-Plantillas-de-mensajes)

---

## 📐 Patrón de CTAs

### Regla general

> **Verbo en infinitivo + objeto (opcional)**

- El verbo define la acción.
- El objeto especifica qué se acciona (puede omitirse si el contexto es claro).
- Primera letra del primer palabra en mayúscula, resto en minúsculas.

```
Agregar egreso        ← verbo + objeto
Guardar               ← verbo solo (contexto claro: modal de formulario)
Cancelar              ← verbo solo
Eliminar todos los datos  ← verbo + objeto descriptivo
Exportar datos        ← verbo + objeto
```

### ¿Por qué infinitivo y no imperativo "vos"?

- Los botones son **etiquetas de acción**, no órdenes directas.
- El infinitivo es más neutral y directo para CTAs.
- El imperativo "vos" se reserva para **mensajes en línea** (textos de orientación, onboarding, placeholder).

| Tipo de texto | Forma verbal | Ejemplo |
|---|---|---|
| Botón / CTA | Infinitivo | `Guardar`, `Agregar egreso` |
| Mensaje en línea | Imperativo (vos) | "Guardá los cambios antes de cerrar." |
| Placeholder | Imperativo (vos) | "Seleccioná un tipo…" |
| Error/ayuda | Imperativo (vos) | "Asegurate de completar todos los campos." |

---

## ✅ Lista de verbos permitidos

| Verbo | Uso en Nivva | Ejemplo de CTA |
|---|---|---|
| **Agregar** | Alta de ítems (egresos, ingresos, inversiones, montos) | `Agregar egreso`, `Agregar monto`, `Agregar inversión` |
| **Guardar** | Confirmar formulario con cambios | `Guardar`, `Guardar cambios` |
| **Cancelar** | Descartar acción/modal sin guardar | `Cancelar` |
| **Eliminar** | Borrar un ítem o todos los datos | `Eliminar`, `Eliminar todos los datos` |
| **Exportar** | Generar y descargar copia de seguridad | `Exportar datos` |
| **Importar** | Cargar datos desde archivo | `Importar datos` |
| **Ver** | Navegar al detalle de un ítem | `Ver detalle` |
| **Editar** | Abrir formulario de edición | `Editar` |
| **Duplicar** | Copiar un ítem con nuevos datos | `Duplicar` |
| **Marcar** | Cambiar estado de pago | `Marcar como pagado` |
| **Cerrar** | Cerrar modal/panel sin acción destructiva | `Cerrar` |
| **Seleccionar** | Elegir un archivo o ítem | `Seleccionar archivo` |
| **Enviar** | Enviar formulario de feedback | `Enviar` |
| **Saltar** | Omitir paso del tour | `Saltar` |
| **Siguiente** | Avanzar al siguiente paso | `Siguiente` |
| **Anterior** | Volver al paso previo | `Anterior` |

---

## 🚫 Verbos prohibidos (y sus alternativas)

| Verbo prohibido | Motivo | Alternativa |
|---|---|---|
| `Procesar` | Ambiguo, técnico | `Guardar`, `Importar` según contexto |
| `Confirmar` | Vago — ¿confirmar qué? | Verbo específico: `Eliminar`, `Guardar` |
| `Aceptar` | Formulario legal, no de acción | `Guardar` o `Continuar` |
| `OK` | Inglés, sin contexto | `Cerrar`, `Entendido`, verbo específico |
| `Submit` | Inglés | `Guardar` |
| `Subir` | Anglicismo de "upload" | `Importar datos`, `Seleccionar archivo` |
| `Borrar` | Ambiguo (¿el texto? ¿el ítem?) | `Eliminar` para destrucción permanente |
| `Reset` | Inglés | `Restablecer` (si aplica) |
| `Nuevo/a` como CTA | Sustantivo, no verbo | `Agregar [objeto]` |

---

## 📋 CTAs actuales de la app — cross-reference

| CTA actual | Pantalla | ¿Cumple patrón? | Propuesta |
|---|---|---|---|
| `Agregar monto` | DebtForm | ✅ | — |
| `Guardar` | DebtForm, MontoForm, InversionModal | ✅ | — |
| `Cancelar` | DebtForm, MontoForm, IngresoForm, InversionModal | ✅ | — |
| `Editar` | DebtForm (monto), DebtDetailModal | ✅ | — |
| `Eliminar` | DebtForm (monto), InversionesList | ✅ | — |
| `Duplicar` | DebtForm (monto) | ✅ | — |
| `Marcar como pagado` | DebtForm | ✅ | — |
| `Agregar ingreso` | IngresoForm | ✅ | — |
| `Agregar inversión` | InversionesList | ✅ | — |
| `Nuevo valor` | InversionesList | ⚠️ Sustantivo como CTA | `Agregar valor` |
| `Exportar datos` | AppHeader, BottomNav | ✅ | — |
| `Importar datos` | AppHeader, BottomNav | ✅ | — |
| `Eliminar todo` | AppHeader, BottomNav | ⚠️ Ambiguo | `Eliminar todos los datos` |
| `Seleccionar archivo` | ImportDataModal | ✅ | — |
| `📥 Importar datos` | ImportDataModal | ✅ (icono ok) | — |
| `Editar` | DebtDetailModal | ✅ | — |
| `Cerrar` | DebtDetailModal | ✅ | — |
| `Enviar` | FeedbackModal | ✅ | — |
| `Saltar` | TourTooltip | ✅ | — |
| `Anterior` | TourTooltip | ✅ | — |
| `Siguiente` | TourTooltip (implícito) | ✅ | — |

---

## 🗂️ Ejemplos por tipo de acción

### Alta / creación
```
Agregar egreso
Agregar ingreso
Agregar inversión
Agregar monto
```

### Edición / actualización
```
Guardar          ← dentro del modal de edición
Editar           ← botón que abre el modal de edición
Guardar cambios  ← si hay contexto de que ya existía el ítem
```

### Cancelación / cierre
```
Cancelar    ← para formularios (descarta cambios)
Cerrar      ← para modales de solo lectura o informativos
Saltar      ← para pasos del tour
```

### Eliminación
```
Eliminar                    ← ítem individual (el contexto es el modal/lista)
Eliminar todos los datos    ← acción global desde Ajustes
```

### Navegación de pasos
```
Anterior
Siguiente
Saltar       ← tour
```

### Exportar / Importar
```
Exportar datos
Importar datos
Seleccionar archivo
```

---

## ✅ Checklist QA — 06-CTAs

- [x] Patrón de CTAs definido (infinitivo + objeto opcional)
- [x] Diferencia entre CTA (infinitivo) y mensaje en línea (imperativo vos) documentada
- [x] Lista de verbos permitidos con ejemplos
- [x] Lista de verbos prohibidos con alternativas
- [x] Cross-reference con CTAs actuales de la app (todos mapeados)
- [x] Links cruzados con 05-Glosario y 07-Plantillas

---

*← [05 — Glosario](https://github.com/rochafederico/deudas-app/wiki/05-Glosario) | [07 — Plantillas →](https://github.com/rochafederico/deudas-app/wiki/07-Plantillas-de-mensajes)*
