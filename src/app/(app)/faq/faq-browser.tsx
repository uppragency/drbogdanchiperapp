"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { ArrowRight, CaretDown, MagnifyingGlass, ThumbsDown, ThumbsUp, X } from "@phosphor-icons/react";
import { Highlight } from "@/components/highlight";
import { Badge, cn } from "@/components/ui";
import { useTx } from "@/components/locale-provider";
import { rateFaq, searchQa } from "./actions";

export type FaqEntry = { id: string; category: string; featured: boolean; isNew: boolean; vote: boolean | null; question: string; answer: string; linkHref: string | null; linkLabel: string | null };

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const CATS: [string, string, string][] = [
  ["cont", "Cont și autentificare", "Account and sign-in"],
  ["platforma", "Folosirea platformei", "Using the platform"],
  ["resurse", "Resurse și video", "Resources and video"],
  ["comunitate", "Comunitate", "Community"],
  ["notificari", "Notificări și aplicație", "Notifications and app"],
  ["date", "Securitate și date personale", "Security and personal data"],
];

function Helpful({ id, initial }: { id: string; initial: boolean | null }) {
  const tx = useTx();
  const [vote, setVote] = useState(initial);
  const [, start] = useTransition();
  const send = (v: boolean) => {
    setVote(v);
    start(async () => { await rateFaq(id, v); });
  };
  const btn = (active: boolean) => cn("inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors", active ? "border-accent bg-accent text-accent-ink" : "border-line hover:bg-surface2");
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
      <span className="text-sm text-muted">{tx("Ți-a fost de folos?", "Was this helpful?")}</span>
      <button type="button" aria-pressed={vote === true} onClick={() => send(true)} className={btn(vote === true)}><ThumbsUp size={16} aria-hidden />{tx("Da", "Yes")}</button>
      <button type="button" aria-pressed={vote === false} onClick={() => send(false)} className={btn(vote === false)}><ThumbsDown size={16} aria-hidden />{tx("Nu", "No")}</button>
      {vote === true && <span role="status" className="text-sm text-muted">{tx("Mulțumim!", "Thank you!")}</span>}
      {vote === false && (
        <span role="status" className="text-sm text-muted">
          {tx("Ne pare rău.", "Sorry about that.")} <Link href="/contact" className="font-semibold text-accent hover:underline">{tx("Scrie-ne", "Contact us")}</Link>
        </span>
      )}
    </div>
  );
}

export function FaqBrowser({ items, sidebar }: { items: FaqEntry[]; sidebar: ReactNode }) {
  const tx = useTx();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const [qa, setQa] = useState<{ q: string; hits: { id: string; title: string }[] } | null>(null);

  // A link like /faq#<id> opens that question.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id || !items.some((i) => i.id === id)) return;
    const t = setTimeout(() => {
      setOpen(id);
      document.getElementById(id)?.scrollIntoView({ block: "center" });
    }, 0);
    return () => clearTimeout(t);
  }, [items]);

  const needle = strip(q.trim());
  const searching = needle.length >= 2;
  const counts = useMemo(() => Object.fromEntries(CATS.map(([k]) => [k, items.filter((i) => i.category === k).length])), [items]);
  const matches = items.filter((i) => (cat === "all" || i.category === cat) && (!searching || strip(i.question + " " + i.answer).includes(needle)));
  const groups = CATS.map(([k, ro, en]) => ({ k, label: tx(ro, en), list: matches.filter((i) => i.category === k) })).filter((g) => g.list.length > 0);
  const featured = !searching && cat === "all" ? items.filter((i) => i.featured) : [];
  const noResults = matches.length === 0;

  // When nothing matches, look for posts in "Întrebări și răspunsuri" that do.
  useEffect(() => {
    if (!noResults || !searching) return;
    const term = q.trim();
    let alive = true;
    const t = setTimeout(async () => {
      const hits = await searchQa(term);
      if (alive) setQa({ q: term, hits });
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [noResults, searching, q]);
  const qaHits = noResults && qa && qa.q === q.trim() ? qa.hits : [];

  const toggle = (id: string) => {
    setOpen((cur) => (cur === id ? null : id));
    history.replaceState(null, "", open === id ? window.location.pathname : `#${id}`);
  };

  const row = (f: FaqEntry) => {
    const isOpen = open === f.id;
    return (
      <li key={f.id} id={f.id} className="scroll-mt-32">
        <button type="button" aria-expanded={isOpen} onClick={() => toggle(f.id)} className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-3 text-left font-bold">
          <span className="flex flex-wrap items-center gap-2">
            <span><Highlight text={f.question} q={q} /></span>
            {f.isNew && <Badge tone="accent">{tx("Nou", "New")}</Badge>}
          </span>
          <CaretDown size={18} className={cn("shrink-0 transition-transform", isOpen && "rotate-180")} />
        </button>
        {isOpen && (
          <div className="flex flex-col gap-4 px-5 pb-5">
            <p className="max-w-[65ch] whitespace-pre-line leading-relaxed text-muted"><Highlight text={f.answer} q={q} /></p>
            {f.linkHref && f.linkLabel && (
              <Link href={f.linkHref} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold transition-colors hover:bg-surface2">
                {f.linkLabel} <ArrowRight size={16} weight="bold" />
              </Link>
            )}
            <Helpful id={f.id} initial={f.vote} />
          </div>
        )}
      </li>
    );
  };

  const chip = (active: boolean) => cn("inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors", active ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:bg-surface2 hover:text-ink");
  const allCats: [string, string, string][] = [["all", "Toate", "All"], ...CATS];
  const countOf = (k: string) => (k === "all" ? items.length : counts[k]);

  return (
    <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)_300px]">
      <nav aria-label={tx("Categorii", "Categories")} className="hidden lg:block">
        <ul className="sticky top-24 flex flex-col gap-1">
          {allCats.map(([k, ro, en]) => (
            <li key={k}>
              <button type="button" aria-current={cat === k ? "true" : undefined} onClick={() => setCat(k)} className={cn("flex min-h-11 w-full items-center justify-between gap-2 rounded-control px-3 text-left text-sm font-semibold transition-colors", cat === k ? "bg-surface2 text-ink" : "text-muted hover:bg-surface2 hover:text-ink")}>
                <span>{tx(ro, en)}</span>
                <span className="text-xs text-muted">{countOf(k)}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex min-w-0 flex-col gap-6">
        <div className="under-header -mx-4 flex flex-col gap-2 bg-bg/95 px-4 py-2 backdrop-blur">
          <div className="relative">
            <MagnifyingGlass size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tx("Caută în întrebări frecvente", "Search the FAQ")}
              aria-label={tx("Caută în întrebări frecvente", "Search the FAQ")}
              className="h-12 w-full rounded-control border border-line bg-bg pl-12 pr-12 text-base text-ink focus:border-accent focus:outline-none"
            />
            {q && (
              <button type="button" aria-label={tx("Șterge căutarea", "Clear search")} onClick={() => setQ("")} className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-muted hover:text-ink">
                <X size={18} />
              </button>
            )}
          </div>
          <div role="group" aria-label={tx("Categorii", "Categories")} className="no-scrollbar flex gap-2 overflow-x-auto lg:hidden">
            {allCats.map(([k, ro, en]) => (
              <button key={k} type="button" aria-pressed={cat === k} onClick={() => setCat(k)} className={chip(cat === k)}>
                {tx(ro, en)}
                <span className={cn("text-xs", cat === k ? "opacity-80" : "text-muted")}>{countOf(k)}</span>
              </button>
            ))}
          </div>
        </div>

        {featured.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{tx("Cele mai căutate", "Most searched")}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {featured.map((f) => (
                <li key={f.id}>
                  <button type="button" onClick={() => { setOpen(f.id); setCat(f.category); requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(f.id)?.scrollIntoView({ block: "center", behavior: "smooth" }))); history.replaceState(null, "", `#${f.id}`); }} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-control border border-line bg-surface px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-surface2">
                    {f.question}
                    <ArrowRight size={16} weight="bold" className="shrink-0 text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {groups.map((g) => (
          <section key={g.k} aria-labelledby={`h-${g.k}`} className="flex flex-col gap-3">
            <h2 id={`h-${g.k}`} className="text-sm font-bold uppercase tracking-wider text-muted">{g.label}</h2>
            <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">{g.list.map(row)}</ul>
          </section>
        ))}

        {noResults && (
          <div className="flex flex-col items-start gap-3 rounded-card border border-line bg-surface p-6">
            <p className="font-bold">{tx("Nu am găsit un răspuns pentru această căutare.", "We could not find an answer for this search.")}</p>
            {qaHits.length > 0 && (
              <div className="flex w-full flex-col gap-1">
                <p className="text-sm text-muted">{tx("Poate te ajută aceste postări din Întrebări și răspunsuri:", "These posts from Questions and answers may help:")}</p>
                <ul className="flex flex-col">
                  {qaHits.map((h) => (
                    <li key={h.id}><Link href={`/resurse/${h.id}`} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-accent hover:underline">{h.title} <ArrowRight size={14} weight="bold" /></Link></li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-muted">{tx("Încearcă alt cuvânt, întreabă comunitatea sau scrie-ne direct.", "Try another word, ask the community or write to us directly.")}</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/feed?categorie=intrebari-si-raspunsuri" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold transition-colors hover:bg-surface2">
                {tx("Întreabă comunitatea", "Ask the community")}
              </Link>
              <Link href="/contact" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover">
                {tx("Scrie-ne", "Contact us")} <ArrowRight size={16} weight="bold" />
              </Link>
            </div>
          </div>
        )}
      </div>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">{sidebar}</aside>
    </div>
  );
}
