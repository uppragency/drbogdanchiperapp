"use client";
import { useCallback, useEffect, useState } from "react";
import { completeTour } from "@/app/(app)/profil/actions";
import { useTx } from "@/components/locale-provider";

const TARGETS = ["search", "bell", "menu", "filters"] as const;
type Target = (typeof TARGETS)[number];

type Box = { top: number; left: number; width: number; height: number };

// First visit only. Steps whose target is not on screen (for example filters outside the feed) are skipped.
export function GuidedTour() {
  const [open, setOpen] = useState(true);
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [steps, setSteps] = useState<Target[]>([]);
  const tx = useTx();
  const copy: Record<Target, { title: string; text: string }> = {
    search: { title: tx("Căutare", "Search"), text: tx("Caută în toate resursele, din orice pagină.", "Search all resources from any page.") },
    bell: { title: tx("Notificări", "Notifications"), text: tx("Aici vezi răspunsurile la comentariile tale și resursele noi.", "Here you see replies to your comments and new resources.") },
    menu: { title: tx("Contul tău", "Your account"), text: tx("Profil, resurse văzute recent, tema luminoasă sau întunecată și deconectarea.", "Profile, recently viewed resources, light or dark theme and sign out.") },
    filters: { title: tx("Filtre", "Filters"), text: tx("Restrânge lista după tip, categorie sau favorite.", "Narrow the list by type, category or favorites.") },
  };

  const find = (target: Target) => {
    const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? { el, r } : null;
  };

  useEffect(() => {
    const t = window.setTimeout(() => setSteps(TARGETS.filter((s) => find(s))), 600);
    return () => window.clearTimeout(t);
  }, []);

  const place = useCallback(() => {
    const s = steps[index];
    if (!s) return;
    const f = find(s);
    if (!f) return setBox(null);
    f.el.scrollIntoView({ block: "nearest" });
    const r = f.el.getBoundingClientRect();
    setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [steps, index]);

  useEffect(() => {
    const raf = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
    };
  }, [place]);

  const finish = useCallback(() => {
    setOpen(false);
    void completeTour();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish]);

  const stepTarget = steps[index];
  const step = stepTarget ? copy[stepTarget] : undefined;
  if (!open || !step || !box) return null;
  const last = index === steps.length - 1;
  const width = Math.min(300, window.innerWidth - 24);
  const left = Math.max(12, Math.min(box.left + box.width / 2 - width / 2, window.innerWidth - width - 12));
  const top = box.top + box.height + 14;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-label={tx("Tur ghidat", "Guided tour")}>
      <div aria-hidden className="pointer-events-none fixed rounded-full ring-2 ring-white transition-all duration-200" style={{ top: box.top - 6, left: box.left - 6, width: box.width + 12, height: box.height + 12, boxShadow: "0 0 0 9999px rgba(6,10,31,0.62)" }} />
      <div className="absolute rounded-card border border-line bg-surface p-5 text-ink shadow-card" style={{ top, left, width }}>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{tx(`Pasul ${index + 1} din ${steps.length}`, `Step ${index + 1} of ${steps.length}`)}</p>
        <p className="mt-1 text-base font-bold">{step.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button type="button" onClick={finish} className="min-h-11 px-1 text-sm font-semibold text-muted hover:text-ink">{tx("Sari peste", "Skip")}</button>
          <button type="button" onClick={() => (last ? finish() : setIndex(index + 1))} className="inline-flex h-11 items-center rounded-control bg-accent px-5 text-sm font-semibold text-accent-ink hover:bg-accent-hover">{last ? tx("Gata", "Done") : tx("Înainte", "Next")}</button>
        </div>
      </div>
    </div>
  );
}
