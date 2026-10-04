"use client";
import { useEffect, useState } from "react";
import { Moon, SunDim } from "@phosphor-icons/react";
import { useTx } from "@/components/locale-provider";

// Cinema mode: dims the whole page except the video. Esc or a click on the dimmed area exits.
export function CinemaFrame({ children }: { children: React.ReactNode }) {
  const tx = useTx();
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!on) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOn(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [on]);
  return (
    <div className="flex flex-col gap-3">
      {on && <div aria-hidden onClick={() => setOn(false)} className="page-fade fixed inset-0 z-[45] bg-black/85" />}
      <div className={on ? "relative z-50" : "relative"}>{children}</div>
      <div className={on ? "relative z-50" : undefined}>
        <button
          type="button"
          aria-pressed={on}
          onClick={() => setOn((v) => !v)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-muted transition-colors hover:text-ink"
        >
          {on ? <SunDim size={18} /> : <Moon size={18} />} {on ? tx("Ieși din modul cinema", "Exit cinema mode") : tx("Mod cinema", "Cinema mode")}
        </button>
      </div>
    </div>
  );
}
