import type { Metadata } from "next";
import Link from "next/link";
import { getTx } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const tx = await getTx();
  return {
    title: tx("Hartă site", "Sitemap"),
    description: tx("Toate paginile platformei MentorMed, grupate pe teme.", "All pages of the MentorMed platform, grouped by topic."),
  };
}

export default async function SitemapPage() {
  const tx = await getTx();
  const groups: { title: string; items: { href: string; label: string; member?: boolean }[] }[] = [
    {
      title: tx("Învață", "Learn"),
      items: [
        { href: "/feed", label: tx("Resurse", "Resources"), member: true },
        { href: "/colectii", label: tx("Colecții", "Collections"), member: true },
        { href: "/recente", label: tx("Văzute recent", "Recently viewed"), member: true },
        { href: "/cauta", label: tx("Căutare", "Search"), member: true },
      ],
    },
    {
      title: tx("Contul tău", "Your account"),
      items: [
        { href: "/profil", label: tx("Profil", "Profile"), member: true },
        { href: "/notificari", label: tx("Notificări", "Notifications"), member: true },
        { href: "/login", label: tx("Intră în cont", "Sign in") },
        { href: "/parola-uitata", label: tx("Resetează parola", "Reset password") },
      ],
    },
    {
      title: tx("Ajutor și noutăți", "Help and news"),
      items: [
        { href: "/faq", label: tx("Întrebări frecvente", "FAQ"), member: true },
        { href: "/contact", label: "Contact", member: true },
        { href: "/ce-e-nou", label: tx("Ce e nou", "What's new"), member: true },
        { href: "/roadmap", label: "Roadmap" },
        { href: "/status", label: tx("Status sisteme", "System status") },
      ],
    },
    {
      title: tx("Informații legale", "Legal"),
      items: [
        { href: "/legal/termeni", label: tx("Termeni și condiții", "Terms and conditions") },
        { href: "/legal/confidentialitate", label: tx("Politica de confidențialitate", "Privacy policy") },
        { href: "/legal/cookies", label: tx("Politica de cookies", "Cookie policy") },
      ],
    },
  ];
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight">{tx("Hartă site", "Sitemap")}</h1>
      <p className="mt-3 text-muted">{tx("Paginile marcate cu „cont” cer autentificare.", "Pages marked “account” require signing in.")}</p>
      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title} className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">{g.title}</h2>
            <ul className="flex flex-col gap-1">
              {g.items.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className="flex min-h-11 items-center gap-2 hover:underline">
                    {i.label}
                    {i.member && <span className="rounded-full bg-surface2 px-2 py-0.5 text-xs text-muted">{tx("cont", "account")}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </div>
  );
}
