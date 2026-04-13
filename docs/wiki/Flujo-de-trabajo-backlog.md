# 📌 Flujo de trabajo — Gestión de backlog y refinamiento con IA

Este documento resume el flujo de trabajo recomendado para gestionar **iniciativas, épicas, historias y ejecución** usando prompts estructurados.

El proceso está diseñado para trabajar de forma **individual con apoyo de IA**, asegurando claridad funcional, calidad y control del alcance.

---

## 🔄 Flujo de trabajo recomendado

El orden correcto del proceso es:

1. [**Prompt — 01 Definir Épica**](https://github.com/rochafederico/deudas-app/wiki/Prompt-%E2%80%94-01-Definir-%C3%89pica)
2. [**Prompt — 02 Historia**](https://github.com/rochafederico/deudas-app/wiki/Prompt-%E2%80%94-02-Historia)
3. [**Prompt — 03 DoR**](https://github.com/rochafederico/deudas-app/wiki/Prompt-%E2%80%94-03-DoR)
4. [**Prompt — 04 Tareas**](https://github.com/rochafederico/deudas-app/wiki/Prompt-%E2%80%94-04-Tareas)
5. [**Prompt — 05 Escenarios de prueba**](https://github.com/rochafederico/deudas-app/wiki/Prompt-%E2%80%94-05-Escenarios-de-prueba)
6. [**Prompt — 06 DoD**](https://github.com/rochafederico/deudas-app/wiki/Prompt-%E2%80%94-06-DoD)

---

## 1) 📗 Definir Épica
🔗 `Prompt — 01 Definir Épica`

Se utiliza para definir una **épica** alineada a una iniciativa.

### Objetivo
Traducir una necesidad de negocio en un conjunto de historias.

### Salida esperada
- objetivo de negocio
- alcance funcional
- resultado esperado
- historias sugeridas

### Resultado
La épica actúa como **padre de múltiples historias**.

---

## 2) 📘 Definir Historia
🔗 `Prompt — 02 Historia`

Se utiliza para bajar la épica a una **historia de usuario accionable**.

### Objetivo
Definir valor concreto para el usuario.

### Salida esperada
- título
- formato Como / Quiero / Para
- criterios de aceptación
- preguntas abiertas

### Resultado
La historia queda lista para refinamiento.

---

## 3) 🚦 Definition of Ready (DoR)
🔗 `Prompt — 03 DoR`

Valida si la historia está **lista para entrar a sprint / desarrollo**.

### Objetivo
Evitar ambigüedades antes de ejecutar.

### Validaciones
- claridad funcional
- dependencias
- datos
- UX/UI
- criterios testeables

### Resultado
La historia queda marcada como:
- Ready
- Parcialmente Ready
- No Ready

---

## 4) 🔧 Definir Tareas
🔗 `Prompt — 04 Tareas`

Descompone la historia en trabajo ejecutable.

### Objetivo
Transformar la historia en subtareas concretas.

### Ejemplos
- frontend
- persistencia
- validaciones
- responsive
- QA

### Resultado
Sub-issues listos para ejecución.

---

## 5) 🧪 Escenarios de prueba
🔗 `Prompt — 05 Escenarios de prueba`

Define cómo se va a validar la historia.

### Objetivo
Cubrir happy path, edge cases y no regresión.

### Incluye
- flujo principal
- errores
- casos alternativos
- mobile
- navegación

### Resultado
Base para QA manual o automatizado.

---

## 6) ✅ Definition of Done (DoD)
🔗 `Prompt — 06 DoD`

Se utiliza **al final del refinamiento**, antes del cierre.

### Objetivo
Definir cuándo la historia puede cerrarse.

### Incluye
- cumplimiento de AC
- pruebas realizadas
- no regresión
- responsive
- documentación

### Resultado
Checklist final de cierre.

---

## 🎯 Resumen ejecutivo

```text
Épica → Historia → DoR → Tareas → QA → DoD
```
