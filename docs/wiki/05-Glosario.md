# 05 — Glosario de Nivva

> **Objetivo:** definir los términos aprobados para la UI, sus sinónimos prohibidos y ejemplos de uso.  
> **Links:** [← 04 Voz y tono](https://github.com/rochafederico/deudas-app/wiki/04-Voz-y-tono) | [06 — CTAs →](https://github.com/rochafederico/deudas-app/wiki/06-CTAs)

---

## 📖 Tabla de términos

| Término aprobado | Sinónimos prohibidos | Definición operativa | Ejemplo de uso en UI |
|---|---|---|---|
| **Egreso** | Deuda, gasto fijo, compromiso, obligación | Pago periódico o único que la persona debe realizar (alquiler, tarjeta, préstamo, servicio) | "Agregá un egreso" / "Egresos del mes" |
| **Monto** | Cuota, importe, valor, plata, precio | Cifra numérica de un pago dentro de un egreso, asociada a moneda, vencimiento y período | "Monto: $15.000 ARS" / "Agregar monto" |
| **Acreedor** | A quién le debo, prestamista, empresa | Entidad o persona a la que se le debe el pago del egreso | "Acreedor: Banco Galicia" |
| **Tipo de deuda** | Categoría, tipo, clase | Clasificación libre del egreso (ej: tarjeta, alquiler, préstamo, servicio) | "Tipo de deuda: Tarjeta de crédito" |
| **Ingreso** | Sueldo, entrada, plata que entra | Dinero recibido en un período (sueldo, honorarios, renta, etc.) | "Agregar ingreso" / "Ingresos del mes" |
| **Inversión** | Activo, ahorro invertido, capital | Dinero colocado en un instrumento financiero con historial de valores | "Agregar inversión" / "Seguimiento de inversiones" |
| **Moneda** | Divisa, currency, tipo de cambio | Unidad monetaria del monto (ARS, USD, etc.) | "Moneda: ARS" |
| **Vencimiento** | Fecha límite, due date, fecha de pago | Fecha en la que el monto debe pagarse | "Vencimiento: 10/05/2026" |
| **Período** | Mes, periodo, ciclo | Mes al que corresponde el monto (formato YYYY-MM) | "Período: 2026-04" |
| **Copia de seguridad** | backup, respaldo, archivo de exportación | Archivo .json que contiene todos los datos de la app para restaurar | "Hacé una copia de seguridad desde Ajustes." |
| **Ajustes** | Configuración, settings, opciones | Menú con acciones administrativas (exportar, importar, eliminar datos) | "Desde Ajustes podés exportar tus datos." |
| **Balance** | Saldo, diferencia, resultado | Diferencia entre ingresos y egresos del mes | "Balance: +$5.000 ARS" |
| **Pendientes** | Por pagar, a cobrar, impagos | Montos no marcados como pagados en el período | "Pendientes: $30.000 ARS" |
| **Valor inicial** | Precio de compra, costo, valor de entrada | Monto con el que se registra una inversión al darla de alta | "Valor inicial: USD 100" |
| **Fecha de compra** | Fecha inicial, fecha de entrada | Fecha en la que se registra o adquirió la inversión | "Fecha de compra: 01/01/2026" |

---

## 🔴 Términos técnicos internos — nunca mostrar al usuario

Estos términos son nombres internos del código. No deben aparecer en la UI:

| Término técnico | ¿Dónde está? | Cómo nombrarlo si es necesario |
|---|---|---|
| `DeudasApp` | Mensajes de error de import | "Nivva" |
| `tipoDeuda` | Nombre de campo JS | "Tipo de deuda" |
| `deudaId` | Base de datos | No se muestra al usuario |
| `IndexedDB` | Base de datos interna | "tu dispositivo" |
| `JSON` (solo) | Mensajes técnicos | "archivo de backup" o "archivo .json" |
| `módulos de datos` | Error interno | "tus datos" |
| `Error opening database` | Console/Error interno | No mostrar al usuario |

---

## 🌍 Anglicismos: cuándo usarlos y cuándo no

| Término | Decisión | Fundamento |
|---|---|---|
| `backup` | ❌ Prohibido en texto corriente | Usar "copia de seguridad" |
| `JSON` | ✅ Permitido cuando acompaña a "archivo" o ".json" | Es el estándar técnico universal |
| `feedback` | ⚠️ Tolerable solo en botón de FAB visible | Si se puede, usar "comentario" o "sugerencia" |
| `dashboard` | ❌ Prohibido | Usar "resumen" o "panorama" |
| `email` | ✅ Permitido | Es el estándar universal |
| `ARS` / `USD` | ✅ Permitido | Son códigos ISO de moneda |

---

## 📌 Notas de uso por término

### Egreso vs. Deuda
- La palabra **"deuda"** tiene connotación negativa y de problema. En la interfaz preferimos **"egreso"**.
- En contextos educativos o de onboarding, podemos usar "compromiso financiero" como alternativa más neutral.
- El repo se llama internamente "deudas-app" — esto es un nombre técnico, no de UI.

### Monto vs. Cuota
- **"Monto"** es el término genérico para una cifra de pago. Puede ser una cuota de tarjeta, un alquiler mensual o un pago único.
- **"Cuota"** es un término más específico (implica pagos en cuotas de crédito). No usar como sinónimo de monto en todos los contextos.

### Copia de seguridad
- El sistema exporta un archivo `.json` con todos los datos.
- En la UI: **"copia de seguridad"** (no "backup", no "exportación" como único término).
- El archivo descargado se llama `deudasapp-backup.json` internamente — no es necesario mostrarlo como nombre en la UI.

---

## ✅ Checklist QA — 05-Glosario

- [x] Cada término tiene: término aprobado, sinónimos prohibidos, definición, ejemplo de uso
- [x] Cubre: Egreso, Monto, Acreedor, Tipo de deuda, Ingreso, Inversión, Moneda, Vencimiento, Período
- [x] Cubre: Copia de seguridad, Ajustes, Balance, Pendientes
- [x] Sección de términos técnicos internos que no deben exponerse al usuario
- [x] Regla de anglicismos con decisión por término
- [x] Links cruzados con 04-Voz y tono y 06-CTAs
- [x] Consistente con inventario de 02-Relevamiento

---

*← [04 — Voz y tono](https://github.com/rochafederico/deudas-app/wiki/04-Voz-y-tono) | [06 — CTAs →](https://github.com/rochafederico/deudas-app/wiki/06-CTAs)*
