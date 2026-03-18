"use client";

import { useState } from "react";

export default function ContactoPage() {
  const [form, setForm]     = useState({ nombre: "", email: "", asunto: "", mensaje: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reaction: "good",
          message:  `[CONTACTO] Nombre: ${form.nombre}\nAsunto: ${form.asunto}\n\n${form.mensaje}`,
          email:    form.email,
        }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-block rounded-full border border-[#0ED8B1]/30 bg-[#0ED8B1]/10 px-3 py-1 text-xs font-medium text-[#0AA889]">
            Contacto
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0B1121]">
            Escríbenos
          </h1>
          <p className="mt-2 text-sm text-[#4B5675]">
            ¿Tienes una duda, encontraste un error o quieres darnos feedback? Estamos atentos.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-5">

          {/* Form */}
          <div className="lg:col-span-3">
            {status === "done" ? (
              <div className="rounded-2xl border border-[#0ED8B1]/30 bg-[#0ED8B1]/5 px-6 py-10 text-center">
                <div className="text-3xl">🙌</div>
                <p className="mt-3 text-base font-semibold text-[#0B1121]">Mensaje recibido</p>
                <p className="mt-1 text-sm text-[#4B5675]">Te respondemos a la brevedad en {form.email}.</p>
                <button
                  onClick={() => { setForm({ nombre: "", email: "", asunto: "", mensaje: "" }); setStatus("idle"); }}
                  className="mt-6 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm text-[#4B5675] hover:bg-[#F0F4FF]"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#4B5675]">Nombre</label>
                    <input
                      name="nombre" value={form.nombre} onChange={onChange} required
                      placeholder="Tu nombre"
                      className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2.5 text-sm text-[#0B1121] placeholder:text-[#8B93A7] focus:border-[#0ED8B1] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#4B5675]">Email</label>
                    <input
                      name="email" type="email" value={form.email} onChange={onChange} required
                      placeholder="tu@email.com"
                      className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2.5 text-sm text-[#0B1121] placeholder:text-[#8B93A7] focus:border-[#0ED8B1] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#4B5675]">Asunto</label>
                  <select
                    name="asunto" value={form.asunto} onChange={onChange} required
                    className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2.5 text-sm text-[#0B1121] focus:border-[#0ED8B1] focus:outline-none"
                  >
                    <option value="">Selecciona un asunto</option>
                    <option value="Error en el análisis">Error en el análisis</option>
                    <option value="Problema técnico">Problema técnico</option>
                    <option value="Solicitud de eliminación de certificado">Solicitud de eliminación de certificado</option>
                    <option value="Consulta general">Consulta general</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#4B5675]">Mensaje</label>
                  <textarea
                    name="mensaje" value={form.mensaje} onChange={onChange} required
                    rows={5} placeholder="Cuéntanos con detalle..."
                    className="w-full resize-none rounded-lg border border-[#E2E8F0] px-3 py-2.5 text-sm text-[#0B1121] placeholder:text-[#8B93A7] focus:border-[#0ED8B1] focus:outline-none"
                  />
                </div>

                {status === "error" && (
                  <p className="text-xs text-red-500">Hubo un error al enviar. Intenta de nuevo o escríbenos directo a hola@droneok.cl.</p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full rounded-lg bg-[#0B1121] py-2.5 text-sm font-semibold text-white hover:bg-[#1a2540] disabled:opacity-50"
                >
                  {status === "sending" ? "Enviando…" : "Enviar mensaje"}
                </button>
              </form>
            )}
          </div>

          {/* Info lateral */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] p-5">
              <h3 className="text-sm font-semibold text-[#0B1121]">Email directo</h3>
              <a href="mailto:hola@droneok.cl" className="mt-1 block text-sm text-[#0AA889] hover:underline">
                hola@droneok.cl
              </a>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] p-5">
              <h3 className="text-sm font-semibold text-[#0B1121]">Tiempo de respuesta</h3>
              <p className="mt-1 text-sm text-[#4B5675]">Normalmente respondemos dentro de 24–48 horas hábiles.</p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
              <h3 className="text-sm font-semibold text-amber-800">Estamos en beta</h3>
              <p className="mt-1 text-sm text-amber-700">
                Si encontraste un error, tu reporte nos ayuda mucho a mejorar. Incluye el ID del certificado si aplica.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
