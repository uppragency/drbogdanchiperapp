"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CaretDown, MagnifyingGlass, X } from "@phosphor-icons/react";
import { Highlight } from "@/components/highlight";
import { cn } from "@/components/ui";
import { useTx } from "@/components/locale-provider";

export type FaqEntry = { id: string; category: string; featured: boolean; question: string; answer: string; linkHref: string | null; linkLabel: string | null };

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function FaqBrowser({ items }: { items: FaqEntry[] }) {
  const tx = useTx();
  const CATS: [string, string, string][] = [
    ["cont", "Cont și autentificare", "Account and sign-in"],
    ["platforma", "Folosirea platformei", "Using the platform"],
    ["resurse", "Resurse și video", "Resources and video"],
    ["comunitate", "Comunitate", "Community"],
    ["notificari", "Notificări și aplicație", "Notifications and app"],
    ["date", "Securitate și date personale", "Security and personal data"],
  ];
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState<string | null>(null);

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
  const counts = useMemo(() => Object.fromEntries(CATS.map(([k]) => [k, items.filter((i) => i.category === k).length])), [items]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = items.filter((i) => (cat === "all" || i.category === cat) && (!searching || strip(i.question + " " + i.answer).includes(needle)));
  const featured = !searching && cat === "all" ? items.filter((i) => i.featured) : [];

  const toggle = (id: string) => {
    setOpen((cur) => (cur === id ? null : id));
    history.replaceState(null, "", open === id ? window.location.pathname : `#${id}`);
  };

  const row = (f: FaqEntry, keyPrefix = "") => {
    const isOpen = open === f.id;
    return (
      <li key={keyPrefix + f.id} id={keyPrefix ? undefined : f.id} className="scroll-mt-24">
        <button type="button" aria-expanded={isOpen} onClick={() => toggle(f.id)} className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-3 text-left font-bold">
          <span><Highlight text={f.question} q={q} /></span>
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
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-6">
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

      <div role="group" aria-label={tx("Categorii", "Categories")} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        {[["all", "Toate", "All"], ...CATS].map(([k, ro, en]) => (
          <button
            key={k}
            type="button"
            aria-pressed={cat === k}
            onClick={() => setCat(k)}
            className={cn("inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors", cat === k ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:bg-surface2 hover:text-ink")}
          >
            {tx(ro, en)}
            <span className={cn("text-xs", cat === k ? "opacity-80" : "text-muted")}>{k === "all" ? items.length : counts[k]}</span>
          </button>
        ))}
      </div>

      {featured.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{tx("Cele mai căutate", "Most searched")}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {featured.map((f) => (
              <li key={f.id}>
                <button type="button" onClick={() => { setOpen(f.id); setCat(f.category); requestAnimationFrame(() => document.getElementById(f.id)?.scrollIntoView({ block: "center", behavior: "smooth" })); history.replaceState(null, "", `#${f.id}`); }} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-control border border-line bg-surface px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-surface2">
                  {f.question}
                  <ArrowRight size={16} weight="bold" className="shrink-0 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {shown.length > 0 ? (
        <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">{shown.map((f) => row(f))}</ul>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-card border border-line bg-surface p-6">
          <p className="font-bold">{tx("Nu am găsit un răspuns pentru această căutare.", "We could not find an answer for this search.")}</p>
          <p className="text-sm text-muted">{tx("Încearcă alt cuvânt sau scrie-ne direct.", "Try another word or write to us directly.")}</p>
          <Link href="/contact" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover">
            {tx("Nu ai găsit răspunsul? Scrie-ne", "Didn't find the answer? Contact us")} <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      )}
      {shown.length > 0 && (
        <p className="text-sm text-muted">
          {tx("Nu ai găsit răspunsul?", "Didn't find the answer?")}{" "}
          <Link href="/contact" className="font-semibold text-accent hover:underline">{tx("Scrie-ne", "Contact us")}</Link>
        </p>
      )}
    </div>
  );
}
