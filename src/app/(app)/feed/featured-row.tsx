"use client";
import Link from "next/link";
import { useRef } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Cover, type ResourceType } from "@/components/cover";
import { useTx } from "@/components/locale-provider";

export type FeaturedCard = { id: string; title: string; description: string; category: string; type: ResourceType; covers: string[] };

export function FeaturedRow({ cards }: { cards: FeaturedCard[] }) {
  const tx = useTx();
  const scroller = useRef<HTMLUListElement>(null);
  const move = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 280), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return (
    <section aria-labelledby="recomandate" className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="recomandate" className="text-2xl font-bold tracking-tight">{tx("Videoclipuri populare", "Popular videos")}</h2>
          <p className="text-sm text-muted">{tx("Cele mai urmărite videoclipuri, actualizate automat.", "The most watched videos, updated automatically.")}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => move(-1)} aria-label={tx("Înapoi", "Back")} className="flex size-11 items-center justify-center rounded-full border border-line bg-surface transition-colors hover:bg-surface2"><CaretLeft size={18} /></button>
          <button type="button" onClick={() => move(1)} aria-label={tx("Înainte", "Forward")} className="flex size-11 items-center justify-center rounded-full border border-line bg-surface transition-colors hover:bg-surface2"><CaretRight size={18} /></button>
        </div>
      </div>
      <ul ref={scroller} className="-mx-4 flex snap-x snap-mandatory gap-4 no-scrollbar overflow-x-auto px-4 pb-2">
        {cards.map((c) => (
          <li key={c.id} className="flex w-[78%] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)]">
            <Link href={`/resurse/${c.id}`} className="group card-lift flex w-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
              <Cover covers={c.covers} type={c.type} label={c.category} play />
              <span className="flex flex-1 flex-col gap-2 p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">{c.category}</span>
                <span className="line-clamp-2 min-h-[3rem] text-lg font-bold leading-snug">{c.title}</span>
                <span className="line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-muted">{c.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
