# Brief de Producción — Reel 04/05/2026

> **Pilar:** Presentación de marca  
> **Formato:** Reel (8–12 segundos)  
> **Resolución:** 1080 × 1920 px (9:16 vertical)  
> **Plataformas:** Instagram Reels / TikTok  
> **Personas objetivo:** Ana (Administradora Consciente) / Claudia (Equilibrista Ocupada)

---

## 🎙️ Guion de voz

> *"¿Cuánto vas a pagar este mes? Si no lo sabés de memoria… Nivva te lo muestra. Probala gratis en el link de la bio."*

**Especificaciones de voz (ElevenLabs):**

| Parámetro | Valor |
|---|---|
| Idioma | Español rioplatense |
| Registro | "vos" — nunca "tú" |
| Tono | Cercano, tranquilo, sin urgencia de venta |
| Ritmo | Pausado, con pausa natural después del "…" |
| Duración objetivo | 8–10 segundos |

---

## 🎬 Storyboard — 4 escenas

| # | Escena | Descripción visual | Texto en pantalla | Duración |
|---|---|---|---|---|
| 1 | Caos / confusión | Persona frente a Excel, notas en papel, mirando el celular sin entender | *"¿Cuánto vas a pagar este mes?"* | 2–3 seg |
| 2 | Aparece Nivva | Animación de entrada: ícono/logo Nivva sobre fondo crema | *(sin texto — solo logo)* | 1–2 seg |
| 3 | Resumen del mes | Captura mobile limpia de Nivva: vista de deudas pendientes con monto total visible | *"Nivva te lo muestra."* | 3–4 seg |
| 4 | Cierre con CTA | Logo Nivva centrado + tagline + CTA | *"Probala gratis — link en bio"* | 2 seg |

---

## 📱 Capturas de pantalla requeridas

- **Vista:** Listado de deudas pendientes o resumen mensual
- **Dispositivo simulado:** Mobile — 390 px de ancho (modo iPhone en DevTools o dispositivo real)
- **Datos:** Solo ficticios (ver ejemplos abajo)
- **Estado:** Sin notificaciones reales, sin nombre de usuario real

### Datos ficticios de ejemplo

| Acreedor | Monto | Vencimiento | Estado |
|---|---|---|---|
| Banco Nación | $ 18.500 | 10/05 | Pendiente |
| Expensas | $ 42.000 | 05/05 | Pendiente |
| Tarjeta Visa | $ 67.200 | 15/05 | Pendiente |
| Netflix | $ 3.200 | 08/05 | Pendiente |

> **Total a pagar este mes: $ 130.900**

#### JSON para importar en Nivva

Copiá el bloque de abajo y guardalo como `datos-demo-reel.json`. Luego usá **Ajustes → Importar datos** en la app para cargarlo.

```json
{
  "deudas": [
    {
      "acreedor": "Banco Nación",
      "tipoDeuda": "Préstamo",
      "notas": "Datos ficticios — demo reel 04/05",
      "montos": [
        {
          "monto": 18500,
          "moneda": "ARS",
          "vencimiento": "2026-05-10",
          "periodo": "2026-05",
          "pagado": false
        }
      ]
    },
    {
      "acreedor": "Expensas",
      "tipoDeuda": "Servicio",
      "notas": "Datos ficticios — demo reel 04/05",
      "montos": [
        {
          "monto": 42000,
          "moneda": "ARS",
          "vencimiento": "2026-05-05",
          "periodo": "2026-05",
          "pagado": false
        }
      ]
    },
    {
      "acreedor": "Tarjeta Visa",
      "tipoDeuda": "Tarjeta de crédito",
      "notas": "Datos ficticios — demo reel 04/05",
      "montos": [
        {
          "monto": 67200,
          "moneda": "ARS",
          "vencimiento": "2026-05-15",
          "periodo": "2026-05",
          "pagado": false
        }
      ]
    },
    {
      "acreedor": "Netflix",
      "tipoDeuda": "Servicio",
      "notas": "Datos ficticios — demo reel 04/05",
      "montos": [
        {
          "monto": 3200,
          "moneda": "ARS",
          "vencimiento": "2026-05-08",
          "periodo": "2026-05",
          "pagado": false
        }
      ]
    }
  ]
}
```

---

## 🎨 Especificaciones visuales

| Elemento | Valor |
|---|---|
| Fondo principal | Crema Nivva `#F2EDE8` |
| Color acento / botones | Teal Nivva `#3D8F8F` |
| Texto en pantalla | Negro suave `#1A1A1A` |
| Tipografía | Sans-serif bold para hooks; sans-serif regular para subtítulos |
| Logo | Símbolo N+V (escudo teal) + wordmark NIVVA en negro |
| Subtítulos | Texto corto, una frase por escena, sobre fondo semitransparente crema |

---

## 📋 Checklist de producción

### Antes de editar
- [ ] Guion grabado en ElevenLabs (voz rioplatense, tono tranquilo)
- [ ] Capturas de pantalla tomadas con datos ficticios
- [ ] Imágenes de "caos" seleccionadas (escena 1) — con licencia verificada para uso comercial/promocional en redes, y requisitos de atribución/restricciones revisados
- [ ] Logo Nivva exportado en PNG con fondo transparente

### Durante la edición
- [ ] Resolución final: 1080 × 1920 px
- [ ] Duración total: 8–12 segundos
- [ ] Subtítulos quemados (una frase por escena)
- [ ] Colores respetan paleta Nivva
- [ ] Texto en voseo, sin "tú"
- [ ] Sin datos reales de usuarios visibles

### Antes de publicar
- [ ] El video funciona en silencio (reproducirlo en mute y verificar que se entiende)
- [ ] El CTA dice "link en la bio" (no URL directa en el video)
- [ ] Colores y logo Nivva correctos
- [ ] Caption listo (ver abajo)
- [ ] Hashtags incluidos

---

## 📝 Caption para publicación

```
Nivva es la app gratuita para registrar tus egresos, ingresos e inversiones — todo desde tu celular, sin que tus datos salgan de tu dispositivo.

Sin suscripciones. Sin cuentas. Solo vos y tus registros.

Probala en el link de la bio 👇

#Nivva #finanzaspersonales #controlfinanciero #egresos #deudas #Argentina #appgratis
```

---

## 🔗 Referencias

- [`plan-contenido-mayo-2026.md`](./plan-contenido-mayo-2026.md) — Contexto del mes completo
- [`../wiki/04-Voz-y-tono.md`](../wiki/04-Voz-y-tono.md) — Reglas de registro y copy
- [`../wiki/00-Marca.md`](../wiki/00-Marca.md) — Identidad visual Nivva
