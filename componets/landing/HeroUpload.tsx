"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AnimateIn from "@/componets/ui/AnimateIn";
import DroneOKIcon from "@/componets/ui/DroneOKIcon";

type Stage = "idle" | "dragging" | "ready" | "analyzing" | "error";

const props = [
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Datos reales del dron",
    desc: "Extraídos directamente de los registros de vuelo DJI — sin estimaciones.",
  },
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    title: "Link público verificable",
    desc: "El comprador confirma la autenticidad desde cualquier dispositivo, sin instalar nada.",
  },
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Listo en 30 segundos",
    desc: "Sin registro, sin instalación. Cargas los archivos y el certificado PDF queda listo.",
  },
];

export default function HeroUpload() {
  const router         = useRouter();
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef   = useRef<HTMLInputElement | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ── File handling ──────────────────────────────────────────────────────────

  const acceptFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const all = Array.from(fileList).filter((f) => f.size > 0);
    const txt = all.filter((f) => f.name.toLowerCase().endsWith(".txt"));

    if (txt.length === 0) {
      setError("No se encontraron archivos .txt de DJI. Sube un archivo o la carpeta FlightRecord.");
      setStage("error");
      return;
    }

    setFiles(all);
    setError(null);
    setStage("ready");
  }, []);

  const onPickFolder = useCallback(() => folderInputRef.current?.click(), []);
  const onPickFiles  = useCallback(() => fileInputRef.current?.click(), []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setStage("idle");
      acceptFiles(e.dataTransfer?.files ?? null);
    },
    [acceptFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStage("dragging");
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStage(files.length ? "ready" : "idle");
  }, [files.length]);

  const onClear = useCallback(() => {
    setFiles([]);
    setError(null);
    setStage("idle");
    if (folderInputRef.current) folderInputRef.current.value = "";
    if (fileInputRef.current)   fileInputRef.current.value   = "";
  }, []);

  // ── Analysis flow ──────────────────────────────────────────────────────────

  const onAnalyze = useCallback(async () => {
    if (!files.length) return;

    setStage("analyzing");
    setError(null);

    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("file", f));

      const analyzeRes  = await fetch("/api/analyze", { method: "POST", body: fd });
      const analyzeJson = await analyzeRes.json();

      if (!analyzeRes.ok || !analyzeJson.ok) {
        throw new Error(analyzeJson?.error ?? "Error al analizar los registros");
      }

      const report = analyzeJson?.reports?.[0];
      if (!report) throw new Error("No se pudo generar el reporte.");

      const certRes  = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report }),
      });
      const certJson = await certRes.json();

      if (!certRes.ok || !certJson.ok) {
        throw new Error(certJson?.error ?? "Error al guardar el certificado");
      }

      router.push(`/certificate/${certJson.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setStage("error");
    }
  }, [files, router]);

  // ── Derived UI ─────────────────────────────────────────────────────────────

  const txtCount = files.filter((f) => f.name.toLowerCase().endsWith(".txt")).length;

  return (
    <section className="bg-[#0B1121]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">

          {/* ── Left: copy ── */}
          <AnimateIn variant="fadeLeft">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0ED8B1]/30 bg-[#0ED8B1]/10 px-3 py-1 text-xs font-medium text-[#0ED8B1]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0ED8B1]" />
              El primer verificador de drones en Chile 🇨🇱
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.6rem] lg:leading-[1.15]">
              Vende tu dron con un certificado que{" "}
              <span className="text-[#0ED8B1]">genera confianza.</span>
            </h1>

            <p className="mt-4 text-base leading-relaxed text-[#8B93A7]">
              Carga los registros de vuelo de tu DJI y obtén un certificado con el historial real del equipo.
              Tu comprador lo verifica desde su celular — sin intermediarios.
            </p>

            <div className="mt-8 space-y-5">
              {props.map((p) => (
                <div key={p.title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0ED8B1]/10 text-[#0ED8B1]">
                    {p.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{p.title}</div>
                    <div className="mt-0.5 text-sm text-[#8B93A7]">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {["Gratis en beta", "Sin registro", "Compatible con todos los DJI"].map((t) => (
                <span key={t} className="rounded-full border border-[#1e2d4a] bg-[#0f1a2e] px-3 py-1 text-xs text-[#8B93A7]">
                  {t}
                </span>
              ))}
            </div>
          </AnimateIn>

          {/* ── Right: upload card ── */}
          <AnimateIn variant="fadeRight" delay={0.1}>
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`rounded-2xl border bg-white p-1 shadow-2xl transition-all ${
                stage === "dragging" ? "border-[#0ED8B1] ring-4 ring-[#0ED8B1]/20" : "border-[#1e2d4a]"
              }`}
            >
              {/* Card inner */}
              <div className="rounded-xl bg-white p-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[#0B1121]">
                    {stage === "analyzing" ? "Procesando…" : stage === "ready" ? "Archivos cargados" : "Cargar registros de vuelo"}
                  </div>
                  {stage === "ready" && (
                    <button onClick={onClear} className="text-xs text-[#8B93A7] hover:text-[#4B5675]">
                      Cambiar
                    </button>
                  )}
                </div>

                {/* Drop zone */}
                <div className={`mt-4 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                  stage === "dragging" ? "border-[#0ED8B1] bg-[#0ED8B1]/5"
                  : stage === "error"  ? "border-red-200 bg-red-50"
                  : stage === "ready"  ? "border-[#0ED8B1]/40 bg-[#F0FDF9]"
                  : "border-[#E2E8F0] bg-[#F8FAFF]"
                }`}>

                  {/* Icon */}
                  <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${
                    stage === "ready" ? "bg-[#0ED8B1]/15" : stage === "error" ? "bg-red-100" : "bg-[#F0F4FF]"
                  }`}>
                    {stage === "analyzing" ? (
                      <DroneOKIcon size={36} color="#059669" spinDuration={1.8} />
                    ) : stage === "ready" ? (
                      <svg className="h-6 w-6 text-[#0ED8B1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : stage === "error" ? (
                      <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-[#4B5675]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                      </svg>
                    )}
                  </div>

                  {/* State text */}
                  <div className="mt-3 text-sm font-medium text-[#0B1121]">
                    {stage === "idle"      && "Arrastra la carpeta FlightRecord aquí"}
                    {stage === "dragging"  && "Suelta para cargar"}
                    {stage === "ready"     && `${txtCount} registro(s) DJI listo(s)`}
                    {stage === "analyzing" && "Analizando vuelos y generando certificado…"}
                    {stage === "error"     && "No se pudieron leer los archivos"}
                  </div>
                  <div className="mt-1 text-xs text-[#8B93A7]">
                    {stage === "idle"      && "o selecciona los archivos desde tu computador"}
                    {stage === "ready"     && `${files.length} archivo(s) seleccionado(s)`}
                    {stage === "analyzing" && "Esto toma unos segundos…"}
                    {stage === "error"     && error && <span className="text-red-500">{error}</span>}
                  </div>

                  {/* Buttons */}
                  <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                    {(stage === "idle" || stage === "error") && (
                      <>
                        <button
                          type="button"
                          onClick={onPickFolder}
                          className="w-full rounded-lg bg-[#0B1121] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a2540] sm:w-auto"
                        >
                          Seleccionar carpeta
                        </button>
                        <button
                          type="button"
                          onClick={onPickFiles}
                          className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#4B5675] hover:bg-[#F0F4FF] sm:w-auto"
                        >
                          Seleccionar archivo(s)
                        </button>
                      </>
                    )}
                    {stage === "ready" && (
                      <button
                        type="button"
                        onClick={onAnalyze}
                        className="w-full rounded-lg bg-[#0ED8B1] px-5 py-2.5 text-sm font-bold text-[#0B1121] hover:bg-[#0cc9a5] sm:w-auto"
                      >
                        Generar certificado →
                      </button>
                    )}
                  </div>

                  {/* Hidden inputs */}
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    // @ts-expect-error — webkitdirectory not in React types
                    webkitdirectory=""
                    className="hidden"
                    onChange={(e) => acceptFiles(e.target.files)}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt"
                    className="hidden"
                    onChange={(e) => acceptFiles(e.target.files)}
                  />
                </div>

                {/* Footer hint */}
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-[#F8FAFF] px-4 py-3">
                  <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8B93A7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p className="text-xs leading-relaxed text-[#8B93A7]">
                    Los registros están en la app <strong className="text-[#4B5675]">DJI Fly</strong> o <strong className="text-[#4B5675]">DJI Go</strong>, o descarga la carpeta{" "}
                    <code className="rounded bg-[#E2E8F0] px-1 font-mono text-[10px] text-[#4B5675]">FlightRecord</code> a tu computador.
                  </p>
                </div>

                {/* Score preview strip */}
                <div className="mt-3 flex items-center justify-between rounded-lg border border-[#E2E8F0] px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#0ED8B1]" />
                    <span className="text-xs text-[#8B93A7]">El certificado incluye score 0–100 + PDF + QR</span>
                  </div>
                  <span className="text-xs font-medium text-[#0ED8B1]">Gratis</span>
                </div>

                {/* Beta notice */}
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">Beta</span>
                  <p className="text-xs text-amber-700">
                    Estamos en versión beta. Puede haber errores — si algo no funciona, escríbenos  hola@droneok.cl
                  </p>
                </div>
              </div>
            </div>
          </AnimateIn>

        </div>
      </div>
    </section>
  );
}
