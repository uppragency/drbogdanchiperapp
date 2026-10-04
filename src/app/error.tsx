"use client";
import { useEffect } from "react";
import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react";
import { btn, cn } from "@/components/ui";
import { Wordmark } from "@/components/brand";

export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Wordmark />
      <span className="flex size-16 items-center justify-center rounded-full bg-danger-bg text-danger"><WarningCircle size={32} aria-hidden /></span>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Ceva nu a funcționat</h1>
        <p className="max-w-[48ch] text-muted">A apărut o eroare. Încearcă din nou, iar dacă se repetă, scrie-ne din pagina Contact.</p>
        {error.digest && <p className="text-xs text-muted">Cod: {error.digest}</p>}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={cn(btn.primary, "rounded-full")}>Încearcă din nou</button>
        <Link href="/feed" className={cn(btn.secondary, "rounded-full")}>Înapoi la resurse</Link>
      </div>
    </main>
  );
}
