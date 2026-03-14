import { NextResponse } from "next/server";
import type { Report, FlightRow } from "@/app/api/analyze/route";
import type { StoredCertificate } from "@/types/certificate";
import { saveCertificate, generateCertificateId } from "@/lib/certificate-store";

export const runtime = "nodejs";

// ── Formatters ────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDistance(km: number | null): string {
  if (km == null) return "—";
  return `${km.toFixed(1)} km`;
}

function scoreToLabel(score: number): string {
  if (score >= 90) return "Excelente";
  if (score >= 80) return "Bueno";
  if (score >= 65) return "Aceptable";
  return "Requiere Revisión";
}

function confidenceToLabel(conf: number): string {
  if (conf >= 0.7) return "Alta";
  if (conf >= 0.4) return "Media";
  return "Baja";
}

// ── Report → StoredCertificate mapping ───────────────────────────────────────

function reportToFields(
  report: Report,
  id: string,
  aiSummary: string
): StoredCertificate {
  const r = report.resumen;
  const b = report.bateria;
  const c = report.confiabilidad;

  const totalFlights = r.numeroVuelos;

  const recentFlights: FlightRow[] = report.ultimosVuelos;

  return {
    id,
    generatedAt: new Date().toISOString(),

    droneModel:    r.modelo ?? r.productType ?? "Dron DJI",
    droneSerial:   r.aircraftSn ?? "—",
    batterySerial: r.batterySn  ?? "—",

    score:       report.score.score,
    scoreLabel:  scoreToLabel(report.score.score),
    scoreColor:  report.score.color,
    confidence:  confidenceToLabel(report.score.confidence),
    verdict:     report.score.reasons[0] ?? "—",

    totalFlights,
    totalFlightTime: formatDuration(r.tiempoTotalSeg),
    totalDistance:   formatDistance(r.distanciaTotalKm),
    firstFlightDate: r.rangoFechas.desde?.slice(0, 10) ?? "—",
    lastFlightDate:  r.rangoFechas.hasta?.slice(0, 10)  ?? "—",

    cellImbalance:    b.desviacionMaxCeldas  ?? 0,
    maxTemp:          b.temperaturaMax       ?? 0,
    currentCapacity:  b.capacidadActualMah   ?? 0,
    originalCapacity: b.capacidadOriginalMah ?? 0,
    degradation:      b.degradacionPct       ?? 0,
    dischargeCycles:  b.ciclosDescarga       ?? 0,

    flightsWithEvents: `${c.vuelosConEventos} / ${totalFlights}`,
    signalLoss:     c.totalSignalLoss,
    failsafe:       c.totalFailsafe,
    forcedLandings: c.totalForcedLanding,
    lowBatteryAlerts: c.totalLowVoltage,

    recentFlights,
    alerts:      report.alertas.top8,
    aiSummary,
    conclusions: report.findings,
    report,
  };
}

// ── AI summary ────────────────────────────────────────────────────────────────

function buildAIPrompt(cert: StoredCertificate): string {
  const batInfo = cert.currentCapacity > 0
    ? `${cert.currentCapacity}/${cert.originalCapacity} mAh (${cert.degradation}% degradación, ${cert.dischargeCycles} ciclos, desbalance ${cert.cellImbalance}V, temp. máx ${cert.maxTemp}°C)`
    : "no disponibles — log encriptado, no se pudo leer el chip de batería";

  const lowData  = cert.confidence === "Baja";
  const fewFlights = cert.totalFlights < 3;

  return `Sos un evaluador técnico de drones usados para DroneOK. Escribí un resumen en español sobre el estado de este dron.

DATOS:
- Modelo: ${cert.droneModel} | Serial: ${cert.droneSerial}
- Score: ${cert.score}/100 (${cert.scoreLabel}) | Confianza del análisis: ${cert.confidence}
- Vuelos analizados: ${cert.totalFlights} | Tiempo total: ${cert.totalFlightTime} | Distancia: ${cert.totalDistance}
- Período: ${cert.firstFlightDate} → ${cert.lastFlightDate}
- Datos de batería: ${batInfo}
- Eventos: ${cert.signalLoss} pérdidas de señal, ${cert.failsafe} failsafe, ${cert.forcedLandings} aterrizajes forzados, ${cert.lowBatteryAlerts} alertas batería baja
${lowData || fewFlights ? `- ADVERTENCIA: ${[lowData ? "confianza baja por datos insuficientes" : "", fewFlights ? `solo ${cert.totalFlights} vuelo(s) analizado(s)` : ""].filter(Boolean).join(" y ")}` : ""}

FORMATO REQUERIDO:
- Exactamente 3 párrafos cortos (3-4 oraciones cada uno)
- Párrafo 1: estado general y nivel de uso
- Párrafo 2: batería — si hay datos, analizalos con los números; si NO hay datos, explicá que no se pudieron leer y qué implica eso para la evaluación
- Párrafo 3: confiabilidad y recomendación de compra — si la confianza es baja o hay pocos vuelos, decilo explícitamente en la recomendación
- Texto plano, sin markdown, sin títulos, sin bullets
- Tono directo y honesto, sin ser alarmista ni condescendiente
- El score y la recomendación final deben ser coherentes entre sí`;
}

function generateFallbackSummary(cert: StoredCertificate): string {
  const parts: string[] = [];

  parts.push(
    `Este ${cert.droneModel} tiene ${cert.totalFlights} vuelo(s) registrado(s) entre ${cert.firstFlightDate} y ${cert.lastFlightDate}, con un tiempo total de vuelo de ${cert.totalFlightTime} y ${cert.totalDistance} recorridos. Su score de salud es ${cert.score}/100 (${cert.scoreLabel}).`
  );

  if (cert.originalCapacity > 0 && cert.currentCapacity > 0) {
    if (cert.degradation < 5) {
      parts.push(`La batería se encuentra en muy buen estado, con una degradación de solo ${cert.degradation}% y una capacidad actual de ${cert.currentCapacity} mAh de ${cert.originalCapacity} mAh originales.`);
    } else if (cert.degradation < 15) {
      parts.push(`La batería muestra un desgaste moderado del ${cert.degradation}%, con ${cert.currentCapacity} mAh de ${cert.originalCapacity} mAh originales. Esto es esperable para su nivel de uso.`);
    } else {
      parts.push(`La batería presenta una degradación del ${cert.degradation}%, con ${cert.currentCapacity} mAh de ${cert.originalCapacity} mAh originales. Esto podría requerir reemplazo en el corto plazo.`);
    }
  } else {
    parts.push(`No se pudieron leer los datos de capacidad de la batería (log encriptado). Recomendamos solicitar una demostración de vuelo antes de la compra.`);
  }

  if (cert.signalLoss === 0 && cert.failsafe === 0 && cert.forcedLandings === 0) {
    parts.push(`No se registraron pérdidas de señal, retornos automáticos ni aterrizajes forzados. El historial de vuelo está limpio.`);
  } else {
    const issues: string[] = [];
    if (cert.signalLoss > 0)     issues.push(`${cert.signalLoss} pérdida(s) de señal`);
    if (cert.failsafe > 0)       issues.push(`${cert.failsafe} retorno(s) automático(s)`);
    if (cert.forcedLandings > 0) issues.push(`${cert.forcedLandings} aterrizaje(s) forzado(s)`);
    parts.push(`Se registraron: ${issues.join(", ")}. Estos eventos deben tenerse en cuenta al evaluar la compra.`);
  }

  return parts.join("\n\n");
}

async function generateAISummary(cert: StoredCertificate): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return generateFallbackSummary(cert);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: buildAIPrompt(cert) }],
      }),
    });

    if (!res.ok) return generateFallbackSummary(cert);
    const json = await res.json();
    return (json.content?.[0]?.text as string) ?? generateFallbackSummary(cert);
  } catch {
    return generateFallbackSummary(cert);
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json() as { report: Report };
    const { report } = body;

    if (!report?.score) {
      return NextResponse.json({ ok: false, error: "Reporte inválido." }, { status: 400 });
    }

    const id = generateCertificateId();

    // Build the certificate fields first (without aiSummary)
    const partial = reportToFields(report, id, "");

    // Generate AI summary (falls back automatically if no key or error)
    const aiSummary = await generateAISummary(partial);

    const cert: StoredCertificate = { ...partial, aiSummary, report };
    saveCertificate(cert);

    return NextResponse.json({ ok: true, id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error generando certificado";
    console.error("CERTIFICATES_POST_ERROR", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
