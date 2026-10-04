"use client";
import { useEffect, useState } from "react";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";

type Toast = { id: number; text: string; kind: "ok" | "error" };
const EVENT = "app-toast";

// Call from any client component: toast("Salvat la favorite").
export function toast(text: string, kind: Toast["kind"] = "ok") {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { text, kind } }));
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    let n = 0;
    const onToast = (e: Event) => {
      const { text, kind } = (e as CustomEvent<{ text: string; kind: Toast["kind"] }>).detail;
      const id = ++n;
      setItems((cur) => [...cur.slice(-2), { id, text, kind }]);
      window.setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== id)), 3200);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 pb-[env(safe-area-inset-bottom)]">
      {items.map((x) => (
        <div key={x.id} className="page-fade pointer-events-auto flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 text-sm font-semibold shadow-card">
          {x.kind === "ok" ? <CheckCircle size={20} className="text-ok" aria-hidden /> : <WarningCircle size={20} className="text-danger" aria-hidden />}
          {x.text}
        </div>
      ))}
    </div>
  );
}
