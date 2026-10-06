"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, DownloadSimple, MagnifyingGlassPlus, X } from "@phosphor-icons/react";
import { cn } from "@/components/ui";
import { useTx } from "@/components/locale-provider";

export type GalleryPhoto = { id: string; thumb: string; full: string; download?: string; width: number; height: number; caption: string };

export function PhotoGallery({ photos, title }: { photos: GalleryPhoto[]; title: string }) {
  const tx = useTx();
  const [open, setOpen] = useState<number | null>(null);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const n = photos.length;

  const go = useCallback((d: number) => {
    setZoom(null);
    setOpen((i) => (i === null ? i : (i + d + n) % n));
  }, [n]);
  const close = useCallback(() => {
    setOpen(null);
    setZoom(null);
    opener.current?.focus();
  }, []);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go, close]);

  // Keep the active thumbnail visible in the strip and warm the neighbours.
  useEffect(() => {
    if (open === null) return;
    document.getElementById(`ph-strip-${open}`)?.scrollIntoView({ block: "nearest", inline: "center" });
    [open - 1, open + 1].forEach((j) => {
      const p = photos[(j + n) % n];
      if (p) new Image().src = p.full;
    });
  }, [open, photos, n]);

  const cur = open === null ? null : photos[open];
  const toggleZoom = (e: React.MouseEvent<HTMLElement>) => {
    if (zoom) return setZoom(null);
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <>
      <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={(e) => { opener.current = e.currentTarget; setOpen(i); }}
              aria-label={`${tx("Deschide poza", "Open photo")} ${i + 1} ${tx("din", "of")} ${n}`}
              className="group relative block aspect-square w-full overflow-hidden rounded-control bg-surface2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URLs */}
              <img src={p.thumb} alt={p.caption || `${title} ${i + 1}`} loading={i < 6 ? "eager" : "lazy"} decoding="async" width={480} height={480} className="size-full object-cover transition duration-300 group-hover:scale-[1.03]" />
            </button>
          </li>
        ))}
      </ul>

      {cur && open !== null && (
        <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm font-semibold tabular-nums">{open + 1} / {n}</span>
            <div className="flex items-center gap-1">
              {cur.download && (
                <a href={cur.download} className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold hover:bg-white/10">
                  <DownloadSimple size={20} /> <span className="hidden sm:inline">{tx("Descarcă", "Download")}</span>
                </a>
              )}
              <button type="button" onClick={toggleZoom} aria-label={tx("Mărește", "Zoom")} className="hidden min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-white/10 sm:inline-flex"><MagnifyingGlassPlus size={22} /></button>
              <button ref={closeRef} type="button" onClick={close} aria-label={tx("Închide", "Close")} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-white/10"><X size={24} /></button>
            </div>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
            onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
            onTouchEnd={(e) => {
              const s = touch.current;
              touch.current = null;
              if (!s || zoom) return;
              const dx = e.changedTouches[0].clientX - s.x;
              const dy = e.changedTouches[0].clientY - s.y;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
            }}
          >
            {n > 1 && <button type="button" onClick={() => go(-1)} aria-label={tx("Poza anterioară", "Previous photo")} className="absolute left-2 z-10 hidden size-12 items-center justify-center rounded-full bg-black/50 backdrop-blur hover:bg-black/70 sm:inline-flex"><ArrowLeft size={22} /></button>}
            {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URLs */}
            <img
              key={cur.id}
              src={cur.full}
              alt={cur.caption || `${title} ${open + 1}`}
              width={cur.width}
              height={cur.height}
              onDoubleClick={toggleZoom}
              onClick={zoom ? toggleZoom : undefined}
              draggable={false}
              style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              className={cn("max-h-full max-w-full select-none object-contain transition-transform duration-200", zoom ? "scale-[2.2] cursor-zoom-out" : "cursor-zoom-in")}
            />
            {n > 1 && <button type="button" onClick={() => go(1)} aria-label={tx("Poza următoare", "Next photo")} className="absolute right-2 z-10 hidden size-12 items-center justify-center rounded-full bg-black/50 backdrop-blur hover:bg-black/70 sm:inline-flex"><ArrowRight size={22} /></button>}
          </div>

          {cur.caption && <p className="mx-auto max-w-[70ch] px-5 pt-3 text-center text-sm leading-relaxed text-white/90 [overflow-wrap:anywhere]">{cur.caption}</p>}

          {n > 1 && (
            <div className="flex gap-1.5 overflow-x-auto px-3 py-3">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  id={`ph-strip-${i}`}
                  type="button"
                  onClick={() => { setZoom(null); setOpen(i); }}
                  aria-label={`${tx("Poza", "Photo")} ${i + 1}`}
                  aria-current={i === open}
                  className={cn("size-14 shrink-0 overflow-hidden rounded-control border-2 transition sm:size-16", i === open ? "border-white" : "border-transparent opacity-60 hover:opacity-100")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URLs */}
                  <img src={p.thumb} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
