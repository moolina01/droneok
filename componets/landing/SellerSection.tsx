"use client";
import AnimateIn from "@/componets/ui/AnimateIn";
import { AnimateStagger } from "@/componets/ui/AnimateStagger";

const benefits = [
  {
    stat: "más confianza",
    desc: "El comprador llega con información real del equipo. No hay lugar para dudas ni negociaciones sin fundamento.",
  },
  {
    stat: "mejor precio",
    desc: "Un dron con certificado respalda su valor. No tienes que convencer a nadie — los datos hablan solos.",
  },
  {
    stat: "venta más rápida",
    desc: "Las preguntas técnicas las responde el certificado. Menos idas y vueltas, cierre más directo.",
  },
];

export default function SellerSection() {
  return (
    <section className="bg-[#F0F4FF]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* Left: copy */}
          <AnimateIn variant="fadeLeft">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0ED8B1]/30 bg-[#0ED8B1]/10 px-3 py-1 text-xs font-medium text-[#0AA889]">
              Para vendedores
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#0B1121] sm:text-3xl">
              El comprador que ve un certificado, compra con más seguridad.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#4B5675]">
              Cuando vendes un dron sin información objetiva, el comprador duda. Con DroneOK le entregas el historial real del equipo: batería, vuelos, eventos y un score de salud claro.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#4B5675]">
              El certificado tiene un link público que el comprador puede verificar por su cuenta. Eso genera confianza antes de que te contacten.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#" className="rounded-lg bg-[#0B1121] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2540]">
                Generar mi certificado
              </a>
            </div>
          </AnimateIn>

          {/* Right: benefit cards */}
          <AnimateStagger stagger={0.12} className="grid gap-4">
            {benefits.map((b) => (
              <div key={b.stat} className="flex items-start gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#0ED8B1]" />
                <div>
                  <div className="text-sm font-semibold text-[#0B1121] capitalize">{b.stat}</div>
                  <p className="mt-1 text-sm leading-relaxed text-[#4B5675]">{b.desc}</p>
                </div>
              </div>
            ))}
          </AnimateStagger>
        </div>
      </div>
    </section>
  );
}
