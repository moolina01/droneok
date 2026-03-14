import { NextResponse } from "next/server";
import { getCertificate } from "@/lib/certificate-store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cert = getCertificate(id);

  if (!cert) {
    return NextResponse.json({ ok: false, error: "Certificado no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, certificate: cert });
}
