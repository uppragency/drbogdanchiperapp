import type { ReactNode } from "react";
import { getTx } from "@/lib/i18n";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { FullLogo } from "@/components/brand";
import { LangSwitch } from "@/components/lang-switch";
import { ThemeToggle } from "@/components/theme-toggle";


// Single column on phones, form plus brand panel on desktop.
export async function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const tx = await getTx();
  const POINTS = [
    tx("Înregistrările webinariilor, disponibile oricând", "Webinar recordings, available anytime"),
    tx("Colecții de lecții, în ordinea recomandată", "Lesson collections, in the recommended order"),
    tx("Materiale și resurse pentru fiecare ediție MentorMed", "Materials and resources for every MentorMed edition"),
  ];
  return (
    <main className="relative grid flex-1 lg:grid-cols-2">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2"><LangSwitch /><ThemeToggle /></div>
      <section className="flex flex-col items-center justify-center px-4 py-16">
        <div className="mb-8 flex justify-center lg:hidden">
          <FullLogo />
        </div>
        <div className="w-full max-w-md rounded-card border border-line bg-surface p-6 md:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6 flex flex-col gap-6">{children}</div>
        </div>
      </section>
      <aside aria-hidden className="relative hidden flex-col justify-center overflow-hidden bg-[#0d1c5c] p-16 text-white dark:bg-[#0a1238] lg:flex">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-[#9155f6]/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-[#313885] blur-3xl" />
        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/75">MentorMed</p>
          <p className="mt-4 text-4xl font-bold leading-tight tracking-tight">{tx("Platforma membrilor Dr. Bogdan Chiper.", "The Dr. Bogdan Chiper members platform.")}</p>
          <ul className="mt-10 flex flex-col gap-4">
            {POINTS.map((x) => (
              <li key={x} className="flex items-start gap-3 text-white/90">
                <CheckCircle size={22} className="mt-0.5 shrink-0 text-[#b896ff]" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
