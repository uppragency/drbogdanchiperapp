"use client";
import { useEffect } from "react";
import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react";
import { btn, cn } from "@/components/ui";
import { Wordmark } from "@/components/brand";
import { useTx } from "@/components/locale-provider";

export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const tx = useTx();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Wordmark />
      <span className="flex size-16 items-center justify-center rounded-full bg-danger-bg text-danger"><WarningCircle size={32} aria-hidden /></span>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{tx("Ceva nu a funcționat", "Something went wrong")}</h1>
        <p className="max-w-[48ch] text-muted">{tx("A apărut o eroare. Încearcă din nou, iar dacă se repetă, scrie-ne din pagina Contact.", "An error occurred. Please try again, and if it keeps happening, contact us from the Contact page.")}</p>
        {error.digest && <p className="text-xs text-muted">{tx("Cod", "Code")}: {error.digest}</p>}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={cn(btn.primary, "rounded-full")}>{tx("Încearcă din nou", "Try again")}</button>
        <Link href="/feed" className={cn(btn.secondary, "rounded-full")}>{tx("Înapoi la resurse", "Back to resources")}</Link>
      </div>
    </main>
  );
}
