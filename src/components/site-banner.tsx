"use client";
import { useState } from "react";
import { Megaphone, X } from "@phosphor-icons/react";

export type BannerData = { id: string; message: string; linkUrl: string | null; linkLabel: string };

// Dismissal is remembered for the browser session only, so a new banner always shows.
export function SiteBanner({ banner }: { banner: BannerData }) {
  const key = `banner:${banner.id}`;
  const [hidden, setHidden] = useState(() => {
    try {
      return typeof window !== "undefined" && window.sessionStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });
  if (hidden) return null;
  return (
    <div role="status" className="border-b border-line bg-violet-soft">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2">
        <Megaphone size={20} className="shrink-0 text-violet" />
        <p className="min-w-0 flex-1 text-sm font-semibold">
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
            setHidden(true);
            try {
              window.sessionStorage.setItem(key, "1");
            } catch {}
          }}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
