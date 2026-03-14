"use client";
import Link from "next/link";
import { useState } from "react";

function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="13" y="1" width="11" height="11" rx="2.5" transform="rotate(45 13 1)" fill="#0ED8B1"/>
      <circle cx="13" cy="13" r="3" fill="#0B1121"/>
    </svg>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navLinks = [
    ["#riesgos", "Por qué DroneOK"],
    ["#velocidad", "Cómo funciona"],
    ["#compatibilidad", "Compatibilidad"],
  ];
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8F0] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[15px] font-bold tracking-tight text-[#0B1121]">
            DroneOK<span className="text-[#0ED8B1]">.cl</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map(([href, label]) => (
            <Link key={href} href={href} className="text-sm text-[#4B5675] transition-colors hover:text-[#0B1121]">
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/" className="rounded-lg bg-[#0B1121] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1a2540]">
            Generar certificado
          </Link>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-md text-[#4B5675] hover:bg-[#F0F4FF] md:hidden" onClick={() => setOpen(!open)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            {open
              ? <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
              : <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
            }
          </svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-[#E2E8F0] bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {navLinks.map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-[#4B5675] hover:bg-[#F0F4FF]">{label}</Link>
            ))}
            <Link href="/" onClick={() => setOpen(false)} className="mt-2 rounded-lg bg-[#0B1121] px-3 py-2.5 text-center text-sm font-semibold text-white">
              Generar certificado
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
