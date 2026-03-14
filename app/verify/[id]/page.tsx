import { notFound } from "next/navigation";
import { getCertificate } from "@/lib/certificate-store";
import CertificatePage from "@/componets/certificate/CertificatePage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cert = getCertificate(id);

  if (!cert) notFound();

  return <CertificatePage cert={cert} mode="buyer" />;
}
