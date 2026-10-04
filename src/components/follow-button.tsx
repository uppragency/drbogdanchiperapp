"use client";
import { useState, useTransition } from "react";
import { Bell, BellRinging } from "@phosphor-icons/react";
import { cn } from "@/components/ui";
import { toast } from "@/components/toaster";
import { useTx } from "@/components/locale-provider";
import { setCategoryFollow } from "@/app/(app)/follow-actions";

export function FollowButton({ categoryId, initial, variant = "short" }: { categoryId: string; initial: boolean; variant?: "short" | "category" }) {
  const tx = useTx();
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const label =
    variant === "category"
      ? on ? tx("Urmărești categoria", "Following category") : tx("Urmărește categoria", "Follow category")
      : on ? tx("Urmărești", "Following") : tx("Urmărește", "Follow");
  const Icon = on ? BellRinging : Bell;
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={pending}
      onClick={() => {
        const next = !on;
        setOn(next);
        start(async () => {
          const result = await setCategoryFollow(categoryId, next);
          setOn(result);
          if (result === next) toast(next ? tx("Vei primi notificări pentru această categorie", "You will get notifications for this category") : tx("Nu mai urmărești categoria", "You no longer follow this category"));
          else toast(tx("Nu am putut salva. Încearcă din nou.", "Could not save. Try again."), "error");
        });
      }}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors disabled:opacity-60",
        on ? "border-accent bg-accent text-accent-ink hover:bg-accent-hover" : "border-line bg-surface text-ink hover:bg-surface2",
      )}
    >
      <Icon size={18} weight={on ? "fill" : "regular"} aria-hidden /> {label}
    </button>
  );
}
