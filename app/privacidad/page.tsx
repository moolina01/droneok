export const metadata = {
  title: "Política de Privacidad — DroneOK",
  description: "Cómo DroneOK maneja tus datos y registros de vuelo.",
};

export default function PrivacidadPage() {
  return (
    <main className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">

        <div className="mb-10">
          <div className="inline-block rounded-full border border-[#0ED8B1]/30 bg-[#0ED8B1]/10 px-3 py-1 text-xs font-medium text-[#0AA889]">
            Legal
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0B1121]">
            Política de Privacidad
          </h1>
          <p className="mt-2 text-sm text-[#8B93A7]">Última actualización: marzo 2026</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-[#4B5675]">

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#0B1121]">1. Qué datos recopilamos</h2>
            <p>
              DroneOK procesa los archivos de registro de vuelo (.txt) que subes voluntariamente. Estos archivos contienen datos técnicos del dron: historial de vuelos, estado de batería, eventos registrados y número de serie del equipo.
            </p>
            <p className="mt-3">
              No recopilamos datos personales de identificación directa (nombre, RUT, dirección) a menos que los ingreses voluntariamente en el formulario de contacto o en el campo de email del widget de feedback.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#0B1121]">2. Cómo usamos los datos</h2>
            <ul className="space-y-2 list-none">
              {[
                "Los registros de vuelo se procesan únicamente para generar el certificado de diagnóstico solicitado.",
                "Los archivos originales (.txt) se descartan inmediatamente después del análisis y no se almacenan en nuestros servidores.",
                "El certificado generado (con los datos extraídos del análisis) se guarda para permitir la verificación pública mediante el link único.",
                "El feedback enviado a través del widget se usa exclusivamente para mejorar el producto.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0ED8B1]" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#0B1121]">3. Almacenamiento de certificados</h2>
            <p>
              Los certificados generados se almacenan en nuestros servidores para permitir que compradores los verifiquen mediante el link público. Cada certificado incluye datos técnicos del dron (modelo, número de serie, métricas de batería y vuelos).
            </p>
            <p className="mt-3">
              No se almacenan datos personales del vendedor junto al certificado. Si deseas que tu certificado sea eliminado, contáctanos a <a href="mailto:hola@droneok.cl" className="text-[#0AA889] hover:underline">hola@droneok.cl</a> indicando el ID.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#0B1121]">4. Cookies y rastreo</h2>
            <p>
              DroneOK no utiliza cookies de rastreo ni herramientas de analítica de terceros en esta versión beta. No compartimos datos con redes publicitarias.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#0B1121]">5. Terceros</h2>
            <p>
              Para generar el análisis inteligente del certificado utilizamos la API de Anthropic (Claude). Los datos técnicos del dron se envían a esta API para procesar el texto del análisis. Anthropic tiene su propia política de privacidad disponible en <span className="text-[#0B1121] font-medium">anthropic.com</span>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#0B1121]">6. Tus derechos</h2>
            <p>
              Puedes solicitar en cualquier momento la eliminación de un certificado asociado a tu dron escribiendo a <a href="mailto:hola@droneok.cl" className="text-[#0AA889] hover:underline">hola@droneok.cl</a>. Responderemos dentro de 5 días hábiles.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#0B1121]">7. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política en cualquier momento. Los cambios se publicarán en esta página con la fecha de actualización. El uso continuado de DroneOK después de los cambios implica la aceptación de la nueva política.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
