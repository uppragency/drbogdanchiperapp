"use client";
import { useState, useTransition } from "react";
import { BookmarkSimple } from "@phosphor-icons/react";
import { cn } from "@/components/ui";
import { toast } from "@/components/toaster";
import { useTx } from "@/components/locale-provider";
import { setFavorite } from "./actions";

export function FavoriteButton({ resourceId, initial, compact }: { resourceId: string; initial: boolean; compact?: boolean }) {
  const tx = useTx();
  const [on, setOn] = useState(initial);
  const [pulse, setPulse] = useState(0);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={pending}
      onClick={() => {
        const next = !on;
        setOn(next);
        if (next) setPulse((n) => n + 1);
        start(async () => {
          const result = await setFavorite(resourceId, next);
          setOn(result);
          if (result === next) toast(next ? tx("Salvat la favorite", "Saved to favourites") : tx("Scos din favorite", "Removed from favourites"));
          else toast(tx("Nu am putut salva. Încearcă din nou.", "Could not save. Try again."), "error");
        });
      }}
      aria-label={compact ? (on ? tx("Scoate din favorite", "Remove from favourites") : tx("Salvează la favorite", "Save to favourites")) : undefined}
      className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors", compact ? "w-11 shrink-0" : "border px-4", on ? (compact ? "text-accent" : "border-accent bg-accent text-accent-ink") : compact ? "text-muted hover:bg-surface2 hover:text-ink" : "border-line bg-surface text-muted hover:text-ink")}
    >
      <BookmarkSimple key={pulse} size={18} weight={on ? "fill" : "regular"} className={pulse > 0 && on ? "heart-pulse" : undefined} /> {!compact && (on ? tx("În favorite", "In favourites") : tx("Adaugă la favorite", "Add to favourites"))}
    </button>
  );
}
