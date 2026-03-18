import { NextResponse } from "next/server";
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb, RGB } from "pdf-lib";
import { Buffer } from "buffer";
import QRCode from "qrcode";
import type { Report } from "@/app/api/analyze/route";

export const runtime = "nodejs";

// ─── Formatters ───────────────────────────────────────────────────────────────

function safe(input: unknown): string {
  return String(input ?? "")
    .replace(/[^\x00-\xFF]/g, "?")
    .replaceAll("→", "->").replaceAll("–", "-").replaceAll("—", "-")
    .replaceAll("\u201C", '"').replaceAll("\u201D", '"')
    .replaceAll("\u2018", "'").replaceAll("\u00B4", "'")
    .replaceAll("\u00A0", " ");
}

function fmtDate(iso: unknown): string {
  if (!iso) return "-";
  try { return String(iso).slice(0, 10); } catch { return String(iso); }
}

function fmtHMS(seconds: unknown): string {
  const s = Number(seconds);
  if (!Number.isFinite(s) || s <= 0) return "-";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtNum(n: unknown, dec = 1): string {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(dec) : "-";
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function scoreRGB(score: number): RGB {
  if (score >= 80) return rgb(0.20, 0.83, 0.60);  // verde  #34D399
  if (score >= 60) return rgb(0.98, 0.75, 0.14);  // ambar  #FBBF24
  if (score >= 40) return rgb(0.97, 0.53, 0.20);  // naranja
  return rgb(0.97, 0.44, 0.44);                    // rojo   #F87171
}

function scoreLabel(score: number): string {
  if (score >= 80) return "EXCELENTE";
  if (score >= 60) return "ACEPTABLE";
  if (score >= 40) return "REGULAR";
  return "RIESGO";
}

// ─── Draw context & primitives ────────────────────────────────────────────────

type Ctx = { page: PDFPage; f: PDFFont; fb: PDFFont };

function text(ctx: Ctx, str: string, x: number, y: number, size: number, bold = false, color: RGB = rgb(0.1, 0.1, 0.1)) {
  ctx.page.drawText(safe(str), { x, y, size, font: bold ? ctx.fb : ctx.f, color });
}

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, fill: RGB, stroke?: RGB, sw = 0.5) {
  ctx.page.drawRectangle({ x, y, width: w, height: h, color: fill, borderColor: stroke, borderWidth: stroke ? sw : 0 });
}

function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, col: RGB = rgb(0.85, 0.85, 0.87), lw = 0.5) {
  ctx.page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color: col, thickness: lw });
}

function pill(ctx: Ctx, x: number, y: number, w: number, label: string, value: string, col: RGB) {
  ctx.page.drawRectangle({ x, y, width: w, height: 28, color: col, opacity: 0.12, borderColor: col, borderWidth: 1 });
  text(ctx, label, x + 8, y + 17, 7.5, false, rgb(0.35, 0.35, 0.40));
  text(ctx, value, x + 8, y + 7,  9,   true,  col);
}

function sectionTitle(ctx: Ctx, title: string, x: number, y: number, w: number) {
  text(ctx, title.toUpperCase(), x, y, 8, true, rgb(0.45, 0.45, 0.50));
  line(ctx, x, y - 4, x + w, y - 4, rgb(0.88, 0.88, 0.90), 0.8);
}

// ─── Score arc gauge ──────────────────────────────────────────────────────────
// In pdf-lib drawSvgPath, transform is [1,0,0,-1,cx,cy] — y-axis is flipped.
// SVG 150° → PDF lower-left; SVG 30° → PDF lower-right; SVG 270° → PDF top.
// Going clockwise from SVG 150° to 30° (sweep=240°) draws the gauge arc
// that goes from lower-left → top → lower-right in the rendered PDF.

function arcPath(r: number, startDeg: number, sweepDeg: number): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const sx = r * Math.cos(rad(startDeg));
  const sy = r * Math.sin(rad(startDeg));
  const endDeg = startDeg + sweepDeg;
  const ex = r * Math.cos(rad(endDeg));
  const ey = r * Math.sin(rad(endDeg));
  const large = sweepDeg > 180 ? 1 : 0;
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

// ─── Findings generation ──────────────────────────────────────────────────────

type FindingLevel = "ok" | "warn" | "alert";
interface Finding { level: FindingLevel; title: string; detail: string }

function generateFindings(r: Report): Finding[] {
  const findings: Finding[] = [];
  const bat  = r.bateria;
  const conf = r.confiabilidad;
  const res  = r.resumen;

  if (bat.ciclosDescarga === 0 && res.numeroVuelos > 0) {
    findings.push({ level: "warn", title: "Inconsistencia en ciclos de bateria",
      detail: `0 ciclos registrados con ${res.numeroVuelos} vuelo(s). Posible reset de firmware.` });
  }

  if (bat.desviacionMaxCeldas != null) {
    if (bat.desviacionMaxCeldas > 0.1) {
      findings.push({ level: "alert", title: "Desbalance critico entre celdas",
        detail: `${bat.desviacionMaxCeldas.toFixed(3)}V de diferencia. Puede causar cortes inesperados.` });
    } else if (bat.desviacionMaxCeldas > 0.05) {
      findings.push({ level: "warn", title: "Desbalance entre celdas detectado",
        detail: `${bat.desviacionMaxCeldas.toFixed(3)}V de diferencia entre celdas.` });
    } else if (bat.desviacionMaxCeldas != null) {
      findings.push({ level: "ok", title: "Celdas de bateria equilibradas",
        detail: `${bat.desviacionMaxCeldas.toFixed(3)}V de desbalance. Dentro de rango normal.` });
    }
  }

  if (bat.degradacionPct != null) {
    if (bat.degradacionPct > 20) {
      findings.push({ level: "alert", title: "Degradacion significativa de bateria",
        detail: `${bat.degradacionPct.toFixed(1)}% de perdida de capacidad respecto al original.` });
    } else if (bat.degradacionPct < 5) {
      findings.push({ level: "ok", title: "Bateria en excelente condicion",
        detail: `Solo ${bat.degradacionPct.toFixed(1)}% de degradacion registrada.` });
    }
  }

  if (conf.totalForcedLanding > 0) {
    findings.push({ level: "alert", title: `${conf.totalForcedLanding} aterrizaje(s) forzado(s)`,
      detail: "Indica perdida de control o fallos criticos durante el vuelo." });
  }

  if (conf.totalFailsafe > 0) {
    findings.push({ level: "warn", title: `${conf.totalFailsafe} activacion(es) de failsafe (RTH)`,
      detail: "El dron activo retorno automatico al origen durante el vuelo." });
  }

  if (conf.totalSignalLoss > 0) {
    findings.push({ level: "warn", title: `${conf.totalSignalLoss} perdida(s) de senal registrada(s)`,
      detail: "Interferencias o vuelos fuera del rango del control." });
  }

  if (res.numeroVuelos < 5) {
    findings.push({ level: "warn", title: "Historial extremadamente limitado",
      detail: `Solo ${res.numeroVuelos} vuelo(s) analizados. El score puede no reflejar el estado real.` });
  }

  if (conf.totalForcedLanding === 0 && conf.totalFailsafe === 0 && conf.totalSignalLoss === 0) {
    findings.push({ level: "ok", title: "Sin eventos criticos detectados",
      detail: "No se registraron aterrizajes forzados, failsafe ni perdidas de senal." });
  }

  return findings.slice(0, 5);
}

// ─── Text wrapping ────────────────────────────────────────────────────────────

function wrapText(font: PDFFont, rawText: string, maxWidth: number, size: number): string[] {
  const words = safe(rawText).split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── PDF sections ─────────────────────────────────────────────────────────────

/**
 * Draw the DroneOK icon using pdf-lib primitives.
 * bx, by = bottom-left corner of the icon in PDF coordinates (y-up).
 * size   = icon width/height in points (SVG viewBox is 48×48).
 */
function drawLogoMark(ctx: Ctx, bx: number, by: number, size: number, color: RGB) {
  const s  = size / 48;
  // SVG (sx,sy) → PDF: x = bx + sx*s,  y = by + (48 - sy)*s
  const px = (sx: number) => bx + sx * s;
  const py = (sy: number) => by + (48 - sy) * s;

  // Circle (hollow)
  ctx.page.drawCircle({
    x: px(24), y: py(24),
    size: 17 * s,
    borderColor: color,
    borderWidth: 3 * s,
    opacity: 0,           // transparent fill
    borderOpacity: 1,
  });

  // 4 diagonal rotor lines
  const lw = 2.5 * s;
  const lines: [number, number, number, number][] = [
    [10.5, 10.5,  4,  4],
    [37.5, 10.5, 44,  4],
    [10.5, 37.5,  4, 44],
    [37.5, 37.5, 44, 44],
  ];
  for (const [x1, y1, x2, y2] of lines) {
    ctx.page.drawLine({
      start: { x: px(x1), y: py(y1) },
      end:   { x: px(x2), y: py(y2) },
      color, thickness: lw,
    });
  }

  // Check mark: M16 24 → L21 30 → L33 17
  ctx.page.drawLine({ start: { x: px(16), y: py(24) }, end: { x: px(21), y: py(30) }, color, thickness: lw });
  ctx.page.drawLine({ start: { x: px(21), y: py(30) }, end: { x: px(33), y: py(17) }, color, thickness: lw });
}

function drawHeader(ctx: Ctx, M: number, H: number, certificateId: string, analyzedAt: string) {
  const headerH = 68;
  const green   = rgb(0.204, 0.827, 0.600); // #34D399

  // Dark background
  rect(ctx, 0, H - headerH, 595, headerH, rgb(0.06, 0.07, 0.09));

  // Green left accent bar
  rect(ctx, 0, H - headerH, 4, headerH, green);

  // Logo mark (24×24) vertically centered in header
  const logoSize = 24;
  const logoX    = M;
  const logoY    = H - headerH + (headerH - logoSize) / 2;
  drawLogoMark(ctx, logoX, logoY, logoSize, green);

  // "DroneOK.cl" brand name
  const brandX = logoX + logoSize + 8;
  text(ctx, "DroneOK", brandX,     H - headerH / 2 + 4,  13, true,  rgb(1, 1, 1));
  text(ctx, ".cl",     brandX + 52, H - headerH / 2 + 4,  13, true,  green);

  // Thin vertical separator
  ctx.page.drawLine({
    start: { x: brandX + 80, y: H - 14 },
    end:   { x: brandX + 80, y: H - headerH + 14 },
    color: rgb(0.25, 0.28, 0.35),
    thickness: 0.8,
  });

  // Document title
  const titleX = brandX + 92;
  text(ctx, "Diagnostico de Historial", titleX, H - headerH / 2 + 5, 11, true, rgb(0.95, 0.95, 0.97));
  text(ctx, "Basado en registros de vuelo DJI",   titleX, H - headerH / 2 - 8, 7.5, false, rgb(0.55, 0.58, 0.65));

  // Right: date + ID
  const rx = 595 - M;
  text(ctx, `Emitido: ${analyzedAt}`, rx - 120, H - headerH / 2 + 5,  8,   false, rgb(0.60, 0.63, 0.70));
  text(ctx, `ID: ${certificateId}`,   rx - 120, H - headerH / 2 - 8,  8,   true,  green);

  // Bottom certification strip
  rect(ctx, 4, H - headerH, 591, 10, rgb(0.10, 0.11, 0.14));
  text(ctx, "CERTIFICADO POR DRONEOK.CL  |  Documento generado automaticamente a partir de registros oficiales DJI",
    M + logoSize + 8, H - headerH + 3, 6, false, rgb(0.40, 0.43, 0.50));
}

function drawDroneCard(ctx: Ctx, r: Report, M: number, top: number): number {
  const cardH = 70;
  rect(ctx, M, top - cardH, 515, cardH, rgb(0.97, 0.97, 0.98), rgb(0.88, 0.88, 0.90));

  const res = r.resumen;
  const modelStr = safe(`${res.modelo ?? "Dron DJI"}${res.productType ? ` (${res.productType})` : ""}`);
  text(ctx, modelStr, M + 12, top - 20, 13, true);
  text(ctx, `Serial: ${res.aircraftSn ?? "-"}   Bateria: ${res.batterySn ?? "-"}`,
    M + 12, top - 34, 8.5, false, rgb(0.45, 0.45, 0.48));

  const stats: [string, string][] = [
    ["Vuelos",        String(res.numeroVuelos)],
    ["Tiempo total",  fmtHMS(res.tiempoTotalSeg)],
    ["Distancia",     res.distanciaTotalKm != null ? `${fmtNum(res.distanciaTotalKm, 1)} km` : "-"],
    ["Primer vuelo",  fmtDate(res.rangoFechas.desde)],
    ["Ultimo vuelo",  fmtDate(res.rangoFechas.hasta)],
  ];
  let sx = M + 12;
  for (const [lbl, val] of stats) {
    text(ctx, lbl, sx, top - 50, 7.5, false, rgb(0.50, 0.50, 0.53));
    text(ctx, val,  sx, top - 62, 9,   true,  rgb(0.10, 0.10, 0.12));
    sx += 98;
  }

  return top - cardH - 10;
}

function drawScoreBox(ctx: Ctx, r: Report, M: number, top: number): number {
  const score = r.score.score;
  const col   = scoreRGB(score);
  const lbl   = scoreLabel(score);
  const boxH  = 78;

  ctx.page.drawRectangle({
    x: M, y: top - boxH, width: 515, height: boxH,
    color: col, opacity: 0.07, borderColor: col, borderWidth: 1.5,
  });

  // Arc gauge: center at PDF (M+44, top-boxH/2+2)
  const arcR  = 27;
  const arcCx = M + 44;
  const arcCy = top - boxH / 2 + 2;

  // Background arc (gray, full 240°)
  ctx.page.drawSvgPath(arcPath(arcR, 150, 240), {
    x: arcCx, y: arcCy,
    borderColor: rgb(0.78, 0.78, 0.80),
    borderWidth: 5,
  });

  // Score arc (colored, proportional to score)
  if (score > 2) {
    ctx.page.drawSvgPath(arcPath(arcR, 150, 240 * score / 100), {
      x: arcCx, y: arcCy,
      borderColor: col,
      borderWidth: 5,
    });
  }

  // Score number centered inside arc
  const numStr = String(score);
  const numW   = ctx.fb.widthOfTextAtSize(numStr, 15);
  text(ctx, numStr, arcCx - numW / 2, arcCy - 5, 15, true, col);

  // Labels to the right
  const lx = M + 96;
  text(ctx, lbl, lx, top - 20, 17, true, col);
  text(ctx, `Score: ${score} / 100`, lx, top - 36, 9, false, rgb(0.45, 0.45, 0.48));

  const reasonStr = safe(r.score.reasons.slice(0, 2).join("  |  "));
  if (reasonStr) text(ctx, reasonStr, lx, top - 50, 7.5, false, rgb(0.50, 0.50, 0.53));

  const conf     = r.score.confidence;
  const confLbl  = conf >= 0.75 ? "Alta" : conf >= 0.45 ? "Media" : "Baja";
  pill(ctx, lx, top - boxH + 6, 110, "Confianza del analisis", confLbl, rgb(0.22, 0.33, 0.85));

  const resultLabel = score >= 85 ? "APTO PARA COMPRA" : score >= 60 ? "CONDICION ACEPTABLE" : "REQUIERE REVISION";
  const resultCol   = score >= 85 ? rgb(0.10, 0.58, 0.22) : score >= 60 ? rgb(0.83, 0.62, 0.0) : rgb(0.76, 0.15, 0.15);
  pill(ctx, lx + 118, top - boxH + 6, 155, "Veredicto", resultLabel, resultCol);

  return top - boxH - 14;
}

function drawHallazgos(ctx: Ctx, findings: Finding[], M: number, top: number): number {
  if (findings.length === 0) return top;
  sectionTitle(ctx, "Hallazgos del Diagnostico", M, top, 515);

  // Colors per level — from prompt spec
  const levelColors: Record<FindingLevel, { bg: RGB; border: RGB; tag: string }> = {
    ok:    { bg: rgb(0.051, 0.180, 0.141), border: rgb(0.204, 0.827, 0.600), tag: "OPTIMO"  },
    warn:  { bg: rgb(0.165, 0.137, 0.063), border: rgb(0.984, 0.749, 0.141), tag: "REVISAR" },
    alert: { bg: rgb(0.173, 0.082, 0.090), border: rgb(0.973, 0.443, 0.443), tag: "ALERTA"  },
  };

  const rowH   = 26;
  const rowGap = 3;
  const tagW   = 52;
  let y        = top - 18;

  for (const f of findings) {
    const { bg, border, tag } = levelColors[f.level];

    // Row background
    ctx.page.drawRectangle({ x: M, y: y - rowH + 4, width: 515, height: rowH,
      color: bg, borderColor: border, borderWidth: 0.6 });

    // Left accent bar
    ctx.page.drawRectangle({ x: M, y: y - rowH + 4, width: 3, height: rowH, color: border });

    // Title (bold, light)
    text(ctx, f.title, M + 10, y - 3, 9, true, rgb(0.92, 0.92, 0.95));

    // Detail (muted)
    const detail = wrapText(ctx.f, f.detail, 515 - tagW - 30, 8);
    text(ctx, detail[0] ?? "", M + 10, y - 15, 8, false, rgb(0.62, 0.62, 0.67));

    // Tag on the right
    const tagX = M + 515 - tagW - 5;
    ctx.page.drawRectangle({ x: tagX, y: y - rowH + 9, width: tagW, height: 14,
      color: bg, borderColor: border, borderWidth: 0.8 });
    const tagTW = ctx.fb.widthOfTextAtSize(tag, 6.5);
    text(ctx, tag, tagX + (tagW - tagTW) / 2, y - rowH + 16, 6.5, true, border);

    y -= rowH + rowGap;
  }

  return y - 10;
}

function drawTechCards(ctx: Ctx, r: Report, M: number, top: number): number {
  sectionTitle(ctx, "Datos Tecnicos", M, top, 515);

  const halfW = 247;
  const cardH = 84;
  const ty    = top - 18;

  // Battery card
  rect(ctx, M, ty - cardH, halfW, cardH, rgb(0.97, 0.97, 0.98), rgb(0.88, 0.88, 0.90));
  text(ctx, "BATERIA", M + 8, ty - 10, 7.5, true, rgb(0.45, 0.45, 0.50));

  const bat = r.bateria;
  const batRows: [string, string, boolean][] = [
    ["Desbalance celdas", bat.desviacionMaxCeldas != null ? `${bat.desviacionMaxCeldas.toFixed(3)}V` : "-",
      (bat.desviacionMaxCeldas ?? 0) > 0.05],
    ["Temperatura max",   bat.temperaturaMax      != null ? `${bat.temperaturaMax}${String.fromCharCode(176)}C` : "-",
      (bat.temperaturaMax ?? 0) > 55],
    ["Capacidad actual",  bat.capacidadActualMah  != null ? `${bat.capacidadActualMah} mAh` : "-", false],
    ["Degradacion",       bat.degradacionPct      != null ? `${bat.degradacionPct.toFixed(1)}%` : "-",
      (bat.degradacionPct ?? 0) > 15],
    ["Ciclos descarga",   bat.ciclosDescarga      != null ? String(bat.ciclosDescarga) : "-", false],
  ];

  let by = ty - 24;
  for (const [lbl, val, warn] of batRows) {
    text(ctx, lbl, M + 8, by, 8.5, false, rgb(0.50, 0.50, 0.53));
    const valCol = warn ? rgb(0.76, 0.20, 0.15) : rgb(0.10, 0.55, 0.30);
    const valW   = ctx.fb.widthOfTextAtSize(val, 8.5);
    text(ctx, val, M + halfW - 10 - valW, by, 8.5, true, valCol);
    by -= 14;
  }

  // Reliability card
  const rx   = M + halfW + 20;
  const relW = 515 - halfW - 20;
  rect(ctx, rx, ty - cardH, relW, cardH, rgb(0.97, 0.97, 0.98), rgb(0.88, 0.88, 0.90));
  text(ctx, "CONFIABILIDAD", rx + 8, ty - 10, 7.5, true, rgb(0.45, 0.45, 0.50));

  const c = r.confiabilidad;
  const relRows: [string, string, boolean][] = [
    ["Vuelos con eventos",  `${c.vuelosConEventos} / ${r.resumen.numeroVuelos}`, c.vuelosConEventos > 0],
    ["Perdida de senal",    String(c.totalSignalLoss),    c.totalSignalLoss > 0],
    ["Failsafe (RTH)",      String(c.totalFailsafe),      c.totalFailsafe > 0],
    ["Aterrizaje forzado",  String(c.totalForcedLanding), c.totalForcedLanding > 0],
    ["Alerta bat. baja",    String(c.totalLowVoltage),    c.totalLowVoltage > 0],
  ];

  let ry = ty - 24;
  for (const [lbl, val, isEvent] of relRows) {
    text(ctx, lbl, rx + 8, ry, 8.5, false, rgb(0.50, 0.50, 0.53));
    const valCol = isEvent ? rgb(0.76, 0.20, 0.15) : rgb(0.15, 0.55, 0.25);
    const valW   = ctx.fb.widthOfTextAtSize(val, 8.5);
    text(ctx, val, rx + relW - 10 - valW, ry, 8.5, true, valCol);
    ry -= 14;
  }

  return ty - cardH - 10;
}

function drawConfidenceCard(ctx: Ctx, r: Report, M: number, top: number): number {
  const conf    = r.score.confidence;
  const flights = r.resumen.numeroVuelos;

  let label: string;
  let note: string;
  let bgCol: RGB;
  let borderCol: RGB;

  if (conf >= 0.75 && flights >= 20) {
    label     = "Confianza alta";
    note      = "20 o mas vuelos con datos consistentes. El score refleja el estado real del equipo.";
    bgCol     = rgb(0.05, 0.16, 0.08);
    borderCol = rgb(0.20, 0.75, 0.35);
  } else if (conf >= 0.45 || flights >= 5) {
    label     = "Confianza media";
    note      = `Con ${flights} vuelo(s) registrado(s), el score es orientativo. Solicita mas logs para mayor precision.`;
    bgCol     = rgb(0.16, 0.13, 0.03);
    borderCol = rgb(0.95, 0.72, 0.12);
  } else {
    label     = "Confianza baja";
    note      = `Solo ${flights} vuelo(s) disponible(s). Solicita al vendedor la carpeta completa FlightRecord.`;
    bgCol     = rgb(0.16, 0.07, 0.07);
    borderCol = rgb(0.90, 0.35, 0.35);
  }

  const cardH = 36;
  ctx.page.drawRectangle({ x: M, y: top - cardH, width: 515, height: cardH,
    color: bgCol, borderColor: borderCol, borderWidth: 0.8 });

  text(ctx, label.toUpperCase(), M + 10, top - 11, 7.5, true, borderCol);
  text(ctx, safe(note),          M + 10, top - 25, 8,   false, rgb(0.78, 0.78, 0.80));

  return top - cardH - 10;
}

function drawFlightsTable(ctx: Ctx, r: Report, M: number, top: number): number {
  const rows = r.ultimosVuelos.slice(0, 6);
  if (rows.length === 0) return top;

  sectionTitle(ctx, `Ultimos ${rows.length} vuelos`, M, top, 515);

  const cols = [
    { label: "Fecha",       x: M + 4   },
    { label: "Duracion",    x: M + 76  },
    { label: "Distancia",   x: M + 128 },
    { label: "Bat. inicio", x: M + 188 },
    { label: "Bat. fin",    x: M + 244 },
    { label: "Eventos",     x: M + 294 },
  ];

  let y = top - 18;
  rect(ctx, M, y - 2, 515, 14, rgb(0.93, 0.93, 0.95));
  for (const col of cols) {
    text(ctx, col.label, col.x + 3, y + 1, 7.5, true, rgb(0.35, 0.35, 0.40));
  }
  y -= 16;

  for (let i = 0; i < rows.length; i++) {
    const f  = rows[i];
    const bg = i % 2 === 0 ? rgb(1, 1, 1) : rgb(0.97, 0.97, 0.98);
    rect(ctx, M, y - 3, 515, 14, bg);

    const evtCol = f.events !== "Sin eventos" ? rgb(0.76, 0.25, 0.15) : rgb(0.30, 0.55, 0.30);
    text(ctx, f.date,                 cols[0].x + 3, y, 8.5, false);
    text(ctx, `${f.durationMin} min`, cols[1].x + 3, y, 8.5, false);
    text(ctx, f.distanceKm + " km",   cols[2].x + 3, y, 8.5, false);
    text(ctx, f.battStart,            cols[3].x + 3, y, 8.5, false);
    text(ctx, f.battEnd,              cols[4].x + 3, y, 8.5, false);
    text(ctx, f.events,               cols[5].x + 3, y, 8,   false, evtCol);
    y -= 14;
  }

  return y - 8;
}

async function drawVerificationFooter(
  ctx: Ctx,
  pdfDoc: PDFDocument,
  M: number,
  verifyUrl: string,
  certificateId: string,
) {
  const footerY = 90;
  line(ctx, M, footerY + 58, 595 - M, footerY + 58);

  text(ctx, "Verificar certificado en:", M, footerY + 44, 8, true, rgb(0.30, 0.30, 0.35));
  text(ctx, safe(verifyUrl), M, footerY + 30, 8.5, false, rgb(0.15, 0.35, 0.80));
  text(ctx, `ID: ${certificateId}`, M, footerY + 16, 8, false, rgb(0.45, 0.45, 0.50));
  text(ctx, "droneok.cl  |  Certificado generado automaticamente a partir de los logs de vuelo DJI.",
    M, footerY + 2, 7, false, rgb(0.55, 0.55, 0.58));

  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 80, margin: 1 });
    const base64    = qrDataUrl.replace(/^data:image\/png;base64,/, "");
    const pngBytes  = Buffer.from(base64, "base64");
    const qrImage   = await pdfDoc.embedPng(pngBytes);
    ctx.page.drawImage(qrImage, { x: 595 - M - 70, y: footerY, width: 70, height: 70 });
  } catch {
    text(ctx, "[QR]", 595 - M - 40, footerY + 30, 9, false, rgb(0.70, 0.70, 0.72));
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    let body: unknown;
    try { body = await req.json(); }
    catch {
      return NextResponse.json({ ok: false, error: "Se esperaba JSON." }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const report: Report | undefined =
      (b?.report as Report) ??
      (Array.isArray(b?.reports) ? (b.reports as Report[])[0] : undefined);

    if (!report) {
      return NextResponse.json({ ok: false, error: "No se recibio el reporte." }, { status: 400 });
    }
    if (typeof report.score?.score !== "number") {
      return NextResponse.json({ ok: false, error: "El reporte no tiene score." }, { status: 400 });
    }

    const certId     = typeof b?.certificateId === "string" ? b.certificateId : `DC-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
    const verifyUrl  = typeof b?.verifyUrl     === "string" ? b.verifyUrl    : `droneok.cl/verify/${certId}`;
    const analyzedAt = new Date().toISOString().slice(0, 10);

    const pdfDoc = await PDFDocument.create();
    const page   = pdfDoc.addPage([595.28, 841.89]);
    const { height: H } = page.getSize();
    const M = 40;

    const f  = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fb = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const ctx: Ctx = { page, f, fb };

    drawHeader(ctx, M, H, certId, analyzedAt);
    let y = H - 80; // 68px header + 12px gap

    y = drawDroneCard(ctx, report, M, y);
    y = drawHallazgos(ctx, generateFindings(report), M, y);
    y = drawTechCards(ctx, report, M, y);
    y = drawConfidenceCard(ctx, report, M, y);
    y = drawFlightsTable(ctx, report, M, y);

    await drawVerificationFooter(ctx, pdfDoc, M, verifyUrl, certId);

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="diagnostico-${certId}.pdf"`,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error generando PDF";
    console.error("PDF_ERROR", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
