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
      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        {/* Tabs — always visible */}
        <div className="flex">
          <button
            onClick={() => setTab("seller")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors sm:px-4 sm:py-3 sm:text-sm ${
              tab === "seller"
                ? "border-[#0ED8B1] text-[#0B1121]"
                : "border-transparent text-[#8B93A7] hover:text-[#4B5675]"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 sm:h-[14px] sm:w-[14px]">
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
            </svg>
            Soy vendedor
          </button>
          <button
            onClick={() => setTab("buyer")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors sm:px-4 sm:py-3 sm:text-sm ${
              tab === "buyer"
                ? "border-[#0ED8B1] text-[#0B1121]"
                : "border-transparent text-[#8B93A7] hover:text-[#4B5675]"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 sm:h-[14px] sm:w-[14px]">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Soy comprador
          </button>

          {/* Seller message — inline on md+, hidden on mobile (shown below) */}
          {tab === "seller" && (
            <p className="hidden md:flex ml-4 items-center text-xs text-[#8B93A7]">
              Carga los registros y genera el certificado en menos de 30 segundos
            </p>
          )}
        </div>

        {/* Seller message — mobile only, below tabs */}
        {tab === "seller" && (
          <p className="pb-2 text-xs text-[#8B93A7] md:hidden">
            Carga los registros y genera el certificado en menos de 30 segundos
          </p>
        )}

        {/* Buyer input — full width row below tabs on mobile, inline on md+ */}
        {tab === "buyer" && (
          <div className="flex items-center gap-2 pb-2 pt-1 md:hidden">
            <input
              type="text"
              value={certId}
              onChange={e => setCertId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onVerify()}
              placeholder="ID del certificado — ej: DC-BC721FEC"
              className="min-w-0 flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs text-[#0B1121] placeholder:text-[#8B93A7] focus:border-[#0ED8B1] focus:outline-none"
            />
            <button
              onClick={onVerify}
              className="shrink-0 rounded-lg bg-[#0B1121] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a2540]"
            >
              Verificar
            </button>
          </div>
        )}
      </div>

      {/* Buyer input — desktop inline version */}
      {tab === "buyer" && (
        <div className="hidden md:block border-t border-[#E2E8F0]">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-2">
            <input
              type="text"
              value={certId}
              onChange={e => setCertId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onVerify()}
              placeholder="Ingresa el ID del certificado — ej: DC-BC721FEC"
              className="min-w-0 flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm text-[#0B1121] placeholder:text-[#8B93A7] focus:border-[#0ED8B1] focus:outline-none"
            />
            <button
              onClick={onVerify}
              className="shrink-0 rounded-lg bg-[#0B1121] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#1a2540]"
            >
              Verificar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
