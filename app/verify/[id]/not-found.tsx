import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-3xl">
          🔍
        </div>
        <h1 className="mt-5 text-xl font-semibold text-neutral-900">
          Certificado no encontrado
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Este ID no corresponde a ningún certificado generado. Verificá que el link sea correcto.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Generar un certificado en DroneOK
        </Link>
      </div>
    </div>
  );
}
