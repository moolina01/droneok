"use client";
import { useState } from "react";
import AnimateIn from "@/componets/ui/AnimateIn";
import { AnimateStagger } from "@/componets/ui/AnimateStagger";

const faqs = [
  {
    q: "¿Dónde encuentro los registros de vuelo?",
    a: "Los registros de vuelo (FlightRecord) están disponibles en la app DJI Fly o DJI Go dentro de la sección de registros. También puedes transferirlos a tu computador conectando el control remoto o el celular. Cada archivo .txt corresponde a un vuelo.",
  },
  {
    q: "¿Mis archivos quedan guardados en el servidor?",
    a: "No. Los registros se procesan y se descartan de inmediato. Solo guardamos el certificado generado para que sea verificable por el comprador. Tus archivos originales no se almacenan.",
  },
  {
    q: "¿Para qué sirve el certificado en una venta?",
    a: "El certificado muestra el estado real del dron con datos de batería, historial de vuelos y eventos registrados. El comprador puede verificarlo desde su celular con el link incluido, lo que genera confianza sin necesidad de argumentos subjetivos.",
  },
  {
    q: "¿Funciona con todos los modelos DJI?",
    a: "Sí, con cualquier DJI que genere archivos FlightRecord: Mini, Air, Mavic, Avata, FPV, Inspire y otros. Por ahora está optimizado para DJI. El soporte para otras marcas está en evaluación.",
  },
  {
    q: "¿Por qué es mejor subir la carpeta completa y no solo un archivo?",
    a: "Con más vuelos el análisis es más preciso. La degradación de batería, la frecuencia de eventos y las tendencias de uso solo se pueden ver con historial. Un solo archivo es un punto de referencia; la carpeta completa es el cuadro completo.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="bg-[#0B1121]">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
        <AnimateIn variant="fadeUp">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Preguntas frecuentes
          </h2>
        </div>
        </AnimateIn>
        <AnimateStagger stagger={0.1} className="mt-10 divide-y divide-[#1e2d4a]">
          {faqs.map((f, i) => (
            <div key={i}>
              <button
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-sm font-medium text-white">{f.q}</span>
                <svg
                  className={`h-4 w-4 shrink-0 text-[#8B93A7] transition-transform ${open === i ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20" fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {open === i && (
                <p className="pb-4 text-sm leading-relaxed text-[#8B93A7]">{f.a}</p>
              )}
            </div>
          ))}
        </AnimateStagger>
      </div>
    </section>
  );
}
