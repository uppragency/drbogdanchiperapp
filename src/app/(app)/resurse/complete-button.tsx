"use client";
import { useState, useTransition } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/components/ui";
import { toast } from "@/components/toaster";
import { setCompleted } from "./actions";

export function CompleteButton({ resourceId, initial }: { resourceId: string; initial: boolean }) {
  const [done, setDone] = useState(initial);
  const [animate, setAnimate] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={done}
      disabled={pending}
      onClick={() => {
        const next = !done;
        setDone(next);
        setAnimate(next);
        start(async () => {
          const result = await setCompleted(resourceId, next);
          setDone(result);
          if (result === next) toast(next ? "Marcată ca terminată" : "Marcajul a fost scos");
          else toast("Nu am putut salva. Încearcă din nou.", "error");
        });
      }}
      className={cn(
        "flex h-14 w-full items-center justify-center gap-2 rounded-card border px-6 text-base font-semibold transition-colors disabled:opacity-60",
        done ? "border-ok bg-ok-bg text-ok" : "border-line bg-surface text-ink hover:bg-surface2",
      )}
    >
      {done ? (
        <svg key={animate ? "a" : "s"} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={animate ? "check-draw" : "check-static"} aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M7.5 12.5l3 3 6-6.5" />
        </svg>
      ) : (
        <CheckCircle size={22} />
      )}{" "}
      {done ? "Lecție terminată" : "Am terminat lecția"}
    </button>
  );
}
