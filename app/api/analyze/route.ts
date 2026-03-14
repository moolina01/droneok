import { NextResponse } from "next/server";
import { DJILog } from "dji-log-parser-js";
import type { Frame, Details } from "dji-log-parser-js";

export const runtime = "nodejs";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertEntry = {
  key: string;
  count: number;
  severity: "critical" | "medium" | "low";
};

/** Data extracted from a single DJI log file (= one flight). */
type FlightData = {
  date: string | null;           // ISO date of the flight
  durationSeg: number;           // total flight time in seconds
  distanceKm: number | null;     // total distance in km
  maxAltitudeM: number | null;   // max altitude in meters
  model: string | null;
  productType: string | null;
  aircraftSn: string | null;
  batterySn: string | null;
  numberOfDischarges: number | null;
  batteryStartPct: number | null;
  batteryEndPct: number | null;
  tempMax: number;                // max battery temp (°C) during the flight
  devMax: number;                 // max cell voltage deviation (V)
  fullCapacitySamples: number[]; // mAh readings during flight (for trend)
  signalLossCount: number;
  failsafeCount: number;
  forcedLandingCount: number;
  lowVoltageCount: number;
  flightActions: string[];       // unique FlightAction values seen (non-None)
  appWarnings: string[];         // unique app.warn strings seen
};

/** Last N flights shown in the PDF. */
export type FlightRow = {
  date: string;
  durationMin: number;
  distanceKm: string;
  battStart: string;
  battEnd: string;
  events: string; // short summary of events in that flight
};

export type Report = {
  resumen: {
    modelo: string | null;
    productType: string | null;
    aircraftSn: string | null;
    batterySn: string | null;
    numeroVuelos: number;
    tiempoTotalSeg: number;
    distanciaTotalKm: number | null;
    rangoFechas: { desde: string | null; hasta: string | null };
  };
  bateria: {
    desviacionMaxCeldas: number | null;  // worst deviation across all flights (V)
    temperaturaMax: number | null;       // worst temperature across all flights (°C)
    capacidadActualMah: number | null;   // latest measured full capacity
    capacidadOriginalMah: number | null; // earliest measured full capacity
    degradacionPct: number | null;       // (original - current) / original * 100
    ciclosDescarga: number | null;       // number of battery discharge cycles
  };
  confiabilidad: {
    totalSignalLoss: number;
    totalFailsafe: number;
    totalForcedLanding: number;
    totalLowVoltage: number;
    vuelosConEventos: number;     // how many flights had at least one event
  };
  ultimosVuelos: FlightRow[];     // last 8 flights (most recent first)
  alertas: {
    top8: AlertEntry[];
    totals: { critical: number; medium: number; low: number };
  };
  findings: string[];
  score: {
    score: number;                // 0–100
    color: "Verde" | "Amarillo" | "Rojo";
    confidence: number;           // 0–1
    breakdown: { pBat: number; pRel: number; pAlt: number };
    reasons: string[];
  };
};

// ─── Utilities ────────────────────────────────────────────────────────────────

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

const toNum = (x: unknown, fallback = NaN): number => {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
};

const lerp = (x: number, x0: number, x1: number, y0: number, y1: number): number => {
  if (x <= x0) return y0;
  if (x >= x1) return y1;
  return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
};

function isoFromMs(ms: number | null | undefined): string | null {
  if (!ms || !Number.isFinite(ms)) return null;
  try { return new Date(ms).toISOString(); } catch { return null; }
}

function normalizeStr(s: unknown): string | null {
  const t = String(s ?? "").trim();
  return t.length > 0 && t !== "0" ? t : null;
}

function productTypeToStr(pt: unknown): string | null {
  if (typeof pt === "string" && pt !== "None") return pt;
  if (pt && typeof pt === "object" && "Unknown" in (pt as object)) return null;
  return null;
}

// ─── DJI single-file parser ───────────────────────────────────────────────────

/** Classify a FlightAction string into an event category. */
function classifyFlightAction(action: unknown): "failsafe" | "lowVoltage" | "forcedLanding" | "rtk" | null {
  const a = typeof action === "string" ? action : "";
  if (/GoHome|OutOfControl|MCProtect|IMUError/i.test(a)) return "failsafe";
  if (/LowVoltage|WarningPower|SeriousLow/i.test(a)) return "lowVoltage";
  if (/Landing|land/i.test(a) && !/Auto|RC|App|Api|WP/i.test(a)) return "forcedLanding";
  if (/BatteryForce|FakeBattery/i.test(a)) return "forcedLanding";
  return null;
}

/**
 * Parses a single DJI .txt log file buffer.
 * Returns null if the file is not a valid DJI log.
 */
async function parseDJIFile(buffer: Uint8Array): Promise<{ data: FlightData | null; error?: string }> {
  let parser: DJILog | null = null;
  try {
    parser = new DJILog(buffer);
    const details: Details = parser.details;

    console.log("[parseDJIFile] details:", {
      totalTime: details.totalTime,
      totalDistance: details.totalDistance,
      aircraftSn: details.aircraftSn,
      productType: String(details.productType),
      startTime: details.startTime,
    });

    // Skip files with no meaningful flight data (< 5s)
    if (!details.totalTime || details.totalTime < 5) {
      return { data: null, error: `totalTime demasiado corto: ${details.totalTime}s` };
    }

    // Try unencrypted first; if it requires keychains fetch them from DJI API.
    let frames: Frame[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let keychains: any = undefined;
    let encryptedFallback = false;
    try {
      frames = parser.frames();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/keychain/i.test(msg)) throw e;

      const apiKey = process.env.DJI_API_KEY;
      if (!apiKey) {
        encryptedFallback = true;
        console.warn("[parseDJIFile] encrypted log but DJI_API_KEY not set — using details only");
      } else {
        console.log("[parseDJIFile] fetching keychains from DJI API...");
        keychains = await parser.fetchKeychains(apiKey);
        frames = parser.frames(keychains);
        console.log("[parseDJIFile] decrypted with keychain, frames:", frames.length);
      }
    }
    console.log("[parseDJIFile] frames:", frames.length, encryptedFallback ? "(details-only fallback)" : "");

    // ── Raw records (pass keychains so encrypted logs are also readable) ──────
    // raw records contain richer battery data: numberOfDischarges, full cell
    // voltage per cell, temperature, etc. — more reliable than frame sampling.
    type RawRecord = { type: string; content: Record<string, unknown> };
    let numberOfDischarges: number | null = null;
    let tempMaxFromRecords = -Infinity;
    let devMaxFromRecords  = 0;
    const fullCapFromRecords: number[] = [];

    try {
      // Try with keychains first (decrypted), fall back to plain call
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records: RawRecord[] = keychains != null
        ? (parser as any).records(keychains)
        : parser.records();

      for (const rec of records) {
        const c = rec.content;
        if (rec.type === "CenterBattery" || rec.type === "SmartBattery") {
          if (numberOfDischarges == null && typeof c.numberOfDischarges === "number" && c.numberOfDischarges > 0) {
            numberOfDischarges = c.numberOfDischarges;
          }
          if (typeof c.temperature === "number" && Number.isFinite(c.temperature) && c.temperature > 0) {
            tempMaxFromRecords = Math.max(tempMaxFromRecords, c.temperature);
          }
          if (typeof c.maxCellVoltageDeviation === "number" && Number.isFinite(c.maxCellVoltageDeviation)) {
            devMaxFromRecords = Math.max(devMaxFromRecords, c.maxCellVoltageDeviation);
          }
          if (typeof c.fullCapacity === "number" && c.fullCapacity > 100) {
            fullCapFromRecords.push(c.fullCapacity);
          }
          // Some versions expose cellVoltage1..4 — use spread to estimate deviation
          const cells = [c.cellVoltage1, c.cellVoltage2, c.cellVoltage3, c.cellVoltage4]
            .filter((v): v is number => typeof v === "number" && v > 0);
          if (cells.length >= 2) {
            const dev = Math.max(...cells) - Math.min(...cells);
            devMaxFromRecords = Math.max(devMaxFromRecords, dev);
          }
        }
      }
    } catch {
      console.warn("[parseDJIFile] records() failed — falling back to frame data only");
    }

    const startMs = details.startTime ? new Date(details.startTime).getTime() : null;

    // ── Frame pass — events + battery % + altitude ────────────────────────────
    let tempMaxFromFrames = -Infinity;
    let devMaxFromFrames  = 0;
    const fullCapFromFrames: number[] = [];
    let batteryStartPct: number | null = null;
    let batteryEndPct: number | null = null;
    let maxAltitude = 0;

    let signalLossCount = 0;
    let failsafeCount = 0;
    let forcedLandingCount = 0;
    let lowVoltageCount = 0;

    const seenActions  = new Set<string>();
    const seenWarnings = new Set<string>();

    // Dedup events with 20s window
    const lastEventTs = new Map<string, number>();
    const dedup = (key: string, tsMs: number): boolean => {
      const prev = lastEventTs.get(key);
      if (prev != null && tsMs - prev < 20_000) return false;
      lastEventTs.set(key, tsMs);
      return true;
    };

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const tsMs = startMs != null ? startMs + Math.round(frame.osd.flyTime * 1000) : i * 100;

      // Battery charge % at start and end
      if (i === 0) batteryStartPct = frame.battery.chargeLevel ?? null;
      batteryEndPct = frame.battery.chargeLevel ?? null;

      // Temperature and deviation from frames
      if (Number.isFinite(frame.battery.temperature) && frame.battery.temperature > 0) {
        tempMaxFromFrames = Math.max(tempMaxFromFrames, frame.battery.temperature);
      }
      if (Number.isFinite(frame.battery.maxCellVoltageDeviation)) {
        devMaxFromFrames = Math.max(devMaxFromFrames, frame.battery.maxCellVoltageDeviation);
      }

      // Full capacity — collect every non-zero reading (not just every 300th)
      if (Number.isFinite(frame.battery.fullCapacity) && frame.battery.fullCapacity > 100) {
        fullCapFromFrames.push(frame.battery.fullCapacity);
      }

      // Altitude
      if (Number.isFinite(frame.osd.height)) {
        maxAltitude = Math.max(maxAltitude, frame.osd.height);
      }

      // Flight action events
      const action = typeof frame.osd.flightAction === "string" ? frame.osd.flightAction : null;
      if (action && action !== "None") {
        seenActions.add(action);
        const cat = classifyFlightAction(action);
        if (cat && dedup(cat, tsMs)) {
          if (cat === "failsafe")       failsafeCount++;
          else if (cat === "forcedLanding") forcedLandingCount++;
          else if (cat === "lowVoltage")    lowVoltageCount++;
        }
      }

      // App warnings
      if (frame.app.warn && frame.app.warn.trim()) {
        const warn = frame.app.warn.trim();
        seenWarnings.add(warn);
        if (/signal lost|rc.*lost|disconnect/i.test(warn) && dedup("signal", tsMs)) {
          signalLossCount++;
        }
        if (/failsafe|go home/i.test(warn) && dedup("failsafe_warn", tsMs)) {
          failsafeCount++;
        }
      }
    }

    // ── Merge records + frames, preferring records (richer data) ─────────────
    const tempMax = tempMaxFromRecords > -Infinity ? tempMaxFromRecords
                  : tempMaxFromFrames  > -Infinity ? tempMaxFromFrames
                  : -Infinity;
    const devMax  = devMaxFromRecords  > 0 ? devMaxFromRecords  : devMaxFromFrames;
    // Deduplicate capacity readings (records may repeat values), keep unique set
    const allCaps = [...new Set([...fullCapFromRecords, ...fullCapFromFrames])].filter(c => c > 100);
    const fullCapacitySamples = allCaps;

    // For encrypted fallback (no frames at all): altitude from details
    if (encryptedFallback && details.maxHeight > 0) {
      maxAltitude = details.maxHeight;
    }

    return {
      data: {
        date: startMs ? new Date(startMs).toISOString() : null,
        durationSeg: Math.round(details.totalTime),
        distanceKm: details.totalDistance > 0 ? Math.round(details.totalDistance / 10) / 100 : null,
        maxAltitudeM: maxAltitude > 0 ? Math.round(maxAltitude) : null,
        model: normalizeStr(details.aircraftName) ?? productTypeToStr(details.productType),
        productType: productTypeToStr(details.productType),
        aircraftSn: normalizeStr(details.aircraftSn),
        batterySn: normalizeStr(details.batterySn),
        numberOfDischarges,
        // Battery and event fields will be null/0 for encrypted logs
        batteryStartPct,
        batteryEndPct,
        tempMax,
        devMax,
        fullCapacitySamples,
        signalLossCount,
        failsafeCount,
        forcedLandingCount,
        lowVoltageCount,
        flightActions: Array.from(seenActions).filter((a) => a !== "None"),
        appWarnings: Array.from(seenWarnings),
      }
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[parseDJIFile] error:", msg);
    return { data: null, error: msg };
  } finally {
    try { parser?.free(); } catch { /* wasm cleanup */ }
  }
}

// ─── Multi-flight aggregation ─────────────────────────────────────────────────

function aggregateFlights(flights: FlightData[]): Report {
  // Sort chronologically
  const sorted = [...flights].sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : 0;
    const tb = b.date ? new Date(b.date).getTime() : 0;
    return ta - tb;
  });

  const model     = sorted.find((f) => f.model)?.model ?? null;
  const productType = sorted.find((f) => f.productType)?.productType ?? null;
  const aircraftSn  = sorted.find((f) => f.aircraftSn)?.aircraftSn ?? null;
  const batterySn   = sorted.find((f) => f.batterySn)?.batterySn ?? null;

  const tiempoTotalSeg   = sorted.reduce((s, f) => s + f.durationSeg, 0);
  const distanciaTotalKm = sorted.some((f) => f.distanceKm != null)
    ? Math.round(sorted.reduce((s, f) => s + (f.distanceKm ?? 0), 0) * 100) / 100
    : null;

  const rangoDesde = sorted[0]?.date ?? null;
  const rangoHasta = sorted.at(-1)?.date ?? null;

  // Battery aggregation
  const tempMax = Math.max(...sorted.map((f) => f.tempMax).filter(Number.isFinite));
  const devMax  = Math.max(...sorted.map((f) => f.devMax).filter((d) => d > 0), 0);

  // Full capacity trend: earliest vs latest non-zero reading
  const allCaps = sorted.flatMap((f) => f.fullCapacitySamples).filter((c) => c > 100);
  const capacidadOriginalMah = allCaps.length > 0 ? allCaps[0] : null;
  const capacidadActualMah   = allCaps.length > 0 ? allCaps.at(-1)! : null;
  const degradacionPct =
    capacidadOriginalMah && capacidadActualMah
      ? Math.round(((capacidadOriginalMah - capacidadActualMah) / capacidadOriginalMah) * 1000) / 10
      : null;

  const ciclosDescarga = sorted.find((f) => f.numberOfDischarges)?.numberOfDischarges ?? null;

  // Reliability
  const totalSignalLoss   = sorted.reduce((s, f) => s + f.signalLossCount, 0);
  const totalFailsafe     = sorted.reduce((s, f) => s + f.failsafeCount, 0);
  const totalForcedLanding = sorted.reduce((s, f) => s + f.forcedLandingCount, 0);
  const totalLowVoltage   = sorted.reduce((s, f) => s + f.lowVoltageCount, 0);
  const vuelosConEventos  = sorted.filter(
    (f) => f.signalLossCount + f.failsafeCount + f.forcedLandingCount + f.lowVoltageCount > 0
  ).length;

  // Alert aggregation across all flights
  const alertMap = new Map<string, { count: number; severity: "critical" | "medium" | "low" }>();
  for (const f of sorted) {
    for (const action of f.flightActions) {
      const cat = classifyFlightAction(action);
      if (!cat) continue;
      const sev: "critical" | "medium" | "low" =
        cat === "failsafe" || cat === "forcedLanding" ? "critical" :
        cat === "lowVoltage" ? "medium" : "low";
      const prev = alertMap.get(action);
      alertMap.set(action, prev ? { count: prev.count + 1, severity: prev.severity } : { count: 1, severity: sev });
    }
    for (const w of f.appWarnings) {
      const key = w.slice(0, 50);
      const sev = /motor|esc|imu|compass|overcurrent|overheat|hardware/i.test(w) ? "critical"
        : /gps|vision|signal|calibration/i.test(w) ? "medium" : "low";
      const prev = alertMap.get(key);
      alertMap.set(key, prev ? { count: prev.count + 1, severity: prev.severity } : { count: 1, severity: sev });
    }
  }

  const alertArr: AlertEntry[] = Array.from(alertMap.entries())
    .map(([key, v]) => ({ key, count: v.count, severity: v.severity }))
    .sort((a, b) => {
      const order = { critical: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity] || b.count - a.count;
    });

  const totals = { critical: 0, medium: 0, low: 0 };
  for (const a of alertArr) totals[a.severity] += a.count;

  // Last 8 flights (most recent first)
  const ultimosVuelos: FlightRow[] = sorted.slice(-8).reverse().map((f) => {
    const eventParts: string[] = [];
    if (f.failsafeCount > 0)       eventParts.push(`${f.failsafeCount} failsafe`);
    if (f.signalLossCount > 0)     eventParts.push(`${f.signalLossCount} señal`);
    if (f.lowVoltageCount > 0)     eventParts.push(`${f.lowVoltageCount} batería baja`);
    if (f.forcedLandingCount > 0)  eventParts.push(`${f.forcedLandingCount} aterrizaje forzado`);

    return {
      date: f.date ? f.date.slice(0, 10) : "—",
      durationMin: Math.round(f.durationSeg / 60),
      distanceKm: f.distanceKm != null ? f.distanceKm.toFixed(1) : "—",
      battStart: f.batteryStartPct != null ? `${Math.round(f.batteryStartPct)}%` : "—",
      battEnd:   f.batteryEndPct   != null ? `${Math.round(f.batteryEndPct)}%` : "—",
      events: eventParts.length > 0 ? eventParts.join(", ") : "Sin eventos",
    };
  });

  const reportBase: Omit<Report, "score" | "findings"> = {
    resumen: {
      modelo: model,
      productType,
      aircraftSn,
      batterySn,
      numeroVuelos: sorted.length,
      tiempoTotalSeg,
      distanciaTotalKm,
      rangoFechas: { desde: rangoDesde, hasta: rangoHasta },
    },
    bateria: {
      desviacionMaxCeldas: devMax > 0 ? Math.round(devMax * 1000) / 1000 : null,
      temperaturaMax: tempMax > -Infinity ? Math.round(tempMax * 10) / 10 : null,
      capacidadActualMah,
      capacidadOriginalMah,
      degradacionPct,
      ciclosDescarga,
    },
    confiabilidad: {
      totalSignalLoss,
      totalFailsafe,
      totalForcedLanding,
      totalLowVoltage,
      vuelosConEventos,
    },
    ultimosVuelos,
    alertas: { top8: alertArr.slice(0, 8), totals },
  };

  const score   = computeScore(reportBase, sorted.length);
  const report: Report = { ...reportBase, score, findings: [] };
  report.findings = pickFindings(report);
  return report;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeScore(base: Omit<Report, "score" | "findings">, numFlights: number): Report["score"] {
  const b = base.bateria;
  const c = base.confiabilidad;

  // Battery penalty (max 40 pts)
  const dev  = toNum(b.desviacionMaxCeldas, 0);
  const temp = toNum(b.temperaturaMax, 0);
  const deg  = toNum(b.degradacionPct, 0);

  let pCells = 0;
  if (dev > 0.03) pCells = dev <= 0.06 ? lerp(dev, 0.03, 0.06, 0, 10) : dev <= 0.10 ? lerp(dev, 0.06, 0.10, 10, 22) : 28;

  let pTemp = 0;
  if (temp > 40) pTemp = temp <= 50 ? lerp(temp, 40, 50, 0, 6) : temp <= 60 ? lerp(temp, 50, 60, 6, 12) : 15;

  let pDeg = 0;
  if (deg > 5)  pDeg = deg <= 15 ? lerp(deg, 5, 15, 0, 6) : deg <= 30 ? lerp(deg, 15, 30, 6, 12) : 15;

  const pBat = clamp(pCells + pTemp + pDeg, 0, 40);

  // Reliability penalty (max 40 pts) — normalize per flight hour
  const H = Math.max(toNum(base.resumen.tiempoTotalSeg, 0) / 3600, 0.5);
  const fsPerH  = c.totalFailsafe      / H;
  const sigPerH = c.totalSignalLoss    / H;
  const flPerH  = c.totalForcedLanding / H;
  const lvPerH  = c.totalLowVoltage    / H;

  let pFs  = fsPerH  <= 0.1 ? 0 : fsPerH <= 0.5 ? lerp(fsPerH, 0.1, 0.5, 0, 10) : 15;
  let pSig = sigPerH <= 0.3 ? 0 : sigPerH <= 1.0 ? lerp(sigPerH, 0.3, 1.0, 0, 6) : 10;
  let pFl  = flPerH  <= 0   ? 0 : flPerH <= 0.2  ? lerp(flPerH, 0, 0.2, 0, 8)   : 12;
  let pLv  = lvPerH  <= 0.2 ? 0 : lvPerH <= 1.0  ? lerp(lvPerH, 0.2, 1.0, 0, 5) : 8;

  const pRel = clamp(pFs + pSig + pFl + pLv, 0, 40);

  // Alert penalty (max 20 pts)
  const { critical, medium, low } = base.alertas.totals;
  const pAlt = clamp(clamp(critical * 2, 0, 12) + clamp(medium * 1, 0, 6) + clamp(low * 0.3, 0, 2), 0, 20);

  // Extra penalties for incomplete data
  // ── Missing battery data: can't evaluate the most critical component (+10)
  const noBatteryData = b.desviacionMaxCeldas == null && b.temperaturaMax == null && b.capacidadActualMah == null;
  const pNoBat = noBatteryData ? 10 : 0;

  // ── Too few flights: sample not representative (+5 for 1 flight, +2 for 2)
  const pFewFlights = numFlights === 1 ? 5 : numFlights === 2 ? 2 : 0;

  const raw = clamp(100 - (pBat + pRel + pAlt + pNoBat + pFewFlights), 0, 100);

  // Confidence (0–1): reflects how complete the data is
  const conf = clamp(
    0.30 * Math.min(numFlights / 5, 1) +
    0.30 * (b.desviacionMaxCeldas != null ? 1 : 0) +
    0.20 * (b.temperaturaMax      != null ? 1 : 0) +
    0.20 * (b.ciclosDescarga       != null ? 1 : 0),
    0, 1
  );

  // Confidence adjustment: low confidence pulls the score toward 60 (uncertain zone).
  // score_adjusted = raw * conf + 60 * (1 - conf)
  // – conf 1.0 → no change
  // – conf 0.0 → score = 60 (we simply don't know enough to score higher or lower)
  const UNCERTAIN_ANCHOR = 60;
  const adjusted = Math.round(clamp(raw * conf + UNCERTAIN_ANCHOR * (1 - conf), 0, 100));

  const color: "Verde" | "Amarillo" | "Rojo" = adjusted >= 80 ? "Verde" : adjusted >= 60 ? "Amarillo" : "Rojo";

  const reasons: string[] = [];
  if (pBat > 12)       reasons.push("Indicadores de batería detectados.");
  if (pRel > 12)       reasons.push("Eventos de conexión o seguridad detectados.");
  if (pAlt > 6)        reasons.push("Alertas registradas en los vuelos.");
  if (pNoBat > 0)      reasons.push("Datos de batería no disponibles (log encriptado).");
  if (pFewFlights > 0) reasons.push(`Muestra reducida (${numFlights} vuelo${numFlights > 1 ? "s" : ""}) — el score es orientativo.`);

  return {
    score: adjusted,
    color,
    confidence: Math.round(conf * 100) / 100,
    breakdown: {
      pBat: Math.round((pBat + pNoBat) * 10) / 10,
      pRel: Math.round(pRel * 10) / 10,
      pAlt: Math.round((pAlt + pFewFlights) * 10) / 10,
    },
    reasons: reasons.length ? reasons : ["Sin señales de riesgo relevantes."],
  };
}

function pickFindings(r: Report): string[] {
  const out: string[] = [];
  const s = r.score.score;
  const b = r.bateria;
  const c = r.confiabilidad;

  if (s >= 80)      out.push("Estado general bueno según el historial de vuelos registrado.");
  else if (s >= 65) out.push("Estado aceptable — hay algunos indicadores a considerar.");
  else              out.push("Se detectaron señales relevantes. Revisar antes de comprar o vender.");

  if (b.degradacionPct != null && b.degradacionPct > 10) {
    out.push(`Batería con ${b.degradacionPct.toFixed(1)}% de degradación respecto al primer registro.`);
  }
  if (b.desviacionMaxCeldas != null && b.desviacionMaxCeldas > 0.05) {
    out.push(`Desbalance máximo entre celdas de ${b.desviacionMaxCeldas.toFixed(3)} V — revisar pack de batería.`);
  }
  if (b.temperaturaMax != null && b.temperaturaMax > 55) {
    out.push(`Temperatura máxima de batería: ${b.temperaturaMax}°C — condiciones de uso exigentes.`);
  }
  if (c.totalFailsafe > 0) {
    out.push(`${c.totalFailsafe} evento(s) de failsafe en ${r.resumen.numeroVuelos} vuelos.`);
  }
  if (c.totalSignalLoss > 0) {
    out.push(`${c.totalSignalLoss} pérdida(s) de señal registradas.`);
  }
  if (c.totalForcedLanding > 0) {
    out.push(`${c.totalForcedLanding} aterrizaje(s) forzado(s) registrado(s).`);
  }
  if (c.vuelosConEventos === 0 && r.resumen.numeroVuelos >= 3) {
    out.push("Ningún vuelo presenta eventos de alerta — historial limpio.");
  }

  // Note when battery data couldn't be read (encrypted logs)
  if (b.desviacionMaxCeldas == null && b.temperaturaMax == null && b.capacidadActualMah == null) {
    out.push("Datos de batería no disponibles (logs encriptados v13+). El resumen de vuelo sí está completo.");
  }

  return out.slice(0, 5);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ ok: false, error: "Se esperan archivos multipart/form-data." }, { status: 400 });
    }

    const form  = await req.formData();
    const uploaded = form.getAll("file") as File[];

    if (uploaded.length === 0) {
      return NextResponse.json({ ok: false, error: "No se recibieron archivos." }, { status: 400 });
    }

    // Parse each file — skip non-DJI files silently
    const flights: FlightData[] = [];
    const skipped: string[] = [];

    const parseErrors: string[] = [];

    for (const file of uploaded) {
      console.log("[analyze] file received:", file.name, file.size, "bytes");

      const name = file.name.toLowerCase();
      // Accept .txt and extensionless files (DJI sometimes drops the extension)
      if (name.includes(".") && !name.endsWith(".txt")) {
        console.log("[analyze] skipped (not .txt):", file.name);
        skipped.push(file.name);
        continue;
      }

      const buf = new Uint8Array(await file.arrayBuffer());
      const { data, error } = await parseDJIFile(buf);

      if (data) {
        flights.push(data);
      } else {
        const reason = error ?? "formato no reconocido";
        console.log("[analyze] rejected:", file.name, "—", reason);
        parseErrors.push(`${file.name}: ${reason}`);
        skipped.push(file.name);
      }
    }

    if (flights.length === 0) {
      const detail = parseErrors.length
        ? `\n\nDetalle: ${parseErrors.join("; ")}`
        : "";
      return NextResponse.json({
        ok: false,
        error: `No se pudieron leer logs DJI válidos (${uploaded.length} archivo(s) recibido(s)).${detail}`,
      }, { status: 422 });
    }

    const report = aggregateFlights(flights);

    return NextResponse.json({
      ok: true,
      reports: [report],
      meta: {
        filesProcessed: flights.length,
        filesSkipped: skipped.length,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error analizando logs";
    console.error("ANALYZE_ERROR", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
