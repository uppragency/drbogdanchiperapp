"use client";
import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import { useTx } from "@/components/locale-provider";

export function CopyCode({ code }: { code: string }) {
  const tx = useTx();
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch { /* clipboard unavailable: the code stays selectable */ }
  }
  return (
    <button type="button" onClick={copy} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-dashed border-accent bg-bg px-4 font-mono text-base font-bold">
      <span className="select-all">{code}</span>
      {done ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
      <span className="sr-only" aria-live="polite">{done ? tx("Copiat", "Copied") : tx("Copiază codul", "Copy code")}</span>
    </button>
  );
}
