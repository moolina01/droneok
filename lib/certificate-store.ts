import fs from "fs";
import path from "path";
import type { StoredCertificate } from "@/types/certificate";

const STORE_PATH = path.join(process.cwd(), "data", "certificates.json");

// ── Persistence helpers ───────────────────────────────────────────────────────

function readStore(): Record<string, StoredCertificate> {
  try {
    if (!fs.existsSync(STORE_PATH)) return {};
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, StoredCertificate>): void {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

// ── Public API ────────────────────────────────────────────────────────────────

export function saveCertificate(cert: StoredCertificate): void {
  const store = readStore();
  store[cert.id] = cert;
  writeStore(store);
}

export function getCertificate(id: string): StoredCertificate | null {
  const store = readStore();
  return store[id] ?? null;
}

// ── ID generation ─────────────────────────────────────────────────────────────

export function generateCertificateId(): string {
  const hex = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `DC-${hex}`;
}
