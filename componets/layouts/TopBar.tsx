"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TopBar() {
  const [tab, setTab] = useState<"seller" | "buyer">("seller");
  const [certId, setCertId] = useState("");
  const router = useRouter();

  const onVerify = () => {
    const id = certId.trim().toUpperCase();
    if (id) router.push(`/verify/${id}`);
  };

  return (
    <div className="w-full border-b border-[#E2E8F0] bg-[#F0F4FF]">
      <div className="mx-auto flex max-w-6xl items-center gap-0 px-4 sm:px-6">
        {/* Tabs */}
        <div className="flex shrink-0">
          <button
            onClick={() => setTab("seller")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "seller"
                ? "border-[#0ED8B1] text-[#0B1121]"
                : "border-transparent text-[#8B93A7] hover:text-[#4B5675]"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
            </svg>
            Soy vendedor
          </button>
          <button
            onClick={() => setTab("buyer")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "buyer"
                ? "border-[#0ED8B1] text-[#0B1121]"
                : "border-transparent text-[#8B93A7] hover:text-[#4B5675]"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Soy comprador
          </button>
        </div>

        {/* Buyer: verify input */}
        {tab === "buyer" && (
          <div className="ml-4 flex flex-1 items-center gap-2 py-2">
            <input
              type="text"
              value={certId}
              onChange={e => setCertId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onVerify()}
              placeholder="Ingresa el ID del certificado — ej: DC-BC721FEC"
              className="flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm text-[#0B1121] placeholder:text-[#8B93A7] focus:border-[#0ED8B1] focus:outline-none"
            />
            <button
              onClick={onVerify}
              className="shrink-0 rounded-lg bg-[#0B1121] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#1a2540]"
            >
              Verificar
            </button>
          </div>
        )}

        {/* Seller: message */}
        {tab === "seller" && (
          <p className="ml-4 text-xs text-[#8B93A7]">
            Carga los registros de vuelo y genera el certificado en menos de 30 segundos
          </p>
        )}
      </div>
    </div>
  );
}
