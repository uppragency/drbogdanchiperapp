import Link from "next/link";
import { t } from "@/lib/texts";
import { Wordmark } from "@/components/brand";
import { FacebookLogo, InstagramLogo, WhatsappLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";

const SOCIAL = [
  { href: "https://www.facebook.com/medicideelita", label: "Facebook", Icon: FacebookLogo },
  { href: "https://www.instagram.com/medici.de.elita/", label: "Instagram", Icon: InstagramLogo },
  { href: "https://www.youtube.com/@medicideelita5080", label: "YouTube", Icon: YoutubeLogo },
  { href: "https://api.whatsapp.com/send?phone=0746020724", label: "WhatsApp", Icon: WhatsappLogo },
];

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
          <Link href="/colectii" className={link}>Colecții</Link>
          <Link href="/recente" className={link}>Văzute recent</Link>
          <Link href="/contact" className={link}>Contact</Link>
        </nav>
        <nav aria-label={t.footer.legal} className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{t.footer.legal}</p>
          <Link href="/legal/termeni" className={link}>{t.terms.termsLink}</Link>
          <Link href="/legal/confidentialitate" className={link}>{t.terms.privacyLink}</Link>
        </nav>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{t.footer.contact}</p>
          <a href="mailto:contact@drbogdanchiper.ro" className={link}>contact@drbogdanchiper.ro</a>
          <a href="tel:+40746020724" className={link}>0746 020 724</a>
          <a href="https://drbogdanchiper.ro" target="_blank" rel="noopener noreferrer" className={link}>{t.footer.site}</a>
          <a href={PROGRAM_URL} target="_blank" rel="noopener noreferrer" className={link}>{t.footer.program}</a>
          <ul className="-ml-2 mt-1 flex gap-1" aria-label="Rețele sociale">
            {SOCIAL.map(({ href, label, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="flex size-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white">
                  <Icon size={22} aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto w-full max-w-6xl px-4 py-5 text-xs text-white/70">© {new Date().getFullYear()} Dr. Bogdan Chiper. {t.footer.rights}</p>
      </div>
    </footer>
  );
}
