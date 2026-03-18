import Link from "next/link";
import DroneOKIcon from "@/componets/ui/DroneOKIcon";

export default function Footer() {
  return (
    <footer className="bg-[#0B1121] text-[#8B93A7]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <DroneOKIcon size={24} color="#34D399" spinDuration={2.5} />
              <span className="text-[15px] font-semibold text-white">
                DroneOK<span className="text-[#0ED8B1]">.cl</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#8B93A7]">
              El primer verificador de drones en Chile. Analizamos los registros de vuelo DJI y generamos certificados verificables para compra y venta.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-[#8B93A7]">
              <span>🇨🇱 Hecho en Chile</span>
              <span>·</span>
              <span>hola@droneok.cl</span>
            </div>
          </div>

          {/* Producto */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#8B93A7]">Producto</h3>
            <ul className="space-y-3 text-sm">
              {[
                ["#velocidad", "Cómo funciona"],
                ["#compatibilidad", "Compatibilidad DJI"],
                ["/verify/demo", "Verificar certificado"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="transition-colors hover:text-white">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#8B93A7]">Legal</h3>
            <ul className="space-y-3 text-sm">
              {[
                ["/privacidad", "Privacidad"],
                ["/terminos", "Términos de uso"],
                ["/contacto", "Contacto"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="transition-colors hover:text-white">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[#1e2d4a] pt-6 text-xs text-[#8B93A7] sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} DroneOK. Todos los derechos reservados.</span>
          <span className="hidden sm:block">Basado en datos de vuelo oficiales de DJI</span>
        </div>
      </div>
    </footer>
  );
}
