import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { getViewer } from "@/lib/auth";
import { Wordmark } from "@/components/brand";
import { PROGRAM_URL } from "@/components/community-shell";
import { btn } from "@/components/ui";
import { LangSwitch } from "@/components/lang-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { getT, getTx } from "@/lib/i18n";
import { LoginForm } from "./login/login-form";

const STEPS = [
  { ro: ["Loghează-te în contul tău de client", "Folosește emailul cu care te-ai înscris la MentorMed și parola setată de tine prin emailul primit."], en: ["Sign in to your client account", "Use the email you enrolled in MentorMed with and the password you set through the email you received."] },
  { ro: ["Setează-ți profilul", "După logare, completează numele, specializarea și orașul."], en: ["Set up your profile", "After signing in, add your name, specialty and city."] },
  { ro: ["Discută, interacționează și explorează", "Bucură-te de toată experiența MentorMed, cu acces la webinarii, cazuri, resurse și o comunitate activă de medici ca tine."], en: ["Discuss, interact and explore", "Enjoy the full MentorMed experience, with access to webinars, cases, resources and an active community of doctors like you."] },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const [t, tx] = await Promise.all([getT(), getTx()]);
  return { title: t.platformName, description: tx("Intră în platforma MentorMed: webinarii, cazuri, resurse și o comunitate de medici.", "Sign in to the MentorMed platform: webinars, cases, resources and a community of doctors.") };
}

export default async function Home() {
  const viewer = await getViewer();
  if (viewer) redirect("/feed");
  const t = await getT();
  const tx = await getTx();
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Wordmark />
          <div className="flex items-center gap-2">
            <LangSwitch />
            <ThemeToggle />
            <Link href="/login" className={btn.secondary}>{tx("Intră în cont", "Sign in")}</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-[#0a1f5c] text-white">
          <Image src="/hero-login.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 md:py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">{tx("Bine ai venit pe platforma de curs MentorMed", "Welcome to the MentorMed course platform")}</h1>
                <p className="max-w-[58ch] text-base leading-relaxed text-white/80">{tx("Această platformă este dedicată medicilor înscriși în program. Ai acces la resursele de lucru, studii de caz, webinarii, sesiuni aplicate și comunicarea cu echipa de mentori. Dacă ai primit acces pe e-mail, tot ce trebuie să faci este să te loghezi cu contul tău de client pentru a intra în comunitate.", "This platform is dedicated to doctors enrolled in the program. You get access to working resources, case studies, webinars, applied sessions and communication with the mentor team. If you received access by email, all you need to do is sign in with your client account to join the community.")}</p>
              </div>
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold">{tx("Pași acces platformă", "How to access the platform")}</h2>
                <ol className="flex flex-col gap-4">
                  {STEPS.map((s, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold">{i + 1}</span>
                      <span className="flex flex-col gap-0.5">
                        <span className="font-semibold">{tx(s.ro[0], s.en[0])}</span>
                        <span className="text-sm leading-relaxed text-white/75">{tx(s.ro[1], s.en[1])}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div id="login" className="scroll-mt-8 rounded-card border border-line bg-surface p-6 text-ink shadow-card md:p-8">
              <h2 className="text-2xl font-bold tracking-tight">{t.login.title}</h2>
              <p className="mt-2 text-sm text-muted">{t.login.subtitle}</p>
              <div className="mt-6 flex flex-col gap-6">
                <LoginForm next="/feed" />
                <p className="text-center text-sm text-muted">{t.login.noAccount}</p>
              </div>
            </div>
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

      </main>
    </>
  );
}
