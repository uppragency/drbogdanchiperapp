"use client";
import { useEffect, useState } from "react";
import { ArrowsIn, ArrowsOut } from "@phosphor-icons/react";
import { useTx } from "@/components/locale-provider";

// Focus mode hides the side columns (CSS keyed on data-focus). Always cleared when leaving the page.
export function FocusToggle() {
  const tx = useTx();
  const [on, setOn] = useState(false);
  useEffect(() => {
    document.documentElement.toggleAttribute("data-focus", on);
    return () => document.documentElement.removeAttribute("data-focus");
  }, [on]);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
      className="hidden h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-muted transition-colors hover:text-ink md:inline-flex"
    >
      {on ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />} {on ? tx("Ieși din modul focus", "Exit focus mode") : tx("Mod focus", "Focus mode")}
    </button>
  );
}
