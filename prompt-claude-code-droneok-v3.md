# Prompt para Claude Code — DroneOK v3: Flujo completo

## Contexto del proyecto

Tengo una app web que ya sabes su tecnologia ya esta en claude.md

### Flujo actual (ya funciona):
1. El usuario sube una carpeta `FlightRecords/` con archivos `.txt` de DJI (via `webkitdirectory`)
2. Se parsean con `dji-log-parser-js` (v0.5.7) → extrae FlightData por vuelo
3. `aggregateFlights()` combina todos los vuelos: calcula score, degradación de batería, eventos, etc.
4. Se genera un PDF con el certificado (modelo, serial, score, batería, confiabilidad, últimos vuelos, conclusiones)
5. Cada PDF tiene un ID único (ej: `DC-BC721FEC`)

### Problema actual:
Ahora cuando presiono "Analizar y Generar PDF" el PDF se descarga directamente y ahí muere el flujo. No hay página de resultados, no hay forma de compartir, no hay verificación, y el texto del certificado es muy técnico para un comprador no-técnico.

---

## LO QUE NECESITO: 4 Features

---

### Feature 1: Página de resultados después del análisis

**Cambio de flujo principal**: Cuando el usuario presiona "Analizar y Generar PDF", en vez de descargar el PDF directamente, la app debe:

1. Parsear los logs (como ya hace)
2. Calcular el score y datos (como ya hace)
3. Generar el texto IA (Feature 3)
4. Guardar todo el certificado en storage con su ID
5. **Redirigir a `/certificate/DC-BC721FEC`** — una página de resultados completa

**La página `/certificate/:id` es la página del vendedor.** Contiene:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ✅ Certificado generado exitosamente                   │
│                                                         │
│  DJI Air 2S · Serial: 3YTSJ3V0030UH7                   │
│  Generado el 2026-03-13 · ID: DC-BC721FEC               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │           83 / 100 — BUENO                      │    │
│  │        "Sin señales relevantes"                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────┬───────────────┐                           │
│  │ Resumen  │ Datos Técnicos│                           │
│  └──────────┴───────────────┘                           │
│                                                         │
│  [Texto IA — resumen conversacional del estado]         │
│  ...                                                    │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │  📥 Descargar PDF del Certificado               │    │
│  │                                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │  🔗 Compartir certificado                       │    │
│  │                                                 │    │
│  │  Link público de verificación:                  │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │ droneok.com/verify/DC-BC721FEC   [📋]  │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  │                                                 │    │
│  │  Comparte este link con el comprador para que   │    │
│  │  pueda verificar el estado del dron.            │    │
│  │                                                 │    │
│  │  [Copiar link]  [Compartir WhatsApp]            │    │
│  │                                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  🔄 Analizar otro dron                          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Acciones en esta página:**
- **Descargar PDF**: Botón grande y claro que descarga el PDF del certificado
- **Copiar link de verificación**: Copia `droneok.com/verify/DC-BC721FEC` al clipboard con feedback visual ("¡Copiado!")
- **Compartir por WhatsApp**: Abre WhatsApp con un mensaje pre-armado tipo: "Mira el certificado de salud de mi DJI Air 2S — Score: 83/100 (Bueno). Verifica aquí: droneok.com/verify/DC-BC721FEC"
- **Analizar otro dron**: Vuelve al home / pantalla de upload

**Las 2 pestañas (Resumen / Datos Técnicos):**
- Tab "Resumen" (default): Texto IA conversacional (Feature 3)
- Tab "Datos Técnicos": Score, salud de batería, confiabilidad, tabla de últimos vuelos, conclusiones — lo que hoy muestra el PDF

---

### Feature 2: Página de verificación pública

**La página `/verify/:id` es la página del comprador.** Es casi idéntica a `/certificate/:id` pero con diferencias:

- Tiene un banner de verificación: "✓ Certificado verificado — Generado el 2026-03-12 a partir de X vuelos"
- NO tiene el botón "Analizar otro dron"
- NO tiene la sección de compartir (el comprador ya está verificando)
- SÍ tiene las 2 pestañas (Resumen IA + Datos Técnicos)
- SÍ tiene botón de descargar PDF
- Si el ID no existe: muestra estado "Certificado no encontrado — Este ID no corresponde a ningún certificado generado"
- Tiene un CTA al final tipo: "¿Vendes un dron? Genera tu certificado gratis en droneok.com"
- Debe ser mobile-friendly (el comprador probablemente lo abre desde WhatsApp en el celular)

**Nota**: `/certificate/:id` y `/verify/:id` pueden compartir el mismo componente base con props que determinen el modo (vendedor vs comprador). No duplicar código.

---

### Feature 3: Texto generado por IA

Después de calcular el score y todos los datos, llamar a la API de Claude para generar un resumen en lenguaje natural que un comprador no-técnico pueda entender.

**Dónde aparece:**
1. En la pestaña "Resumen" de `/certificate/:id` y `/verify/:id`
2. En el PDF, como sección "RESUMEN DEL ANÁLISIS" antes de los datos técnicos

**Prompt para la API:**

```typescript
const buildAIPrompt = (data: StoredCertificate): string => `
Eres un experto en drones DJI que trabaja para DroneOK, una plataforma de certificación de drones usados. Tu trabajo es explicar el estado de un dron a un comprador potencial que probablemente NO sabe nada de drones.

Genera un análisis en español de 3-4 párrafos. Debe ser conversacional, específico y honesto.

DATOS DEL DRON ANALIZADO:
========================
Modelo: ${data.droneModel}
Serial: ${data.droneSerial}
Score de salud: ${data.score}/100 — ${data.scoreLabel}
Veredicto técnico: ${data.verdict}

USO:
- Vuelos totales: ${data.totalFlights}
- Tiempo total de vuelo: ${data.totalFlightTime}
- Distancia total recorrida: ${data.totalDistance}
- Primer vuelo registrado: ${data.firstFlightDate}
- Último vuelo registrado: ${data.lastFlightDate}

BATERÍA (serial: ${data.batterySerial}):
- Capacidad actual: ${data.currentCapacity} mAh de ${data.originalCapacity} mAh originales
- Degradación: ${data.degradation}%
- Desbalance máximo entre celdas: ${data.cellImbalance}V
- Temperatura máxima registrada: ${data.maxTemp}°C
- Ciclos de descarga: ${data.dischargeCycles}

CONFIABILIDAD:
- Vuelos con eventos: ${data.flightsWithEvents}
- Pérdidas de señal: ${data.signalLoss}
- Failsafe (retorno automático al home): ${data.failsafe}
- Aterrizajes forzados: ${data.forcedLandings}
- Alertas de batería baja: ${data.lowBatteryAlerts}

REGLAS ESTRICTAS:
1. Escribe como si le hablaras a alguien que va a comprar este dron y no sabe nada técnico
2. Usa analogías cotidianas para explicar conceptos técnicos (autos, celulares, electrodomésticos)
3. Sé ESPECÍFICO: menciona los números reales, no digas "buen estado" sino "retiene el 93% de capacidad"
4. Sé HONESTO: si hay problemas, menciónalos claramente con su nivel de gravedad
5. NO inventes datos que no están en el análisis
6. Párrafo 1: resumen general (uso, antigüedad, estado general)
7. Párrafo 2: batería (componente más importante y caro)
8. Párrafo 3: confiabilidad (eventos, errores, señal)
9. Párrafo 4: recomendación final directa — ¿vale la pena comprarlo? ¿qué precauciones tomar?
10. Máximo 4 párrafos. Texto plano, sin markdown, sin bullets, sin títulos
11. Tono profesional pero accesible. No uses jerga técnica sin explicarla
`;
```

**Llamada a la API:**

```typescript
const generateAISummary = async (data: StoredCertificate): Promise<string> => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: buildAIPrompt(data) }],
      }),
    });

    const result = await response.json();
    return result.content[0].text;
  } catch (error) {
    console.error("Error generando resumen IA:", error);
    return generateFallbackSummary(data);
  }
};
```

**Fallback obligatorio** (si no hay API key o falla):

```typescript
const generateFallbackSummary = (data: StoredCertificate): string => {
  const parts: string[] = [];
  
  parts.push(
    `Este ${data.droneModel} tiene ${data.totalFlights} vuelo(s) registrado(s) entre ${data.firstFlightDate} y ${data.lastFlightDate}, con un tiempo total de vuelo de ${data.totalFlightTime} y ${data.totalDistance} recorridos. Su score de salud es ${data.score}/100 (${data.scoreLabel}).`
  );
  
  if (data.degradation < 5) {
    parts.push(`La batería se encuentra en muy buen estado, con una degradación de solo ${data.degradation}% y una capacidad actual de ${data.currentCapacity} mAh de ${data.originalCapacity} mAh originales.`);
  } else if (data.degradation < 15) {
    parts.push(`La batería muestra un desgaste moderado del ${data.degradation}%, con ${data.currentCapacity} mAh de ${data.originalCapacity} mAh originales. Esto es esperable para su nivel de uso.`);
  } else {
    parts.push(`La batería presenta una degradación del ${data.degradation}%, con ${data.currentCapacity} mAh de ${data.originalCapacity} mAh originales. Esto podría requerir reemplazo en el corto plazo.`);
  }
  
  if (data.signalLoss === 0 && data.failsafe === 0 && data.forcedLandings === 0) {
    parts.push(`No se registraron pérdidas de señal, retornos automáticos ni aterrizajes forzados. El historial de vuelo está limpio.`);
  } else {
    const issues: string[] = [];
    if (data.signalLoss > 0) issues.push(`${data.signalLoss} pérdida(s) de señal`);
    if (data.failsafe > 0) issues.push(`${data.failsafe} retorno(s) automático(s)`);
    if (data.forcedLandings > 0) issues.push(`${data.forcedLandings} aterrizaje(s) forzado(s)`);
    parts.push(`Se registraron: ${issues.join(", ")}. Estos eventos deben tenerse en cuenta al evaluar la compra.`);
  }
  
  return parts.join("\n\n");
};
```

**UX durante generación de IA:**
- Mientras se espera la respuesta de Claude, mostrar un skeleton/shimmer con texto "Generando análisis inteligente..." en el área del resumen
- Si falla, mostrar el fallback sin ningún mensaje de error visible al usuario
- No bloquear el resto de la página mientras se genera

---

### Feature 4: QR y link de verificación en el PDF

1. Agregar un código QR en el PDF que apunte a la URL de verificación. Usar `qrcode` (npm) o similar.

2. La URL debe ser configurable:
   - En desarrollo: `${window.location.origin}/verify/${certificateId}`
   - En producción: se puede setear con `VITE_APP_URL` en `.env`

3. En el PDF, agregar una sección al final:
```
──────────────────────────────────────────
Verifica este certificado en:
droneok.com/verify/DC-BC721FEC

[QR CODE]

droneok.com · Certificado generado automáticamente
a partir de los logs de vuelo DJI.
──────────────────────────────────────────
```

4. El texto IA (Feature 3) también va en el PDF como sección "RESUMEN DEL ANÁLISIS" después del score y ANTES de los datos técnicos.

---

## Estructura de datos a guardar por certificado:

```typescript
interface StoredCertificate {
  id: string;                    // DC-BC721FEC
  generatedAt: string;           // ISO date
  droneModel: string;
  droneSerial: string;
  batterySerial: string;
  score: number;                 // 0-100
  scoreLabel: string;            // "Bueno", "Excelente", etc.
  verdict: string;               // "Apto", "Requiere Revisión", etc.
  confidence: string;            // "Alta", "Media", "Baja"
  totalFlights: number;
  totalFlightTime: string;
  totalDistance: string;
  firstFlightDate: string;
  lastFlightDate: string;
  // Batería
  cellImbalance: number;
  maxTemp: number;
  currentCapacity: number;
  originalCapacity: number;
  degradation: number;
  dischargeCycles: number;
  // Confiabilidad
  flightsWithEvents: string;     // "2 / 15"
  signalLoss: number;
  failsafe: number;
  forcedLandings: number;
  lowBatteryAlerts: number;
  // Últimos vuelos
  recentFlights: Array<{
    date: string;
    duration: string;
    distance: string;
    batteryStart: number;
    batteryEnd: number;
    events: string;
  }>;
  // IA
  aiSummary: string;             // Texto generado por IA (o fallback)
  conclusions: string[];         // Conclusiones bullet (las actuales del PDF)
  // PDF
  pdfBlob?: string;              // PDF en base64 para descarga posterior (opcional)
}
```

---

## Flujo completo final:

```
[Home — HeroUpload]
        │
        │ Usuario sube carpeta FlightRecords/
        │ Click "Analizar y Generar Certificado"
        │
        ▼
[Procesamiento]
        │
        ├─ 1. Parsear .txt con dji-log-parser-js
        ├─ 2. aggregateFlights() → score + datos
        ├─ 3. Llamar API Claude → texto IA (async)
        ├─ 4. Generar PDF (con texto IA + QR)
        ├─ 5. Guardar certificado en storage (con su ID)
        │
        ▼
[Redirect a /certificate/DC-BC721FEC]
        │
        │ Página del VENDEDOR:
        │ - Score grande
        │ - Pestañas: Resumen (IA) | Datos Técnicos
        │ - Botón descargar PDF
        │ - Sección compartir: link copiable + WhatsApp
        │ - Botón "Analizar otro dron"
        │
        │ El vendedor copia el link de verificación
        │ y lo manda al comprador
        │
        ▼
[Comprador abre /verify/DC-BC721FEC]
        │
        │ Página del COMPRADOR:
        │ - Banner "✓ Certificado verificado"
        │ - Score grande
        │ - Pestañas: Resumen (IA) | Datos Técnicos
        │ - Botón descargar PDF
        │ - CTA: "¿Vendes un dron? Genera tu certificado"
        │
        ▼
[Confianza para cerrar la compra]
```

---

## Rutas de la app:

```
/                          → Home con HeroUpload
/certificate/:id          → Página de resultados del vendedor
/verify/:id               → Página de verificación del comprador
```

---

## Notas técnicas:
- React + Vite + TailwindCSS
- Parser: `dji-log-parser-js` v0.5.7
- QR: usar `qrcode` (npm) o similar
- PDF: mantener la librería actual
- API key de Anthropic: `.env` como `VITE_ANTHROPIC_API_KEY`
- Storage MVP: localStorage (la key es el certificate ID)
- Header `anthropic-dangerous-direct-browser-access` necesario para llamadas desde browser
- URL base para QR/links: usar `window.location.origin` por defecto, overrideable con `VITE_APP_URL`
- `/certificate/:id` y `/verify/:id` deben compartir componente base, diferenciando por prop `mode: "seller" | "buyer"`

## Lo que NO cambiar:
- El parseo de logs (ya funciona bien)
- La lógica de aggregateFlights() y cálculo de score
- El componente HeroUpload.tsx (solo cambiar que el submit redirige en vez de descargar)
- El nombre de campos del FlightData actual

## Prioridades si hay que hacer tradeoffs:
1. Redirect a /certificate/:id con descarga PDF + link compartir (funciona sin IA)
2. Página /verify/:id con los datos técnicos
3. Integración con API de Claude para texto IA
4. QR en el PDF
5. Texto IA en el PDF
