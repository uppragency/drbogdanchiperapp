"use client";
import { useSyncExternalStore } from "react";
import { Megaphone, X } from "@phosphor-icons/react";

export type BannerData = { id: string; message: string; linkUrl: string | null; linkLabel: string };

const EVENT = "banner-dismissed";
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};

// Closing is remembered in this browser per banner id, so it stays closed until a new banner is published.
export function SiteBanner({ banner }: { banner: BannerData }) {
  const key = `banner:${banner.id}`;
  const hidden = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );
  if (hidden) return null;
  return (
    <div role="status" className="border-b border-line bg-violet-soft">
      <div className="mx-auto flex min-h-9 w-full max-w-6xl items-center gap-2 px-4 py-0.5">
        <Megaphone size={18} className="shrink-0 text-violet" />
        <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug">
          {banner.message}
          {banner.linkUrl && (
            <>
              {" "}
              <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-accent">{banner.linkLabel || "Vezi detalii"}</a>
            </>
          )}
        </p>
        <button
          type="button"
          aria-label="Închide"
          onClick={() => {
            try {
              window.localStorage.setItem(key, "1");
            } catch {}
            window.dispatchEvent(new Event(EVENT));
          }}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
