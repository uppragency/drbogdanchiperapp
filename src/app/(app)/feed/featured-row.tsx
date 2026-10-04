"use client";
import Link from "next/link";
import { useRef } from "react";
import { CaretLeft, CaretRight, Play } from "@phosphor-icons/react";
import { Cover, type ResourceType } from "@/components/cover";

export type FeaturedCard = { id: string; title: string; description: string; category: string; type: ResourceType; covers: string[] };

export function FeaturedRow({ cards }: { cards: FeaturedCard[] }) {
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
          <h2 id="recomandate" className="text-2xl font-bold tracking-tight">Videoclipuri populare</h2>
          <p className="text-sm text-muted">Cele mai urmărite videoclipuri, actualizate automat.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => move(-1)} aria-label="Înapoi" className="flex size-11 items-center justify-center rounded-full border border-line bg-surface transition-colors hover:bg-surface2"><CaretLeft size={18} /></button>
          <button type="button" onClick={() => move(1)} aria-label="Înainte" className="flex size-11 items-center justify-center rounded-full border border-line bg-surface transition-colors hover:bg-surface2"><CaretRight size={18} /></button>
        </div>
      </div>
      <ul ref={scroller} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cards.map((c) => (
          <li key={c.id} className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)]">
            <Link href={`/resurse/${c.id}`} className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-card text-white shadow-card card-lift sm:aspect-[5/6]">
              <Cover covers={c.covers} type={c.type} label={c.category} ratio="h-full" className="absolute inset-0" />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/5" />
              <span className="relative flex flex-col gap-2 p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/80">{c.category}</span>
                <span className="line-clamp-2 text-xl font-bold leading-snug">{c.title}</span>
                {c.description && <span className="line-clamp-2 text-sm leading-relaxed text-white/80">{c.description}</span>}
                <span className="mt-2 flex size-11 items-center justify-center rounded-full bg-white text-[#0d1c5c] transition-transform group-hover:scale-110"><Play size={20} weight="fill" /></span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
