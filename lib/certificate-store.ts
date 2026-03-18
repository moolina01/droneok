import type { StoredCertificate } from "@/types/certificate";
import { supabase } from "@/lib/supabase";

// ── Public API ────────────────────────────────────────────────────────────────

export async function saveCertificate(cert: StoredCertificate): Promise<void> {
  const { error } = await supabase
    .from("certificates")
    .upsert({ id: cert.id, data: cert }, { onConflict: "id" });
  if (error) throw new Error(`Supabase saveCertificate: ${error.message}`);
}

export async function getCertificate(id: string): Promise<StoredCertificate | null> {
  const { data, error } = await supabase
    .from("certificates")
    .select("data")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data.data as StoredCertificate;
}

// ── ID generation ─────────────────────────────────────────────────────────────

export function generateCertificateId(): string {
  const hex = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `DC-${hex}`;
}
