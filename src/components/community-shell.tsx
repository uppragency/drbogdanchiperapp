import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/components/ui";
import { t } from "@/lib/texts";

export const PROGRAM_URL = "https://drbogdanchiper.ro/produs/mentormed/";

export type ShellCategory = { id: string; name: string; slug: string };
export type ShellLink = { id: string; title: string; date: string };

type Props = {
  categories: ShellCategory[];
  activeSlug?: string;
  newByCategory: Record<string, number>;
  newTotal: number;
  announcements: ShellLink[];
  related?: ShellLink[];
  aside?: ReactNode;
  categoryHref?: (slug?: string) => string;
  className?: string;
  children: ReactNode;
};

// Shared content layout: category chips (mobile), main column, and a right column with announcements and the program card.
export function CommunityShell({ categories, activeSlug, newByCategory, newTotal, announcements, related = [], aside, categoryHref = (s) => (s ? `/feed?categorie=${s}` : "/feed"), className, children }: Props) {
  return (
    <div className={cn("mx-auto grid w-full max-w-[1120px] gap-8 px-4 lg:px-8 xl:grid-cols-[minmax(0,1fr)_320px]", className)}>
      <div className="flex min-w-0 flex-col gap-5">
        <nav aria-label={t.home.categories} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
          <Chip href={categoryHref()} active={!activeSlug} label={t.feed.all} count={newTotal} />
          {categories.map((c) => (
            <Chip key={c.id} href={categoryHref(c.slug)} active={activeSlug === c.slug} label={c.name} count={newByCategory[c.id] ?? 0} />
          ))}
        </nav>
        {children}
      </div>

      <aside className="flex flex-col gap-6 xl:sticky xl:top-8 xl:self-start">
        {aside}
        <LinkList title={t.home.announcements} items={announcements} />
        <LinkList title="Din aceeași categorie" items={related} />
        <div className="relative overflow-hidden rounded-card bg-[#0d1c5c] p-6 text-white dark:bg-surface2">
          <div aria-hidden className="absolute -right-12 -top-12 size-44 rounded-full bg-[#9155f6]/45 blur-3xl" />
          <p className="relative text-xs font-semibold uppercase tracking-wider text-white/75">{t.home.nextProgram}</p>
          <p className="relative mt-3 text-lg font-bold leading-snug">{t.home.nextProgramText}</p>
          <a href={PROGRAM_URL} target="_blank" rel="noopener noreferrer" className="relative mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-violet px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-hover active:scale-[0.98]">
            {t.home.nextProgramCta} <ArrowUpRight size={16} weight="bold" />
          </a>
        </div>
      </aside>
    </div>
  );
}

function Chip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn("inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors", active ? "bg-accent text-accent-ink" : "bg-surface2 text-muted hover:text-ink")}>
      {label}
      {count > 0 && <span className="rounded-full bg-violet px-2 py-0.5 text-xs font-bold text-white">{count}</span>}
    </Link>
  );
}

function LinkList({ title, items }: { title: string; items: ShellLink[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted">{title}</h3>
      <ul className="mt-4 flex flex-col divide-y divide-line">
        {items.map((a) => (
          <li key={a.id}>
            <Link href={`/resurse/${a.id}`} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 hover:text-accent">
              <span className="text-sm font-semibold leading-snug">{a.title}</span>
              <span className="text-xs text-muted">{a.date}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
