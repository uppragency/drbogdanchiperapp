"use client";
import { useState, useTransition } from "react";
import { Heart } from "@phosphor-icons/react";
import { cn } from "@/components/ui";
import { toast } from "@/components/toaster";
import { useTx } from "@/components/locale-provider";
import { setLike } from "./actions";

export function LikeButton({ resourceId, initialLiked, initialCount, className }: { resourceId: string; initialLiked: boolean; initialCount: number; className?: string }) {
  const tx = useTx();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pulse, setPulse] = useState(0);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={liked}
      disabled={pending}
      aria-label={liked ? tx("Retrage aprecierea", "Remove like") : tx("Îmi place", "Like")}
      onClick={() => {
        const next = !liked;
        const prevCount = count;
        setLiked(next);
        setCount(Math.max(0, count + (next ? 1 : -1)));
        if (next) setPulse((n) => n + 1);
        start(async () => {
          const res = await setLike(resourceId, next);
          if (res) {
            setLiked(res.liked);
            setCount(res.count);
          } else {
            setLiked(!next);
            setCount(prevCount);
            toast(tx("Nu am putut salva. Încearcă din nou.", "Could not save. Try again."), "error");
          }
        });
      }}
      className={cn("pointer-events-auto relative z-10 -ml-2 inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-semibold transition-colors", liked ? "text-danger" : "text-muted hover:bg-surface2 hover:text-ink", className)}
    >
      <Heart key={pulse} size={20} weight={liked ? "fill" : "regular"} className={pulse > 0 && liked ? "heart-pulse" : undefined} />
      {count > 0 && <span className="tabular-nums">{count}</span>}
    </button>
  );
}
