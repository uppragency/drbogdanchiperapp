import type { ReactNode } from "react";
import { FullLogo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <div className="mb-8 flex justify-center">
        <FullLogo />
      </div>
      <div className="w-full max-w-md rounded-card border border-line bg-surface p-6 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6 flex flex-col gap-5">{children}</div>
      </div>
    </main>
  );
}
