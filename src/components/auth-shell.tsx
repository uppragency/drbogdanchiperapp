import type { ReactNode } from "react";
import { t } from "@/lib/texts";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <p className="text-2xl font-bold tracking-tight">{t.brand}</p>
        <p className="mt-1 text-sm text-muted">Dr. Bogdan Chiper</p>
      </div>
      <div className="w-full max-w-md rounded-card border border-line bg-surface p-6 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6 flex flex-col gap-5">{children}</div>
      </div>
    </main>
  );
}
