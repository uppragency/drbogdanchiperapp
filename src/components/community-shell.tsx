import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, List } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/components/ui";
import { CategoryIcon } from "@/lib/category-icons";
import { categoryColor } from "@/lib/category-color";
import { getLocale, getT, getTx, pick } from "@/lib/i18n";
import { PollCard } from "@/app/(app)/feed/poll-card";
import { createClient } from "@/lib/supabase/server";

export const PROGRAM_URL = "https://drbogdanchiper.ro/produs/mentormed/";

export type ShellCategory = { id: string; name: string; name_en?: string | null; slug: string };
export type ShellLink = { id: string; title: string; date: string };

type Props = {
  categories: ShellCategory[];
  activeSlug?: string;
  newByCategory: Record<string, number>;
  newTotal: number;
  announcements: ShellLink[];
  related?: ShellLink[];
  categoryHref?: (slug?: string) => string;
  className?: string;
  children: ReactNode;
};

// Shared three column layout: categories on the left, content in the middle, announcements and the program card on the right.
export async function CommunityShell({ categories, activeSlug, newByCategory, newTotal, announcements, related = [], categoryHref = (s) => (s ? `/feed?categorie=${s}` : "/feed"), className, children }: Props) {
  const [t, tx, locale] = await Promise.all([getT(), getTx(), getLocale()]);
  const supabase = await createClient();
  const { data: courseRows } = await supabase.from("premium_courses").select("slug,title,title_en").eq("is_published", true).order("position").limit(6);
  const nameOf = (c: ShellCategory) => pick(locale, c.name, c.name_en);
  const active = categories.find((c) => c.slug === activeSlug);
  const rail = (
    <nav aria-label={t.home.categories} className="flex flex-col gap-1">
      <RailLink href={categoryHref()} active={!activeSlug} label={t.feed.all} count={newTotal} />
      {categories.map((c) => (
        <RailLink key={c.id} href={categoryHref(c.slug)} active={activeSlug === c.slug} slug={c.slug} label={nameOf(c)} count={newByCategory[c.id] ?? 0} />
      ))}
    </nav>
  );

  return (
    <div className={cn("shell-grid mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)_300px]", className)}>
      <aside className="shell-side hidden md:row-span-2 md:block lg:row-span-1">
        <div className="sticky top-24">{rail}</div>
      </aside>

      <div className="flex min-w-0 flex-col gap-5">
        <details className="group md:hidden">
          <summary className="flex h-12 cursor-pointer list-none items-center justify-between rounded-full border border-line bg-surface px-5 text-sm font-semibold">
            <span className="flex items-center gap-2"><List size={18} /> {active ? nameOf(active) : t.home.categories}</span>
            <span className="text-muted group-open:rotate-180">⌄</span>
          </summary>
          <div className="mt-2 rounded-card border border-line bg-surface p-2 shadow-card">{rail}</div>
        </details>
        {children}
      </div>

      <aside className="shell-side flex flex-col gap-6 md:col-start-2 lg:col-start-3 lg:row-start-1 lg:sticky lg:top-24 lg:self-start">
        <LinkList title={t.home.announcements} items={announcements} />
        <LinkList title={tx("Din aceeași categorie", "More in this category")} items={related} />
        <div className="relative overflow-hidden rounded-card border border-line bg-violet-soft p-6 text-ink dark:bg-surface2">
          <div aria-hidden className="absolute -right-12 -top-12 size-44 rounded-full bg-[#9155f6]/20 blur-3xl" />
          <p className="relative text-xs font-semibold uppercase tracking-wider text-muted">{t.home.nextProgram}</p>
          <p className="relative mt-3 text-lg font-bold leading-snug">{t.home.nextProgramText}</p>
          <a href={PROGRAM_URL} target="_blank" rel="noopener noreferrer" className="relative mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-violet px-5 text-sm font-semibold text-on-violet transition-colors hover:bg-violet-hover active:scale-[0.98]">
            {t.home.nextProgramCta} <ArrowUpRight size={16} weight="bold" />
          </a>
        </div>
        {(courseRows ?? []).length > 0 && (
          <div className="rounded-card border border-line bg-surface p-6 shadow-card">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">{tx("Cursuri premium", "Premium courses")}</h3>
            <ul className="mt-4 flex flex-col divide-y divide-line">
              {(courseRows ?? []).map((c) => (
                <li key={c.slug} className="pb-3 pt-[5px] first:pt-0 last:pb-0">
                  <Link href={`/cursuri/${c.slug}`} className="text-sm font-semibold leading-snug hover:text-accent">{pick(locale, c.title as string, c.title_en as string)}</Link>
                </li>
              ))}
            </ul>
            <Link href="/cursuri" className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent hover:underline">{tx("Toate cursurile", "All courses")} <ArrowUpRight size={14} weight="bold" /></Link>
          </div>
        )}
        <PollCard />
      </aside>
    </div>
  );
}

function LinkList({ title, items }: { title: string; items: ShellLink[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted">{title}</h3>
      <ul className="mt-4 flex flex-col divide-y divide-line">
        {items.map((a) => (
          <li key={a.id} className="pb-3 pt-[5px] first:pt-0 last:pb-0">
            <Link href={`/resurse/${a.id}`} className="flex flex-col gap-1 hover:text-accent">
              <span className="text-sm font-semibold leading-snug">{a.title}</span>
              <span className="text-xs text-muted">{a.date}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RailLink({ href, active, slug, label, count }: { href: string; active: boolean; slug?: string; label: string; count: number }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold transition-colors", active ? "bg-surface2 text-ink" : "text-muted hover:bg-surface2 hover:text-ink")}>
      <CategoryIcon slug={slug} size={20} className={active ? "text-accent" : ""} />
      <span className="flex-1">{label}</span>
      {slug && <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: categoryColor(slug, label) }} />}
      {count > 0 && <span className="rounded-full bg-violet px-2 py-0.5 text-xs font-bold text-on-violet">{count}</span>}
    </Link>
  );
}
