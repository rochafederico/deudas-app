# 04 — Voz y Tono de Nivva

> **Objetivo:** definir las reglas de registro, formalidad y estilo para todos los textos de la app.  
> **Links:** [← Home](https://github.com/rochafederico/deudas-app/wiki) | [05 — Glosario →](https://github.com/rochafederico/deudas-app/wiki/05-Glosario)

---

## 🎙️ Voz (quiénes somos)

Nivva es **una herramienta, no un asesor financiero**.  
Nuestro rol es ayudar a la persona a **registrar y visualizar** sus compromisos — no a juzgarlos, ni prometerle que va a salir de deudas.

**Carácter de la voz (fijo, no cambia):**
- Clara y directa
- Cercana sin ser informal en exceso
- Honesta sin ser fría
- Útil sin ser paternalista

---

## 🎨 Tono (cómo lo decimos según el contexto)

El tono varía según el momento de interacción:

| Contexto | Tono | Ejemplo |
|---|---|---|
| Onboarding / tour | Cálido, motivador | "Organizá tus compromisos en un solo lugar." |
| Alta de datos | Neutro, eficiente | "Agregá un egreso para empezar." |
| Confirmación / éxito | Positivo, breve | "✅ Egreso guardado." |
| Error | Claro, sin culpa | "No pudimos guardar. Revisá el formulario." |
| Advertencia / datos críticos | Firme pero no alarmista | "Esta acción elimina todos tus datos." |
| Mensajes vacíos | Motivador, orientador | "Todavía no hay egresos este mes. Agregá el primero." |
| Privacidad | Seguro, tranquilizador | "Tus datos se quedan en tu dispositivo." |

---

## 📏 Reglas de registro

### Regla 1 — Registro: vos (obligatorio)

Siempre usamos el pronombre y conjugación **vos** (segunda persona singular, rioplatense).

| ✅ Do | ❌ Don't |
|---|---|
| "Organizá tus egresos" | "Organiza tus egresos" (tú) |
| "Podés exportar tus datos" | "Puedes exportar tus datos" (tú) |
| "Asegurate de completar todos los campos" | "Asegúrate de completar todos los campos" (tú) |
| "Seleccioná un archivo" | "Selecciona un archivo" (tú) |
| "Guardá los cambios" | "Guarda los cambios" (tú) |

> **Nota:** el posesivo "tu/tus" es neutro y se mantiene igual en "vos".

---

### Regla 2 — Neutralidad lingüística (sin lunfardo)

Usamos español rioplatense **neutro**: cercano, sin jerga ni localismos que excluyan.

| ✅ Do | ❌ Don't |
|---|---|
| "Agregá un egreso" | "Metete un egreso" |
| "Revisá los datos" | "Chusmeá los datos" |
| "No pudimos guardar" | "Se cayó todo" |

---

### Regla 3 — Formalidad: cercanía sin condescendencia

Hablamos como **un compañero que sabe lo que hace**, no como un banco ni como un amigo del barrio.

| ✅ Do | ❌ Don't |
|---|---|
| "Revisá que todos los campos estén completos." | "¡Ey! Parece que te olvidaste algo 😅" |
| "No pudimos importar el archivo." | "¡Uy! Algo salió mal con tu archivito." |
| "Esta acción no se puede deshacer." | "¡Cuidado! Si hacés esto no hay vuelta atrás 😱" |

---

### Regla 4 — Voz activa y frases cortas

Preferimos oraciones en **voz activa**. Máximo 2 cláusulas por mensaje.

| ✅ Do | ❌ Don't |
|---|---|
| "Guardá el egreso antes de cerrar." | "El egreso deberá ser guardado antes de que la ventana sea cerrada." |
| "No pudimos cargar los datos. Actualizá la página." | "Se produjo un error en el proceso de carga de la información de datos del sistema." |

---

### Regla 5 — Estructura de mensajes: qué pasó + próximo paso

Todo mensaje de error o advertencia debe tener al menos: **qué pasó** + **qué hacer**.

| ✅ Do | ❌ Don't |
|---|---|
| "No pudimos exportar los datos. Intentá de nuevo." | "Error al exportar los datos." |
| "El archivo no es válido. Asegurate de usar un backup de Nivva." | "Archivo JSON no válido." |
| "El formulario tiene errores. Revisá los campos marcados en rojo." | "Formulario inválido." |

---

### Regla 6 — No prometer soluciones

Nivva es una herramienta de **registro**. No prometemos que la persona va a "salir de deudas" ni "mejorar sus finanzas".

| ✅ Do | ❌ Don't |
|---|---|
| "Organizá tus compromisos financieros." | "¡Mejorá tus finanzas con Nivva!" |
| "Registrá y visualizá lo que debés y lo que ganás." | "Tomá el control de tu dinero y liberarte de deudas." |
| "Tus datos, en tu dispositivo." | "Seguridad total garantizada." |

---

### Regla 7 — Palabras en inglés

Evitamos anglicismos en textos visibles al usuario. Solo se permiten cuando son el estándar absoluto (ej: "JSON", "email") y siempre acompañados de contexto.

| ✅ Do | ❌ Don't |
|---|---|
| "Copia de seguridad" | "backup" |
| "Archivo de exportación (.json)" | "JSON file" |
| "Comentario" (o mantener "feedback" solo en botón visible) | "feedback" como título de sección |

---

### Regla 8 — Capitalización

- **Títulos de modal/página:** primera letra mayúscula, resto minúsculas. Ej: `Agregar egreso`, `Detalle de deuda`.
- **Labels de formulario:** primera letra mayúscula, resto minúsculas. Ej: `Tipo de deuda`, `Fecha de compra`.
- **Botones (CTAs):** infinitivo con primera letra mayúscula. Ej: `Guardar`, `Cancelar`, `Agregar egreso`.
- **Toasts:** oraciones completas con punto final.

---

## 📖 Ejemplos do/don't por contexto

### Mensajes de error

| ✅ Do | ❌ Don't |
|---|---|
| "No pudimos guardar los cambios. Revisá los campos marcados." | "Error de validación." |
| "El archivo no es un backup de Nivva. Seleccioná otro archivo." | "Archivo JSON no válido. Asegúrate de que sea un backup de DeudasApp." |
| "Algo falló al eliminar. Intentá de nuevo más tarde." | "Error al cargar los módulos de datos." |
| "No pudimos exportar. Intentá de nuevo." | "Error al exportar los datos" |

### Mensajes de éxito

| ✅ Do | ❌ Don't |
|---|---|
| "✅ Egreso guardado." | "✅ Se guardó exitosamente el egreso." |
| "✅ Importación exitosa: 5 egresos, 2 ingresos." | "✅ La importación fue procesada correctamente." |
| "✅ Datos exportados." | "✅ Exportación exitosa. El archivo se descargó." (un poco largo) |

### Mensajes vacíos (empty states)

| ✅ Do | ❌ Don't |
|---|---|
| "Todavía no hay egresos este mes. Agregá el primero." | "No hay datos." |
| "No tenés ingresos registrados para este período." | "Sin registros." |
| "Este mes está vacío. Podés navegar a otro mes o agregar un egreso." | "Lista vacía." |

### Tour / onboarding

| ✅ Do | ❌ Don't |
|---|---|
| "Organizá tus compromisos en un solo lugar." | "Organize your debts here." |
| "Navegá entre meses para ver tus pagos pasados y futuros." | "Navega entre meses." (tuteo) |
| "Desde Ajustes podés hacer una copia de seguridad de tus datos." | "Desde Ajustes podés hacer un backup de tu información o restaurarla desde un archivo JSON." (técnico) |

### CTAs

| ✅ Do | ❌ Don't |
|---|---|
| `Agregar egreso` | `Nueva deuda` (sustantivo como CTA) |
| `Guardar` | `OK` |
| `Cancelar` | `Volver atrás` |
| `Eliminar todos los datos` | `Eliminar todo` (ambiguo) |

---

## 🚫 Lista de frases a evitar

| Frase a evitar | Motivo | Alternativa |
|---|---|---|
| "backup" (solo) | Anglicismo expuesto al usuario | "copia de seguridad" |
| "plata" | Coloquialismo de dinero — Nivva gestiona números, no dinero | "monto", "registros", "números" |
| "dinero" | Implica que la app maneja fondos reales — va en contra del propósito de registro | "números", "compromisos", "registros" |
| "Asegúrate" | Tuteo | "Asegurate" |
| "Selecciona" | Tuteo | "Seleccioná" |
| "Añade" | Tuteo + registros diferentes | "Agregá" |
| "módulos de datos" | Técnico, no es lenguaje del usuario | "tus datos" |
| "procesar" (como CTA) | Ambiguo | Usar verbo específico: "Importar", "Guardar" |
| "DeudasApp" | Nombre técnico del repo, no el nombre de marca | "Nivva" |
| "JSON" solo | Técnico sin contexto | "archivo de backup" o "archivo .json" |
| "¡Ey!" / "¡Uy!" | Condescendiente / infantilizante | Directo y claro |
| "garantizado" / "total" | Promesas vacías | Descripciones precisas |

---

## ✅ Checklist QA — 04-Voz y tono

- [x] Registro "vos" definido con regla explícita
- [x] Mínimo 5 pares do/don't por sección
- [x] Reglas de capitalización definidas
- [x] Regla de estructura de mensajes (qué pasó + próximo paso)
- [x] Lista de frases a evitar publicada
- [x] Links cruzados con Glosario (05) y CTAs (06)
- [x] No hay contradicciones con 00-Marca
- [x] Ejemplos cubiertos: error, éxito, vacío, tour, CTA

---

*← [03 — Manual UI](https://github.com/rochafederico/deudas-app/wiki/03-Manual-UI-Copy-Guidelines) | [05 — Glosario →](https://github.com/rochafederico/deudas-app/wiki/05-Glosario)*
