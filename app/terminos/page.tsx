export const metadata = {
  title: "Términos de Uso — DroneOK",
  description: "Condiciones de uso de la plataforma DroneOK.",
};

export default function TerminosPage() {
  return (
    <main className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">

        <div className="mb-10">
          <div className="inline-block rounded-full border border-[#0ED8B1]/30 bg-[#0ED8B1]/10 px-3 py-1 text-xs font-medium text-[#0AA889]">
            Legal
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0B1121]">
            Términos de Uso
          </h1>
          <p className="mt-2 text-sm text-[#8B93A7]">Última actualización: marzo 2026</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-[#4B5675]">

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#0B1121]">1. Aceptación</h2>
            <p>
              Al usar DroneOK aceptas estos términos. Si no estás de acuerdo, no uses la plataforma. DroneOK es operado desde Chile y se rige por la legislación chilena.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#0B1121]">2. Descripción del servicio</h2>
            <p>
              DroneOK es una plataforma web que analiza archivos de registro de vuelo de drones DJI y genera un certificado de diagnóstico basado en los datos contenidos en dichos archivos. El certificado incluye métricas de batería, historial de vuelos, eventos registrados y un análisis generado por inteligencia artificial.
            </p>
            <p className="mt-3">
              El servicio se encuentra en versión beta. Pueden existir errores, interrupciones o cambios sin previo aviso.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#0B1121]">3. Uso aceptable</h2>
            <ul className="space-y-2 list-none">
              {[
                "Solo puedes subir archivos de registro de vuelo que te pertenezcan o para los que tengas autorización del propietario.",
                "No puedes usar DroneOK para generar certificados con información falsa o manipulada.",
                "No puedes intentar vulnerar, sobrecargar o interferir con los sistemas de DroneOK.",
                "No puedes usar el servicio para actividades ilegales.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0ED8B1]" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#0B1121]">4. Exactitud del certificado</h2>
            <p>
              El certificado generado refleja exclusivamente los datos contenidos en los archivos de registro proporcionados. DroneOK no verifica el estado físico del dron ni garantiza que el equipo no haya sufrido daños no registrados electrónicamente.
            </p>
            <p className="mt-3">
              El análisis de inteligencia artificial es orientativo. DroneOK no es responsable de decisiones de compra o venta tomadas basándose únicamente en el certificado.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#0B1121]">5. Limitación de responsabilidad</h2>
            <p>
              DroneOK se ofrece "tal como está" durante la beta. No garantizamos disponibilidad continua ni la ausencia de errores en el análisis. En ningún caso DroneOK será responsable por pérdidas económicas derivadas del uso del servicio.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#0B1121]">6. Propiedad intelectual</h2>
            <p>
              El software, diseño y marca DroneOK son propiedad de sus creadores. Los datos técnicos generados a partir de tus registros de vuelo son tuyos. No reclamamos propiedad sobre el contenido de tus archivos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#0B1121]">7. Modificaciones</h2>
            <p>
              Podemos modificar estos términos en cualquier momento. Los cambios se publican en esta página. El uso continuado del servicio implica aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#0B1121]">8. Contacto</h2>
            <p>
              Para consultas legales escríbenos a <a href="mailto:hola@droneok.cl" className="text-[#0AA889] hover:underline">hola@droneok.cl</a>.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
