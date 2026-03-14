"use client";
import AnimateIn from "@/componets/ui/AnimateIn";
import { AnimateStagger } from "@/componets/ui/AnimateStagger";

const models = [
  { name: "Mini 4 Pro", tag: "Popular" },
  { name: "Air 3", tag: "" },
  { name: "Mavic 3 Pro", tag: "" },
  { name: "Mavic 3 Classic", tag: "" },
  { name: "Air 2S", tag: "Popular" },
  { name: "Mini 3 Pro", tag: "" },
  { name: "Mavic 2 Pro", tag: "" },
  { name: "Mini 2 SE", tag: "" },
  { name: "FPV", tag: "" },
  { name: "Avata 2", tag: "" },
  { name: "Mini 3", tag: "" },
  { name: "Inspire 3", tag: "Pro" },
];

export default function CompatibleModels() {
  return (
    <section id="compatibilidad" className="bg-[#F0F4FF]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <AnimateIn variant="fadeUp">
        <div className="mx-auto max-w-xl text-center">
          <div className="inline-block rounded-full border border-[#0ED8B1]/30 bg-[#0ED8B1]/10 px-3 py-1 text-xs font-medium text-[#0AA889]">
            Compatibilidad
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#0B1121] sm:text-3xl">
            Compatible con todos los DJI
          </h2>
          <p className="mt-3 text-sm text-[#4B5675]">
            Si tu DJI genera registros de vuelo, DroneOK puede analizarlos.
          </p>
        </div>
        </AnimateIn>

        <AnimateStagger stagger={0.06} className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {models.map((m) => (
            <div key={m.name}
              className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-4 py-3">
              <span className="text-sm font-medium text-[#0B1121]">DJI {m.name}</span>
              {m.tag && (
                <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  m.tag === "Pro"
                    ? "bg-[#0B1121]/10 text-[#0B1121]"
                    : "bg-[#0ED8B1]/10 text-[#0AA889]"
                }`}>
                  {m.tag}
                </span>
              )}
            </div>
          ))}
        </AnimateStagger>

        <p className="mt-6 text-center text-xs text-[#8B93A7]">
          ¿Tu modelo no aparece? Prueba igual — si genera registros de vuelo DJI, funciona.
        </p>
      </div>
    </section>
  );
}
