# QA — Checklist de validación (HU 6.11)

> **Objetivo:** checklist verificable para validar consistencia, cobertura y calidad de toda la documentación de marca y copy de Nivva.  
> **Links:** [← Home](https://github.com/rochafederico/deudas-app/wiki) | [08 — Textos breves](https://github.com/rochafederico/deudas-app/wiki/08-Textos-breves-overflow)

---

## 📋 Checklist global — Estructura y navegación

- [x] Home/índice con TOC completo y links a todas las páginas
- [x] Todas las páginas del DoR §4 existen (`00` a `08` + QA)
- [x] Naming convention `NN-Nombre` respetado en todas las páginas
- [x] Links cruzados entre páginas funcionales (a verificar en GitHub Wiki)
- [x] README.md del repo tiene link a la Wiki

---

## 📋 Checklist por página

### 00 — Marca
- [x] Propósito de la marca definido
- [x] Personalidad de la marca (atributos)
- [x] Anti-atributos ("lo que no es")
- [x] Objetivos del usuario documentados (mínimo 2)
- [x] Paleta de colores con hex definida
- [x] Tagline y nombre de marca documentados

### 01 — Competencia
- [x] 5 competidores presentes: Mobills, Monefy, Deudores - Control de Deudas, Money Lover, Spendee
- [x] Tabla comparativa publicada
- [x] Análisis de microcopy y aprendizajes accionables incluidos (5 aprendizajes)

### 02 — Relevamiento
- [x] Mapa de flujos (Mermaid) renderiza correctamente
- [x] Cubre las 4 rutas: `/`, `/egresos`, `/ingresos`, `/inversiones`
- [x] Cubre acciones secundarias: Ajustes, Tour, Notificaciones, Feedback
- [x] Cubre estados vacíos, errores, éxito, loading
- [x] Identifica tecnicismos y textos en inglés expuestos al usuario
- [x] Identifica usos de tuteo ("tú") en vez de "vos"
- [x] Identifica inconsistencias de capitalización
- [x] Tour: 7 pasos documentados
- [x] Tabla de problemas detectados con propuesta

### 03 — Manual UI
- [x] Reglas para botones/CTAs
- [x] Reglas para labels de formulario
- [x] Reglas para placeholders
- [x] Reglas para validaciones inline
- [x] Reglas para títulos de modal
- [x] Reglas para toasts y alertas
- [x] Reglas para empty states con ejemplos
- [x] Tour: estado y propuesta por paso
- [x] Dashboard: inconsistencia "Gastos" vs "Egresos" documentada

### 04 — Voz y tono
- [x] Registro "vos" definido con regla explícita
- [x] Tabla de tono por contexto
- [x] Mínimo 5 pares do/don't (en múltiples secciones)
- [x] Regla de formalidad: cercanía sin condescendencia
- [x] Regla de voz activa
- [x] Regla de estructura de mensajes (qué pasó + próximo paso)
- [x] Regla de anglicismos
- [x] Regla de capitalización
- [x] Lista de frases a evitar (10+ entradas)

### 05 — Glosario
- [x] Término aprobado + sinónimos prohibidos + definición + ejemplo de uso
- [x] Cubre: Egreso, Monto, Acreedor, Tipo de deuda, Ingreso, Inversión, Moneda, Vencimiento, Período
- [x] Cubre: Copia de seguridad, Ajustes, Balance, Pendientes, Valor inicial, Fecha de compra
- [x] Sección de términos técnicos que no deben exponerse al usuario
- [x] Regla de anglicismos por término
- [x] Cross-reference con inventario de 02-Relevamiento

### 06 — CTAs
- [x] Patrón definido (infinitivo + objeto)
- [x] Diferencia CTA vs mensaje en línea documentada
- [x] Lista de verbos permitidos con ejemplos
- [x] Lista de verbos prohibidos con alternativas
- [x] Cross-reference: cada CTA actual de la app mapeado

### 07 — Plantillas de mensajes
- [x] Estructura obligatoria definida (qué pasó + próximo paso)
- [x] Plantilla éxito con do/don't
- [x] Plantilla error con do/don't
- [x] Plantilla advertencia (acciones destructivas)
- [x] Plantilla empty state
- [x] Plantilla información/ayuda
- [x] Plantilla importación parcial
- [x] Plantilla validación inline
- [x] Tabla resumen con mapeo a componentes Bootstrap

### 08 — Textos breves + overflow
- [x] Límites por tipo: botón, título, toast, tooltip, label, placeholder, validación, tour, empty state, nav
- [x] Comportamiento overflow por tipo
- [x] Guía responsive por breakpoint Bootstrap
- [x] Estado de `maxlength` en campos actuales
- [x] Pendientes documentados (campos sin maxlength)
- [x] Links a docs Bootstrap

---

## 📋 Checklist de consistencia cross-document

- [x] El término "Egreso" (glosario 05) se usa consistentemente en los ejemplos de 04, 06, 07
- [x] Los verbos de 06-CTAs son consistentes con los ejemplos en 04-Voz y tono
- [x] Las plantillas de 07 aplican las reglas de 04 (qué pasó + próximo paso, vos, voz activa)
- [x] Los límites de 08 son consistentes con los ejemplos en 04 y 07
- [x] Los problemas de P-01, P-02, P-03 (tuteo) están documentados en 02 y tienen regla en 04
- [x] 00-Marca referencia a 04-Voz y tono (ver sección "Relación con el sistema de copy")
- [x] 01-Competencia tiene aprendizajes de microcopy accionables (5 ítems)

---

## 📋 Checklist de no regresión

- [x] Contenido de `00-Marca` completo (paleta, personalidad, atributos, objetivos del usuario)
- [x] Contenido de `01-Competencia` completo (5 competidores + aprendizajes de microcopy)
- [x] 0 cambios en código fuente de la app (`src/`) — solo Wiki + README
- [x] Cada página tiene su checklist QA embebido

---

## 📋 Escenarios de prueba — resumen de cobertura

| HP | Descripción | Estado |
|---|---|---|
| HP-01 | Estructura de Wiki creada y navegable | ✅ |
| HP-02 | Auditoría de microcopy completada (3 rutas + acciones) | ✅ |
| HP-03 | Mapa de pantallas y flujos (Mermaid) | ✅ |
| HP-04 | Plantillas reutilizables creadas | ✅ |
| HP-05 | Marca documentada: paleta, personalidad, tagline, objetivos del usuario | ✅ |
| HP-06 | Voz y tono con do/don't (mín. 5 pares) | ✅ |
| HP-07 | Glosario con términos clave | ✅ |
| HP-08 | CTAs: patrón + lista de verbos + cross-reference | ✅ |
| HP-09 | Plantillas de mensajes por tipo | ✅ |
| HP-10 | Textos breves + overflow documentados | ✅ |
| HP-11 | Checklist QA publicado | ✅ |
| HP-12 | README actualizado con link a Wiki | ✅ |

---

## 📋 Pendientes v1 (mejoras iterativas)

| ID | Ítem | Prioridad |
|---|---|---|
| PD-01 | ~~Expandir 00-Marca con Personas (mín. 2) y Brief de usuario~~ — Resuelto en esta versión | ✅ |
| PD-02 | ~~Expandir 01-Competencia con análisis de microcopy accionable~~ — Resuelto en esta versión | ✅ |
| PD-03 | Implementar correcciones de tuteo (P-01, P-02, P-03) en código | Alta |
| PD-04 | Implementar término "Egreso" en lugar de "deuda" en UI (P-06 del glosario) | Media |
| PD-05 | Agregar `maxlength` con feedback visual a campos de formulario | Media |
| PD-06 | Reemplazar `confirm()` nativo con modal propio (confirmación eliminar todo) | Media |
| PD-07 | Unificar "Gastos" vs "Egresos" en StatsCard | Baja |

---

*← [Home](https://github.com/rochafederico/deudas-app/wiki)*
