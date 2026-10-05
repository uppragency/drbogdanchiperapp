"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CaretDown, List, X } from "@phosphor-icons/react";
import { CategoryIcon } from "@/lib/category-icons";
import { cn } from "@/components/ui";
import { useTx } from "@/components/locale-provider";

export type MegaItem = { href: string; label: string; slug?: string; icon?: React.ReactNode; count?: number; hint?: string };
export type MegaGroup = { id: string; label: string; items: MegaItem[]; match: string[]; slugs?: string[]; count?: number; columns?: 1 | 2 | 3 };
export type MegaLink = { href: string; label: string; match: string[]; count?: number };

const itemCls = "flex min-h-11 items-center gap-3 rounded-control px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface2";

function Badge({ n }: { n?: number }) {
  if (!n) return null;
  return <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold leading-5 text-accent-ink">{n > 99 ? "99+" : n}</span>;
}

function Row({ it, onPick }: { it: MegaItem; onPick: () => void }) {
  return (
    <Link href={it.href} onClick={onPick} className={itemCls}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet">
        {it.slug ? <CategoryIcon slug={it.slug} size={18} /> : it.icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{it.label}</span>
        {it.hint && <span className="truncate text-xs font-normal text-muted">{it.hint}</span>}
      </span>
      <Badge n={it.count} />
    </Link>
  );
}

// Header navigation. Desktop: groups open a full width dropdown under the header. Mobile: one button with an accordion panel.
export function MegaNav({ groups, links }: { groups: MegaGroup[]; links: MegaLink[] }) {
  const tx = useTx();
  const path = usePathname();
  const cat = useSearchParams().get("categorie");
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = () => { setOpen(null); setMobile(false); };
  useEffect(() => {
    if (!open && !mobile) return;
    const onDown = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open, mobile]);

  const hover = (id: string | null) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(id), id ? 120 : 200);
  };
  const groupActive = (g: MegaGroup) => g.match.some((m) => path === m || path.startsWith(m + "/")) || Boolean(cat && g.slugs?.includes(cat) && path === "/feed");
  const linkActive = (l: MegaLink) => l.match.some((m) => path === m || path.startsWith(m + "/"));
  const current = groups.find((g) => g.id === open);

  return (
    <div ref={wrap} className="contents">
      {/* Desktop */}
      <nav aria-label={tx("Navigare principală", "Main navigation")} className="hidden md:block" onMouseLeave={() => hover(null)}>
        <ul className="flex items-center gap-1">
          {groups.map((g) => (
            <li key={g.id} onMouseEnter={() => hover(g.id)}>
              <button
                type="button"
                aria-expanded={open === g.id}
                aria-haspopup="true"
                onClick={() => { if (timer.current) clearTimeout(timer.current); setOpen(open === g.id ? null : g.id); }}
                className={cn("relative flex h-11 items-center gap-1 whitespace-nowrap px-3 text-sm font-semibold transition-colors", groupActive(g) || open === g.id ? "text-ink" : "text-muted hover:text-ink")}
              >
                {g.label}
                {g.count ? <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold leading-5 text-accent-ink">{g.count > 99 ? "99+" : g.count}</span> : null}
                <CaretDown size={12} weight="bold" className={cn("transition-transform", open === g.id && "rotate-180")} />
                <span aria-hidden className={cn("absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent transition-opacity", groupActive(g) ? "opacity-100" : "opacity-0")} />
              </button>
            </li>
          ))}
          {links.map((l) => (
            <li key={l.href} onMouseEnter={() => hover(null)}>
              <Link href={l.href} aria-current={linkActive(l) ? "page" : undefined} className={cn("relative flex h-11 items-center gap-2 whitespace-nowrap px-3 text-sm font-semibold transition-colors", linkActive(l) ? "text-ink" : "text-muted hover:text-ink")}>
                {l.label}
                {l.count ? <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold leading-5 text-accent-ink">{l.count > 99 ? "99+" : l.count}</span> : null}
                <span aria-hidden className={cn("absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent transition-opacity", linkActive(l) ? "opacity-100" : "opacity-0")} />
              </Link>
            </li>
          ))}
        </ul>
        {current && (
          <div onMouseEnter={() => hover(current.id)} className="page-fade absolute inset-x-0 top-full z-50 hidden md:block">
            <div>
              <div className="rounded-card border border-line bg-surface p-4 shadow-card">
                <ul className={cn("grid gap-1", current.columns === 3 ? "grid-cols-3" : current.columns === 1 ? "grid-cols-1" : "grid-cols-2")}>
                  {current.items.map((it) => <li key={it.href}><Row it={it} onPick={close} /></li>)}
                </ul>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile */}
      <div className="md:hidden">
        <button type="button" aria-label={tx("Meniu", "Menu")} aria-expanded={mobile} onClick={() => setMobile((v) => !v)} className="flex size-11 items-center justify-center">
          {mobile ? <X size={22} /> : <List size={22} />}
        </button>
        {mobile && (
          <nav aria-label={tx("Navigare principală", "Main navigation")} className="page-fade absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-60px)] overflow-y-auto border-b border-line bg-surface px-4 pb-4 pt-2 shadow-card">
            {groups.map((g) => (
              <div key={g.id} className="border-b border-line last:border-0">
                <button type="button" aria-expanded={mobileGroup === g.id} onClick={() => setMobileGroup(mobileGroup === g.id ? null : g.id)} className="flex min-h-12 w-full items-center justify-between text-base font-bold">
                  <span className="flex items-center gap-2">{g.label}<Badge n={g.count} /></span>
                  <CaretDown size={16} weight="bold" className={cn("transition-transform", mobileGroup === g.id && "rotate-180")} />
                </button>
                {mobileGroup === g.id && (
                  <ul className="flex flex-col pb-2">
                    {g.items.map((it) => <li key={it.href}><Row it={it} onPick={close} /></li>)}
                  </ul>
                )}
              </div>
            ))}
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={close} className="flex min-h-12 items-center gap-2 border-b border-line text-base font-bold last:border-0">
                {l.label}
                <Badge n={l.count} />
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
