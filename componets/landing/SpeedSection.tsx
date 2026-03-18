"use client";
import AnimateIn from "@/componets/ui/AnimateIn";
import { AnimateStagger } from "@/componets/ui/AnimateStagger";

const steps = [
  { time: "0s",   label: "Cargas la carpeta FlightRecord desde tu computador o app DJI", color: "text-[#8B93A7]" },
  { time: "5s",   label: "Los registros se procesan automáticamente en el servidor",      color: "text-[#8B93A7]" },
  { time: "15s",  label: "La IA genera un análisis del estado del dron en español",       color: "text-[#0ED8B1]" },
  { time: "25s",  label: "El certificado PDF y el link de verificación están listos",     color: "text-[#0ED8B1]" },
];

export default function SpeedSection() {
  return (
    <section id="velocidad" className="bg-[#0B1121]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* Left: timeline */}
          <AnimateIn variant="fadeLeft">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1e2d4a] bg-[#0f1a2e] px-3 py-1 text-xs font-medium text-[#0ED8B1]">
              Cómo funciona
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
              Del registro de vuelo al certificado en menos de 30 segundos
            </h2>
            <p className="mt-3 text-sm text-[#8B93A7]">
              Sin instalaciones, sin crear cuenta. Solo cargas los archivos y el certificado está listo para compartir.
            </p>

            <AnimateStagger stagger={0.15} className="mt-8 space-y-0">
              {steps.map((s, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${i >= 2 ? "border-[#0ED8B1]/40 bg-[#0ED8B1]/10 text-[#0ED8B1]" : "border-[#1e2d4a] bg-[#0f1a2e] text-[#8B93A7]"}`}>
                      {s.time}
                    </div>
                    {i < steps.length - 1 && <div className="h-8 w-px bg-[#1e2d4a]" />}
                  </div>
                  <p className={`pt-1.5 text-sm ${s.color}`}>{s.label}</p>
                </div>
              ))}
            </AnimateStagger>
          </AnimateIn>

          {/* Right: what's included */}
          <AnimateIn variant="fadeRight">
          <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6">
            <h3 className="text-sm font-semibold text-white">¿Qué incluye el certificado?</h3>
            <div className="mt-4 space-y-3">
              {[
                ["Score de salud 0–100",     "Calculado sobre todos los vuelos registrados del equipo"],
                ["Análisis en español",       "Descripción clara del estado del dron, pensada para cualquier comprador"],
                ["Historial de vuelos",       "Tabla con los últimos vuelos: duración, batería y eventos por vuelo"],
                ["Estado de la batería",      "Degradación de capacidad, temperatura máxima y desbalance de celdas"],
                ["Link de verificación",      "URL pública que el comprador puede abrir y confirmar por su cuenta"],
                ["PDF descargable",           "Con código QR para compartir por WhatsApp o cualquier medio"],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0ED8B1]/20">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#0ED8B1]" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white">{title}</span>
                    <span className="text-sm text-[#8B93A7]"> — {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
