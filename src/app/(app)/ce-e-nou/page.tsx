import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { CHANGELOG_CATEGORIES, changelog, type ChangelogEntry } from "@/lib/changelog";
import { cn } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getLocale, getTx, type Tx } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTx())("Ce e nou", "What's new") };
}

function Entry({ e, tx, locale, tag }: { e: ChangelogEntry; tx: Tx; locale: Locale; tag?: string }) {
  return (
    <li className="flex flex-col gap-1 p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <time dateTime={e.date} className="text-xs font-semibold uppercase tracking-wider text-muted">{formatDate(`${e.date}T12:00:00Z`, locale)}</time>
        {tag && <span className="rounded-full bg-violet-soft px-2.5 py-0.5 text-xs font-semibold text-violet">{tag}</span>}
      </div>
      <h3 className="text-lg font-bold leading-snug">{tx(e.title.ro, e.title.en)}</h3>
      <p className="max-w-[65ch] leading-relaxed text-muted">{tx(e.text.ro, e.text.en)}</p>
    </li>
  );
}

export default async function WhatsNewPage({ searchParams }: PageProps<"/ce-e-nou">) {
  await requireUser();
  const sp = await searchParams;
  const [tx, locale] = await Promise.all([getTx(), getLocale()]);
  const active = CHANGELOG_CATEGORIES.find((c) => c.key === sp.categorie)?.key;
  const label = (k: string) => { const c = CHANGELOG_CATEGORIES.find((x) => x.key === k)!; return tx(c.ro, c.en); };
  const latestDate = changelog[0]?.date;
  const latest = changelog.filter((e) => e.date === latestDate);
  const chip = "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors";
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tx("Ce e nou", "What's new")}</h1>
        <p className="max-w-[60ch] text-muted">{tx("Cele mai recente îmbunătățiri ale platformei.", "The latest improvements to the platform.")}</p>
      </header>

      <nav aria-label={tx("Categorii", "Categories")} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <Link href="/ce-e-nou" aria-current={!active ? "page" : undefined} className={cn(chip, !active ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:bg-surface2 hover:text-ink")}>{tx("Toate", "All")}</Link>
        {CHANGELOG_CATEGORIES.map((c) => (
          <Link key={c.key} href={`/ce-e-nou?categorie=${c.key}`} aria-current={active === c.key ? "page" : undefined} className={cn(chip, active === c.key ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:bg-surface2 hover:text-ink")}>{tx(c.ro, c.en)}</Link>
        ))}
      </nav>

      {!active && latest.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{tx("Ultimele update-uri", "Latest updates")}</h2>
          <ol className="flex flex-col divide-y divide-line rounded-card border border-accent/40 bg-surface">
            {latest.map((e) => <Entry key={`${e.date}-${e.title.ro}`} e={e} tx={tx} locale={locale} tag={label(e.category)} />)}
          </ol>
        </section>
      )}

      {CHANGELOG_CATEGORIES.filter((c) => !active || c.key === active).map((c) => {
        const items = changelog.filter((e) => e.category === c.key && (active || e.date !== latestDate));
        if (items.length === 0) return null;
        return (
          <section key={c.key} className="flex flex-col gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{tx(c.ro, c.en)}</h2>
            <ol className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
              {items.map((e) => <Entry key={`${e.date}-${e.title.ro}`} e={e} tx={tx} locale={locale} />)}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
