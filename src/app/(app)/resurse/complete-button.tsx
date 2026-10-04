"use client";
import { useState, useTransition } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/components/ui";
import { toast } from "@/components/toaster";
import { setCompleted } from "./actions";

export function CompleteButton({ resourceId, initial }: { resourceId: string; initial: boolean }) {
  const [done, setDone] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={done}
      disabled={pending}
      onClick={() => {
        const next = !done;
        setDone(next);
        start(async () => {
          const result = await setCompleted(resourceId, next);
          setDone(result);
          if (result === next) toast(next ? "Marcată ca terminată" : "Marcajul a fost scos");
          else toast("Nu am putut salva. Încearcă din nou.", "error");
        });
      }}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors disabled:opacity-60",
        done ? "border-ok bg-ok-bg text-ok" : "border-line bg-surface text-muted hover:text-ink",
      )}
    >
      <CheckCircle size={18} weight={done ? "fill" : "regular"} /> {done ? "Terminat" : "Am terminat"}
    </button>
  );
}
