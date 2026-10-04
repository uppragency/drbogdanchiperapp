"use client";
import { useState, useTransition } from "react";
import { Heart } from "@phosphor-icons/react";
import { cn } from "@/components/ui";
import { toast } from "@/components/toaster";
import { setFavorite } from "./actions";

export function FavoriteButton({ resourceId, initial, compact }: { resourceId: string; initial: boolean; compact?: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={pending}
      onClick={() => {
        const next = !on;
        setOn(next);
        start(async () => {
          const result = await setFavorite(resourceId, next);
          setOn(result);
          if (result === next) toast(next ? "Salvat la favorite" : "Scos din favorite");
          else toast("Nu am putut salva. Încearcă din nou.", "error");
        });
      }}
      aria-label={compact ? (on ? "Scoate din favorite" : "Adaugă la favorite") : undefined}
      className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors", compact ? "w-11 shrink-0" : "border px-4", on ? (compact ? "text-accent" : "border-accent bg-accent text-accent-ink") : compact ? "text-muted hover:bg-surface2 hover:text-ink" : "border-line bg-surface text-muted hover:text-ink")}
    >
      <Heart size={18} weight={on ? "fill" : "regular"} /> {!compact && (on ? "În favorite" : "Adaugă la favorite")}
    </button>
  );
}
