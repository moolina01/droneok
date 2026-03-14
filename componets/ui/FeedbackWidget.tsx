"use client";

import { useEffect, useRef, useState } from "react";

type Reaction = "bad" | "meh" | "good" | "love";

const reactions: { key: Reaction; emoji: string; label: string }[] = [
  { key: "bad",  emoji: "😕", label: "Malo" },
  { key: "meh",  emoji: "😐", label: "Regular" },
  { key: "good", emoji: "🙂", label: "Bueno" },
  { key: "love", emoji: "🤩", label: "Excelente" },
];

export default function FeedbackWidget() {
  const [open, setOpen]         = useState(false);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [message, setMessage]   = useState("");
  const [email, setEmail]       = useState("");
  const [status, setStatus]     = useState<"idle" | "sending" | "done">("idle");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const onToggle = () => {
    setOpen((v) => !v);
    if (open) reset();
  };

  const reset = () => {
    setReaction(null);
    setMessage("");
    setEmail("");
    setStatus("idle");
  };

  const onSubmit = async () => {
    if (!reaction || status !== "idle") return;
    setStatus("sending");
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction, message, email }),
      });
      setStatus("done");
      setTimeout(() => setOpen(false), 2200);
    } catch {
      setStatus("idle");
    }
  };

  return (
    <div ref={ref} className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">

      {/* Popover */}
      {open && (
        <div className="w-72 rounded-2xl border border-[#1e2d4a] bg-[#0B1121] shadow-2xl">
          {status === "done" ? (
            <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
              <span className="text-3xl">🙌</span>
              <p className="text-sm font-semibold text-white">¡Gracias por el feedback!</p>
              <p className="text-xs text-[#8B93A7]">Nos ayuda a mejorar DroneOK.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4">
                <span className="text-sm font-semibold text-white">¿Cómo va todo?</span>
                <button onClick={onToggle} className="text-[#8B93A7] hover:text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="px-4 pb-4 pt-3">
                {/* Reactions */}
                <div className="flex justify-between gap-1">
                  {reactions.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setReaction(r.key)}
                      title={r.label}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 text-xl transition-all ${
                        reaction === r.key
                          ? "bg-[#0ED8B1]/15 ring-1 ring-[#0ED8B1]/50"
                          : "bg-[#0f1a2e] hover:bg-[#1a2a40]"
                      }`}
                    >
                      {r.emoji}
                      <span className="text-[10px] text-[#8B93A7]">{r.label}</span>
                    </button>
                  ))}
                </div>

                {/* Optional message */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Cuéntanos más (opcional)"
                  rows={3}
                  className="mt-3 w-full resize-none rounded-lg border border-[#1e2d4a] bg-[#0f1a2e] px-3 py-2 text-xs text-white placeholder:text-[#8B93A7] focus:border-[#0ED8B1]/50 focus:outline-none"
                />

                {/* Optional email */}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu email (si quieres que te respondamos)"
                  className="mt-2 w-full rounded-lg border border-[#1e2d4a] bg-[#0f1a2e] px-3 py-2 text-xs text-white placeholder:text-[#8B93A7] focus:border-[#0ED8B1]/50 focus:outline-none"
                />

                <button
                  onClick={onSubmit}
                  disabled={!reaction || status === "sending"}
                  className="mt-3 w-full rounded-lg bg-[#0ED8B1] py-2 text-xs font-bold text-[#0B1121] transition-opacity disabled:opacity-40 hover:enabled:bg-[#0cc9a5]"
                >
                  {status === "sending" ? "Enviando…" : "Enviar feedback"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold shadow-lg transition-all ${
          open
            ? "bg-[#1a2540] text-[#8B93A7]"
            : "bg-[#0B1121] text-white hover:bg-[#1a2540]"
        }`}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        Feedback
      </button>

    </div>
  );
}
