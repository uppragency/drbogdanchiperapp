"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, type PanInfo } from "motion/react";
import { ArrowRight, CaretLeft, CaretRight, PlayCircle } from "@phosphor-icons/react";
import { Cover, type ResourceType } from "@/components/cover";
import { t } from "@/lib/texts";

export type HeroCard = { id: string; title: string; category: string; type: ResourceType; date: string; covers: string[] };
type Props = {
  name: string;
  groups: string[];
  newCount: number;
  cards: HeroCard[];
  resume: { id: string; title: string; category: string } | null;
};

const spring = { type: "spring", stiffness: 320, damping: 30 } as const;

export function Hero({ name, groups, newCount, cards, resume }: Props) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(720);
  const my = useMotionValue(180);
  const glow = useMotionTemplate`radial-gradient(520px circle at ${mx}px ${my}px, rgba(145,85,246,0.30), transparent 65%)`;
  const counter = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!counter.current) return;
    if (reduce) {
      counter.current.textContent = String(newCount);
      return;
    }
    const c = animate(0, newCount, { duration: 1.1, ease: "easeOut", onUpdate: (v) => counter.current && (counter.current.textContent = String(Math.round(v))) });
    return () => c.stop();
  }, [newCount, reduce]);

  return (
    <section
      className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#313885] to-[#0d1c5c] text-white dark:from-[#1b2163] dark:to-[#060a1f]"
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
    >
      <motion.div aria-hidden className="absolute inset-0 -z-10" style={{ background: glow }} />

      <div className="grid min-h-[520px] items-center gap-8 px-6 py-10 md:grid-cols-[1.05fr_1fr] md:gap-10 md:px-12">
        <div className="flex min-w-0 flex-col gap-5">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
            {name ? `${t.home.greeting}, ${name}` : "Bine ai venit"}
          </h1>
          <p className="text-lg text-white/80">
            {newCount > 0 ? (
              <>
                Ai <span ref={counter} className="font-bold text-white">{newCount}</span> {t.home.newCount} pentru tine.
              </>
            ) : (
              t.home.noNew
            )}
          </p>
          {groups.length > 0 && <p className="text-sm text-white/75" aria-label={t.home.yourGroups}>{groups.join(" · ")}</p>}
          <div className="mt-2">
            {resume ? (
              <Link href={`/resurse/${resume.id}`} className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#0d1c5c] transition-colors hover:bg-[#e8e9f7] active:scale-[0.98]">
                <PlayCircle size={20} weight="fill" /> {t.home.continue} <ArrowRight size={16} weight="bold" />
              </Link>
            ) : cards[0] ? (
              <Link href={`/resurse/${cards[0].id}`} className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#0d1c5c] transition-colors hover:bg-[#e8e9f7] active:scale-[0.98]">
                Vezi cea mai nouă resursă <ArrowRight size={16} weight="bold" />
              </Link>
            ) : null}
          </div>
        </div>
        <Deck cards={cards} reduce={Boolean(reduce)} />
      </div>
    </section>
  );
}

function Deck({ cards, reduce }: { cards: HeroCard[]; reduce: boolean }) {
  const [order, setOrder] = useState(() => cards.map((c) => c.id));
  const dragged = useRef(false);
  const byId = new Map(cards.map((c) => [c.id, c]));
  const rotate = (dir: 1 | -1) =>
    setOrder((o) => (dir === 1 ? [...o.slice(1), o[0]] : [o[o.length - 1], ...o.slice(0, -1)]));

  if (cards.length === 0) {
    return <div className="hidden rounded-3xl border border-dashed border-white/20 p-10 text-center text-white/75 md:block">{t.home.noNew}</div>;
  }

  const onDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 500) {
      rotate(info.offset.x < 0 ? 1 : -1);
    }
    window.setTimeout(() => (dragged.current = false), 0);
  };

  return (
    <div className="flex min-w-0 flex-col items-center gap-4 md:items-end">
      <div className="relative h-[300px] w-full max-w-[380px]" role="group" aria-roledescription="carusel" aria-label={t.home.newForYou}>
        {order.slice(0, 3).map((id, i) => {
          const c = byId.get(id)!;
          const top = i === 0;
          return (
            <motion.div
              key={id}
              layout={!reduce}
              initial={false}
              animate={{ scale: 1 - i * 0.05, y: i * 16, filter: `brightness(${1 - i * 0.22})` }}
              transition={reduce ? { duration: 0 } : spring}
              style={{ zIndex: 10 - i, transformOrigin: "bottom center" }}
              drag={top && !reduce ? "x" : false}
              dragSnapToOrigin
              dragElastic={0.5}
              onDragStart={() => (dragged.current = true)}
              onDragEnd={onDragEnd}
              whileHover={top && !reduce ? { rotate: -1.2 } : undefined}
              className="absolute inset-x-0 top-0 touch-pan-y"
            >
              <Link
                href={`/resurse/${c.id}`}
                tabIndex={top ? 0 : -1}
                onClickCapture={(e) => dragged.current && e.preventDefault()}
                draggable={false}
                className="group block overflow-hidden rounded-3xl bg-white text-[#0d1c5c] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)]"
              >
                <Cover covers={c.covers} type={c.type} label={c.category} play={c.type === "video"} ratio="aspect-[5/2]" />
                <div className="flex flex-col gap-1 p-5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#9155f6]">{c.category} · {c.date}</span>
                  <span className="line-clamp-2 text-lg font-bold leading-snug">{c.title}</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
      {cards.length > 1 && (
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => rotate(-1)} aria-label="Anterioara" className="flex size-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:bg-white/15"><CaretLeft size={18} /></button>
          <span className="min-w-12 text-center text-sm text-white/80" aria-live="polite">{cards.findIndex((c) => c.id === order[0]) + 1} / {cards.length}</span>
          <button type="button" onClick={() => rotate(1)} aria-label="Următoarea" className="flex size-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:bg-white/15"><CaretRight size={18} /></button>
        </div>
      )}
    </div>
  );
}
