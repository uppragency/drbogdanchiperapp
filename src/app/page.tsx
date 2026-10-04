import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { getViewer } from "@/lib/auth";
import { Wordmark } from "@/components/brand";
import { PROGRAM_URL } from "@/components/community-shell";
import { btn } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { t } from "@/lib/texts";
import { RequestForm } from "./landing/request-form";

export const metadata: Metadata = { title: t.brand };

export default async function Home() {
  const viewer = await getViewer();
  if (viewer) redirect("/feed");
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Wordmark />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className={btn.secondary}>Intră în cont</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-20 md:py-28">
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-ink md:text-6xl">Platforma membrilor MentorMed.</h1>
          <p className="max-w-[55ch] text-lg leading-relaxed text-muted">{t.footer.tagline}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="#acces" className={btn.primary}>Cere acces</a>
            <Link href="/login" className={btn.secondary}>Am deja cont</Link>
          </div>
        </section>

        <section className="bg-surface2">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center">
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-bold tracking-tight">{t.home.nextProgram}</h2>
              <p className="max-w-[50ch] text-muted">{t.home.nextProgramText}</p>
            </div>
            <div>
              <a href={PROGRAM_URL} target="_blank" rel="noopener noreferrer" className={btn.primary}>
                {t.home.nextProgramCta} <ArrowUpRight size={16} weight="bold" />
              </a>
            </div>
          </div>
        </section>

        <section id="acces" className="mx-auto w-full max-w-2xl scroll-mt-8 px-4 py-20">
          <h2 className="text-3xl font-bold tracking-tight">Cere acces</h2>
          <p className="mt-3 text-muted">Accesul este rezervat participanților la program. Trimite datele tale, iar echipa verifică înscrierea și îți creează contul.</p>
          <div className="mt-8 rounded-card border border-line bg-surface p-6 md:p-8">
            <RequestForm />
          </div>
        </section>
      </main>
    </>
  );
}
