import Link from "next/link";
import { t } from "@/lib/texts";
import { Wordmark } from "@/components/brand";

const PROGRAM_URL = "https://drbogdanchiper.ro/produs/mentormed/";

export function SiteFooter() {
  const link = "text-sm text-white/80 transition-colors hover:text-white";
  return (
    <footer className="mt-24 bg-[#0d1c5c] text-white dark:bg-[#060a1f]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Wordmark className="text-xl" />
          <p className="max-w-xs text-sm leading-relaxed text-white/80">{t.footer.tagline}</p>
        </div>
        <nav aria-label={t.footer.platform} className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{t.footer.platform}</p>
          <Link href="/feed" className={link}>{t.nav.feed}</Link>
          <Link href="/profil" className={link}>{t.nav.profile}</Link>
        </nav>
        <nav aria-label={t.footer.legal} className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{t.footer.legal}</p>
          <Link href="/legal/termeni" className={link}>{t.terms.termsLink}</Link>
          <Link href="/legal/confidentialitate" className={link}>{t.terms.privacyLink}</Link>
        </nav>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{t.footer.contact}</p>
          <a href="mailto:platforma@drbogdanchiper.ro" className={link}>platforma@drbogdanchiper.ro</a>
          <a href="https://drbogdanchiper.ro" target="_blank" rel="noopener noreferrer" className={link}>{t.footer.site}</a>
          <a href={PROGRAM_URL} target="_blank" rel="noopener noreferrer" className={link}>{t.footer.program}</a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto w-full max-w-6xl px-4 py-5 text-xs text-white/70">© {new Date().getFullYear()} Dr. Bogdan Chiper. {t.footer.rights}</p>
      </div>
    </footer>
  );
}
