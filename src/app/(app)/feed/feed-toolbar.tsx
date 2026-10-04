"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { Heart, MagnifyingGlass, SlidersHorizontal, X } from "@phosphor-icons/react";
import { cn } from "@/components/ui";
import { SortSelect, ViewToggle } from "./feed-controls";

type Opt = { value: string; label: string; href: string };
type Chip = { label: string; removeHref: string };

// One compact row: search, "Filtre" toggle with a counter, view switch. Everything else lives in the panel.
export function FeedToolbar(props: {
  q: string;
  placeholder: string;
  submitLabel: string;
  hidden: Record<string, string>;
  types: { value: string; label: string; href: string; active: boolean }[];
  sort: { value: string; options: Opt[] };
  fav: { on: boolean; href: string };
  chips: Chip[];
  clearHref: string;
  view: { current: "lista" | "grila"; listHref: string; gridHref: string };
}) {
  const panelId = useId();
  const count = props.chips.length;
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <form action="/feed" role="search" className="flex min-w-0 flex-1 gap-2">
          {Object.entries(props.hidden).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={props.q} placeholder={props.placeholder} aria-label={props.placeholder} className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-base placeholder:text-muted focus:border-accent focus:outline-none" />
          </div>
          <button type="submit" className="hidden h-12 rounded-full bg-accent px-6 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover active:scale-[0.98] sm:block">{props.submitLabel}</button>
        </form>
        <button
          type="button"
          data-tour="filters"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className={cn("inline-flex h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors", open || count > 0 ? "border-accent text-ink" : "border-line bg-surface text-muted hover:text-ink")}
        >
          <SlidersHorizontal size={18} />
          <span className="hidden sm:inline">Filtre</span>
          {count > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-ink">{count}</span>}
        </button>
        <div className="hidden sm:block">
          <ViewToggle {...props.view} />
        </div>
      </div>

      {open && (
        <div id={panelId} className="page-fade flex flex-col gap-5 rounded-card border border-line bg-surface p-5">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Tip resursă</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Tip resursă">
              {props.types.map((x) => (
                <Link key={x.value} href={x.href} scroll={false} aria-current={x.active ? "true" : undefined} className={cn("inline-flex h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors", x.active ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:text-ink")}>
                  {x.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <SortSelect value={props.sort.value} options={props.sort.options} />
            <Link href={props.fav.href} scroll={false} aria-pressed={props.fav.on} className={cn("inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors", props.fav.on ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:text-ink")}>
              <Heart size={18} weight={props.fav.on ? "fill" : "regular"} /> Doar favorite
            </Link>
            <div className="sm:hidden">
              <ViewToggle {...props.view} />
            </div>
            {count > 0 && (
              <Link href={props.clearHref} className="ml-auto inline-flex h-11 items-center text-sm font-semibold text-accent hover:underline">Șterge filtrele</Link>
            )}
          </div>
        </div>
      )}

      {count > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Filtre active">
          {props.chips.map((c) => (
            <li key={c.label}>
              <Link href={c.removeHref} scroll={false} className="inline-flex h-9 items-center gap-2 rounded-full bg-surface2 pl-3 pr-2 text-sm font-semibold hover:bg-line" aria-label={`Scoate filtrul ${c.label}`}>
                {c.label} <X size={14} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
