"use client";
import { useState, useTransition } from "react";
import { Heart } from "@phosphor-icons/react";
import { cn } from "@/components/ui";
import { setFavorite } from "./actions";

export function FavoriteButton({ resourceId, initial }: { resourceId: string; initial: boolean }) {
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
        start(async () => setOn(await setFavorite(resourceId, next)));
      }}
      className={cn("inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors", on ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-muted hover:text-ink")}
    >
      <Heart size={18} weight={on ? "fill" : "regular"} /> {on ? "În favorite" : "Adaugă la favorite"}
    </button>
  );
}
