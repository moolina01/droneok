"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { StoredCertificate } from "@/types/certificate";

type Mode = "seller" | "buyer";
type Tab  = "summary" | "technical";

// ── Score helpers ─────────────────────────────────────────────────────────────

function scoreColors(color: StoredCertificate["scoreColor"]) {
  if (color === "Verde")    return { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  badge: "bg-green-100 text-green-800"  };
  if (color === "Amarillo") return { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  badge: "bg-amber-100 text-amber-800"  };
  return                           { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700",    badge: "bg-red-100 text-red-800"      };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreBox({ cert }: { cert: StoredCertificate }) {
  const c = scoreColors(cert.scoreColor);
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} px-8 py-6 text-center`}>
      <div className={`text-5xl font-bold ${c.text}`}>{cert.score}<span className="text-2xl font-normal text-neutral-400"> / 100</span></div>
      <div className={`mt-1 text-xl font-semibold ${c.text}`}>{cert.scoreLabel.toUpperCase()}</div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${c.badge}`}>
          Confianza: {cert.confidence}
        </span>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
          {cert.verdict}
        </span>
      </div>
    </div>
  );
}

function DroneCard({ cert }: { cert: StoredCertificate }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-neutral-900">{cert.droneModel}</div>
          <div className="mt-0.5 text-sm text-neutral-500">
            Serial: <span className="font-mono">{cert.droneSerial}</span>
            {cert.batterySerial !== "—" && (
              <> · Batería: <span className="font-mono">{cert.batterySerial}</span></>
            )}
          </div>
        </div>
        <div className="text-right text-xs text-neutral-400">
          <div>ID: <span className="font-mono font-medium text-neutral-600">{cert.id}</span></div>
          <div>Generado el {cert.generatedAt.slice(0, 10)}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Vuelos",       value: String(cert.totalFlights)   },
          { label: "Tiempo total", value: cert.totalFlightTime         },
          { label: "Distancia",    value: cert.totalDistance           },
          { label: "Primer vuelo", value: cert.firstFlightDate         },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-center">
            <div className="text-xs text-neutral-500">{label}</div>
            <div className="mt-0.5 text-sm font-semibold text-neutral-800">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AISummary({ text }: { text: string }) {
  return (
    <div className="space-y-4">
      {text.split("\n\n").filter(Boolean).map((p, i) => (
        <p key={i} className="text-base leading-relaxed text-neutral-700">{p}</p>
      ))}
    </div>
  );
}

function TechnicalData({ cert }: { cert: StoredCertificate }) {
  const hasBatData = cert.currentCapacity > 0 || cert.cellImbalance > 0 || cert.maxTemp > 0;

  return (
    <div className="space-y-6">
      {/* Battery */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Batería</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Capacidad actual",   value: hasBatData ? `${cert.currentCapacity} mAh`  : "—" },
            { label: "Capacidad original", value: hasBatData ? `${cert.originalCapacity} mAh` : "—" },
            { label: "Degradación",        value: hasBatData ? `${cert.degradation}%`          : "—" },
            { label: "Desbalance celdas",  value: cert.cellImbalance > 0 ? `${cert.cellImbalance} V` : "—" },
            { label: "Temp. máxima",       value: cert.maxTemp > 0 ? `${cert.maxTemp}°C`       : "—" },
            { label: "Ciclos de descarga", value: cert.dischargeCycles > 0 ? String(cert.dischargeCycles) : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
              <div className="text-xs text-neutral-500">{label}</div>
              <div className="mt-0.5 text-sm font-semibold text-neutral-800">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reliability */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Confiabilidad</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Vuelos con eventos",  value: cert.flightsWithEvents },
            { label: "Pérdidas de señal",   value: String(cert.signalLoss)      },
            { label: "Failsafe",            value: String(cert.failsafe)        },
            { label: "Aterrizajes forzados",value: String(cert.forcedLandings)  },
          ].map(({ label, value }) => (
            <div key={label} className={`rounded-xl border px-3 py-2 ${Number(value.split(" ")[0]) > 0 && label !== "Vuelos con eventos" ? "border-amber-200 bg-amber-50" : "border-neutral-200 bg-neutral-50"}`}>
              <div className="text-xs text-neutral-500">{label}</div>
              <div className="mt-0.5 text-sm font-semibold text-neutral-800">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent flights table */}
      {cert.recentFlights.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Últimos vuelos</h3>
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  {["Fecha","Duración","Distancia","Bat. inicio","Bat. fin","Eventos"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-neutral-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cert.recentFlights.map((f, i) => (
                  <tr key={i} className={`border-b border-neutral-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-neutral-50/50"}`}>
                    <td className="px-3 py-2 font-mono text-xs text-neutral-700">{f.date}</td>
                    <td className="px-3 py-2 text-neutral-700">{f.durationMin}m</td>
                    <td className="px-3 py-2 text-neutral-700">{f.distanceKm} km</td>
                    <td className="px-3 py-2 text-neutral-700">{f.battStart}</td>
                    <td className="px-3 py-2 text-neutral-700">{f.battEnd}</td>
                    <td className={`px-3 py-2 text-xs ${f.events === "Sin eventos" ? "text-neutral-400" : "text-amber-700"}`}>{f.events}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conclusions */}
      {cert.conclusions.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Conclusiones</h3>
          <ul className="space-y-2">
            {cert.conclusions.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                <span className="mt-0.5 text-neutral-400">·</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CertificatePage({ cert, mode }: { cert: StoredCertificate; mode: Mode }) {
  const [activeTab, setActiveTab]   = useState<Tab>("summary");
  const [copied, setCopied]         = useState(false);
  const [downloading, setDownloading] = useState(false);

  const verifyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verify/${cert.id}`
    : `/verify/${cert.id}`;

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select the text
    }
  }, [verifyUrl]);

  const onWhatsApp = useCallback(() => {
    const text = `Mirá el certificado de salud de mi ${cert.droneModel} — Score: ${cert.score}/100 (${cert.scoreLabel}). Verificá aquí: ${verifyUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, [cert, verifyUrl]);

  const onDownloadPDF = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/report/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: cert.report,
          aiSummary: cert.aiSummary,
          certificateId: cert.id,
          verifyUrl,
        }),
      });
      if (!res.ok) throw new Error("Error al generar el PDF");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `certificado-${cert.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al descargar el PDF");
    } finally {
      setDownloading(false);
    }
  }, [cert]);

  const c = scoreColors(cert.scoreColor);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

        {/* Verification banner (buyer) or success banner (seller) */}
        {mode === "buyer" ? (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-3.5">
            <span className="text-lg">✓</span>
            <div>
              <div className="text-sm font-semibold text-green-800">Certificado verificado</div>
              <div className="text-xs text-green-700">
                Generado el {cert.generatedAt.slice(0, 10)} · {cert.totalFlights} vuelo(s) analizado(s)
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-3.5">
            <span className="text-lg">✅</span>
            <div className="text-sm font-semibold text-green-800">Certificado generado exitosamente</div>
          </div>
        )}

        {/* Drone info card */}
        <DroneCard cert={cert} />

        {/* Score */}
        <div className="mt-4">
          <ScoreBox cert={cert} />
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <div className="flex rounded-xl border border-neutral-200 bg-white p-1">
            {([ ["summary", "Resumen"], ["technical", "Datos Técnicos"] ] as [Tab, string][]).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? `${c.bg} ${c.text} shadow-sm`
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-neutral-200 bg-white px-6 py-6">
            {activeTab === "summary"   && <AISummary text={cert.aiSummary} />}
            {activeTab === "technical" && <TechnicalData cert={cert} />}
          </div>
        </div>

        {/* Download PDF */}
        <div className="mt-4">
          <button
            onClick={onDownloadPDF}
            disabled={downloading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-60"
          >
            <span className="text-base">📥</span>
            {downloading ? "Generando PDF…" : "Descargar PDF del Certificado"}
          </button>
        </div>

        {/* Share section (seller only) */}
        {mode === "seller" && (
          <div className="mt-4 rounded-2xl border border-neutral-200 bg-white px-6 py-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <span>🔗</span> Compartir certificado
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Compartí este link con el comprador para que pueda verificar el estado del dron.
            </p>

            {/* Link box */}
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
              <span className="flex-1 truncate font-mono text-xs text-neutral-700">{verifyUrl}</span>
              <button
                onClick={onCopy}
                className="shrink-0 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                {copied ? "¡Copiado!" : "📋"}
              </button>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={onCopy}
                className="flex-1 rounded-xl border border-neutral-200 bg-white py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                {copied ? "¡Copiado!" : "Copiar link"}
              </button>
              <button
                onClick={onWhatsApp}
                className="flex-1 rounded-xl bg-[#25D366] py-2.5 text-sm font-medium text-white hover:bg-[#1fba58]"
              >
                Compartir WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* Seller CTA: analyze another */}
        {mode === "seller" && (
          <div className="mt-4">
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              🔄 Analizar otro dron
            </Link>
          </div>
        )}

        {/* Buyer CTA */}
        {mode === "buyer" && (
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-5 text-center">
            <div className="text-sm font-medium text-neutral-700">¿Vendés un dron?</div>
            <div className="mt-1 text-xs text-neutral-500">
              Generá tu certificado gratis y dáselo al comprador para generar confianza.
            </div>
            <Link
              href="/"
              className="mt-3 inline-block rounded-xl bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Generar mi certificado en DroneOK
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
