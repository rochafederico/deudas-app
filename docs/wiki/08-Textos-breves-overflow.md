# 08 — Textos breves + Overflow

> **Objetivo:** definir los límites de caracteres por tipo de elemento y el comportamiento ante overflow.  
> **Links:** [← 07 Plantillas](https://github.com/rochafederico/deudas-app/wiki/07-Plantillas-de-mensajes) | [QA →](https://github.com/rochafederico/deudas-app/wiki/QA-Checklist)

---

## 📏 Límites de caracteres por tipo de elemento

| Tipo de elemento | Límite recomendado | Límite máximo | Notas |
|---|---|---|---|
| **Botón (CTA)** | 20 caracteres | 30 caracteres | Si supera 20, evaluar acortar el objeto. Ej: "Agregar egreso" = 14 chars ✅ |
| **Título de modal / página** | 30 caracteres | 45 caracteres | Ej: "Detalle de deuda" = 16 chars ✅ |
| **Toast / alert breve** | 60 caracteres | 100 caracteres | Con próximo paso puede llegar a 120. Ver 07-Plantillas |
| **Tooltip / title** | 40 caracteres | 60 caracteres | Ej: "Ver vencimientos próximos" = 25 chars ✅ |
| **Label de formulario** | 20 caracteres | 35 caracteres | Ej: "Tipo de deuda" = 13 chars ✅ |
| **Placeholder de input** | 30 caracteres | 50 caracteres | Ej: "Seleccioná un tipo…" = 19 chars ✅ |
| **Mensaje de validación inline** | 60 caracteres | 80 caracteres | Debe ser completo (qué + cómo corregir) |
| **Paso de tour** | 60 caracteres | 100 caracteres | Debe ser descriptivo pero escaneable |
| **Empty state** | 60 caracteres | 100 caracteres | Puede tener 2 frases si incluye CTA contextual |
| **Ítem de navegación (nav label)** | 10 caracteres | 15 caracteres | Ej: "Inversiones" = 11 chars ✅ |
| **Título de tarjeta (StatsCard)** | 12 caracteres | 20 caracteres | Ej: "Pendientes" = 10 chars ✅ |
| **Nombre de acreedor (campo libre)** | — | 50 caracteres | Recomendación de UX, no validación estricta |
| **Notas (textarea)** | — | 500 caracteres | Campo libre con limit visual recomendado |
| **Comentario de feedback** | — | 1000 caracteres (actual) | Ya implementado con counter visible |

---

## 🔀 Comportamiento ante overflow

### Botones (CTA)

- **Prioridad:** no truncar. Si el texto no cabe, **revisar el copy**.
- **Overflow behavior:** `white-space: nowrap` + el botón se expande.
- **Bootstrap:** usar `btn btn-sm` para botones de acción secundaria; reservar `btn` (sin size) para acciones primarias.
- **En mobile:** si el botón es el único en la fila, puede ocupar el 100% del ancho (`w-100`).

```
✅ "Agregar egreso"     → cabe en 1 línea
❌ "Guardar los cambios del egreso actual"   → revisar copy → "Guardar"
```

### Títulos de modal

- **Overflow behavior:** `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` en el header del modal.
- **Alternativa:** wrap en 2 líneas si el texto lo requiere (ej: título con nombre de acreedor largo).
- **Recomendación:** los títulos no deben incluir datos variables del usuario (evitar "Editar deuda de Banco Galicia SA").

### Toasts / alertas

- **Overflow behavior:** wrap normal (multi-línea) — los toasts de Bootstrap ya lo manejan.
- **Máximo:** 2-3 líneas visible. Si el mensaje es más largo, dividir en dos toasts o usar modal.
- **El toast no se trunca:** si supera el límite recomendado, **revisar el copy**.

### Tooltips / `title`

- **Overflow behavior:** el navegador gestiona el tooltip nativo — no wrappea, se trunca en algunos OS.
- **Regla:** si el tooltip tiene más de 60 chars, dividirlo o simplificarlo.
- **Bootstrap tooltip:** soporta HTML y multi-línea — usar con moderación.

### Labels de formulario

- **Overflow behavior:** wrap natural — el label ocupa el ancho disponible.
- **Regla:** nunca truncar un label. Si es largo, simplificar el copy.
- **Responsive:** en mobile los labels se apilan sobre el input (`form-label` de Bootstrap ya lo hace).

### Placeholders

- **Overflow behavior:** texto se trunca con ellipsis en el input nativo.
- **Regla:** el placeholder debe ser legible en el ancho mínimo del campo.
- **El placeholder es ayuda, no label:** no reemplaza al `<label>` accesible.

### Nav items (BottomNav / Menu)

- **Overflow behavior:** `text-overflow: ellipsis` + `overflow: hidden` en el span de texto.
- **Regla:** máximo 2 palabras. "Inversiones" ya está en el límite.
- **Mobile:** el label se muestra bajo el ícono; si no cabe en 1 línea, evaluar abreviar.

### Empty states

- **Overflow behavior:** wrap normal — el contenedor tiene ancho responsive.
- **Regla:** máximo 2 oraciones (descripción + próximo paso).

---

## 📱 Responsive — guía por breakpoint (Bootstrap)

| Breakpoint | Valor Bootstrap | Consideraciones de copy |
|---|---|---|
| xs (default) | < 576px | Nav labels cortos; botones en columna o stack; toasts full-width. |
| sm | ≥ 576px | Botones en fila si son 2 o menos. |
| md | ≥ 768px | Cards en 2 columnas (StatsIndicators: `row-cols-sm-2`). |
| lg | ≥ 992px | Menú de navegación desktop visible; BottomNav oculta. |
| xl | ≥ 1200px | Máximo aprovechamiento de ancho; modales con `modal-lg` disponible. |

### Reglas responsive específicas

- **Modal:** en mobile, el modal ocupa toda la pantalla (`modal-fullscreen-sm-down` recomendado para formularios).
- **Tabla de montos:** en mobile puede requerir scroll horizontal (`.overflow-auto` en el wrapper — ya implementado en DebtDetailModal).
- **StatsCards:** `row-cols-1 row-cols-sm-2 row-cols-md-4` — copy de título y valor debe funcionar en mínimo 1 columna.
- **Toasts:** `position-fixed top-0 end-0` — en mobile ocupan casi el ancho completo. Asegurar que el texto sea legible en ~320px de ancho.
- **BottomNav:** 4 ítems fijos. Agregar un quinto requeriría revisar el layout.

---

## 🧪 Límites actuales de la app (implementados)

| Elemento | Implementado | Límite actual |
|---|---|---|
| Feedback comentario | ✅ `maxlength="1000"` | 1000 chars + counter visible |
| Notas de egreso | ⚠️ Sin `maxlength` explícito | Sin límite definido — pendiente |
| Acreedor | ⚠️ Sin `maxlength` explícito | Sin límite definido — pendiente |
| Descripción de ingreso | ⚠️ Sin `maxlength` explícito | Sin límite definido — pendiente |
| Nombre de inversión | ⚠️ Sin `maxlength` explícito | Sin límite definido — pendiente |

> ⏳ **Pendiente:** agregar `maxlength` con feedback visual a los campos principales. Prioridad: Acreedor (50), Notas (500), Descripción (200), Nombre inversión (100).

---

## 📐 Referencia Bootstrap — componentes relevantes

| Componente | Doc Bootstrap | Nota de uso |
|---|---|---|
| Toast | [Bootstrap Toasts](https://getbootstrap.com/docs/5.3/components/toasts/) | Delay actual: 5000ms. Cerrable con btn-close. |
| Modal | [Bootstrap Modals](https://getbootstrap.com/docs/5.3/components/modal/) | Tamaños: default, `.modal-lg`, `.modal-fullscreen-sm-down` |
| Alert | [Bootstrap Alerts](https://getbootstrap.com/docs/5.3/components/alerts/) | Para errores inline en formularios |
| Tooltip | [Bootstrap Tooltips](https://getbootstrap.com/docs/5.3/components/tooltips/) | Requiere init JS; usar para textos cortos (< 60 chars) |
| Popover | [Bootstrap Popovers](https://getbootstrap.com/docs/5.3/components/popovers/) | Usar para contenido más largo (ej: panel de notificaciones) |
| Form validation | [Bootstrap Forms](https://getbootstrap.com/docs/5.3/forms/validation/) | `.is-invalid` + `.invalid-feedback` para errores inline |

---

## ✅ Checklist QA — 08-Textos breves

- [x] Límites definidos por tipo: botón, título, toast, tooltip, label, placeholder, validación inline, tour, empty state, nav
- [x] Comportamiento overflow definido por tipo
- [x] Guía responsive con breakpoints Bootstrap
- [x] Estado actual de `maxlength` en la app documentado
- [x] Referencia a docs Bootstrap incluida
- [x] Pendientes documentados (campos sin maxlength)

---

*← [07 — Plantillas](https://github.com/rochafederico/deudas-app/wiki/07-Plantillas-de-mensajes) | [QA →](https://github.com/rochafederico/deudas-app/wiki/QA-Checklist)*
