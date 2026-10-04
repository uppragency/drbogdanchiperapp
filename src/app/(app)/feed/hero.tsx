"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, type PanInfo } from "motion/react";
import { ArrowRight, CaretLeft, CaretRight, Megaphone, PlayCircle } from "@phosphor-icons/react";
import { Cover, type ResourceType } from "@/components/cover";
import { t } from "@/lib/texts";

export type HeroCard = { id: string; title: string; category: string; type: ResourceType; date: string; covers: string[] };
type Props = {
  name: string;
  greeting: string;
  groups: string[];
  newCount: number;
  cards: HeroCard[];
  resume: { id: string; title: string; category: string } | null;
  announcements: { id: string; title: string }[];
};

const spring = { type: "spring", stiffness: 320, damping: 30 } as const;

export function Hero({ name, greeting, groups, newCount, cards, resume, announcements }: Props) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(720);
  const my = useMotionValue(180);
  const glow = useMotionTemplate`radial-gradient(520px circle at ${mx}px ${my}px, rgba(145,85,246,0.16), transparent 65%)`;
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
      className="relative isolate overflow-hidden border-b border-line bg-gradient-to-b from-white to-[#eef0fb] text-[#0d1c5c] dark:border-transparent dark:from-[#060a1f] dark:to-[#060a1f] dark:text-white"
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
    >
      <motion.div aria-hidden className="absolute inset-0 -z-10" style={{ background: glow }} />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(#0d1c5c_1px,transparent_1px),linear-gradient(90deg,#0d1c5c_1px,transparent_1px)] dark:opacity-[0.07] dark:[background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="mx-auto grid min-h-[520px] w-full max-w-6xl items-center gap-8 px-4 pb-[88px] pt-10 md:grid-cols-[1.6fr_1fr] md:gap-10">
        <div className="flex min-w-0 flex-col gap-5">
          <h1 className="text-[26px] font-bold leading-[1.1] tracking-tight sm:text-4xl md:whitespace-nowrap md:text-[clamp(32px,4.4vw,50px)]">
            {name ? `${greeting}, ${name}` : "Bine ai venit"}
          </h1>
          <p className="text-lg text-[#0d1c5c]/75 dark:text-white/75">
            {newCount > 0 ? (
              <>
                Ai <span ref={counter} className="font-bold text-[#0d1c5c] dark:text-white">{newCount}</span> {newCount === 1 ? "resursă nouă" : t.home.newCount} pentru tine.
              </>
            ) : (
              t.home.noNew
            )}
          </p>
          {groups.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label={t.home.yourGroups}>
              {groups.map((g) => (
                <li key={g} className="rounded-full border border-[#0d1c5c]/20 px-3 py-1 text-xs font-semibold dark:border-white/25">{g}</li>
              ))}
            </ul>
          )}
          {resume && (
            <Link href={`/resurse/${resume.id}`} className="group flex w-full max-w-md items-center gap-4 rounded-control border border-line bg-white p-4 shadow-card transition-colors hover:bg-[#f6f7fd] dark:border-white/20 dark:bg-[#0f1a52] dark:shadow-none dark:hover:bg-[#16226a]">
              <PlayCircle size={36} weight="fill" className="shrink-0 text-[#9155f6] dark:text-[#b896ff]" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#0d1c5c]/70 dark:text-white/75">{t.home.continue}</span>
                <span className="block truncate text-base font-semibold">{resume.title}</span>
              </span>
              <ArrowRight size={20} className="shrink-0 transition group-hover:translate-x-1" />
            </Link>
          )}
        </div>
        <Deck cards={cards} reduce={Boolean(reduce)} />
      </div>

      <Ticker items={announcements} />
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
    return <div className="hidden rounded-3xl border border-dashed border-line p-10 text-center text-muted dark:border-white/20 dark:text-white/75 md:block">{t.home.noNew}</div>;
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
                className="group block overflow-hidden rounded-3xl bg-white text-[#0d1c5c] shadow-[0_30px_60px_-20px_rgba(13,28,92,0.35)] ring-1 ring-black/5"
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
          <button type="button" onClick={() => rotate(-1)} aria-label="Anterioara" className="flex size-11 items-center justify-center rounded-full border border-line transition-colors hover:bg-white dark:border-white/20 dark:hover:bg-white/15"><CaretLeft size={18} /></button>
          <span className="min-w-12 text-center text-sm text-[#0d1c5c]/80 dark:text-white/80" aria-live="polite">{cards.findIndex((c) => c.id === order[0]) + 1} / {cards.length}</span>
          <button type="button" onClick={() => rotate(1)} aria-label="Următoarea" className="flex size-11 items-center justify-center rounded-full border border-line transition-colors hover:bg-white dark:border-white/20 dark:hover:bg-white/15"><CaretRight size={18} /></button>
        </div>
      )}
    </div>
  );
}

function Ticker({ items }: { items: { id: string; title: string }[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % items.length), 5000);
    return () => window.clearInterval(id);
  }, [items.length]);
  const item = items[i];
  return (
    <div className="absolute inset-x-0 bottom-0 border-t border-line bg-white dark:border-white/10 dark:bg-[#050818]">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
        <Megaphone size={20} className="shrink-0 text-[#9155f6] dark:text-[#b896ff]" />
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-[#0d1c5c]/70 dark:text-white/75">{t.home.announcements}</span>
        <div className="relative h-6 min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {item ? (
              <motion.div key={item.id} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0">
                <Link href={`/resurse/${item.id}`} className="block truncate text-sm font-semibold hover:underline">{item.title}</Link>
              </motion.div>
            ) : (
              <motion.span key="none" className="absolute inset-0 text-sm text-muted">Niciun anunț nou.</motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
