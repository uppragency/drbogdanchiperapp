"use client";
import Link from "next/link";
import { useState } from "react";
import { FilePdf, Link as LinkIcon, TextAlignLeft, VideoCamera } from "@phosphor-icons/react";
import type { ResourceType } from "@/components/cover";
import { FavoriteButton } from "../resurse/favorite-button";

export type ContinueItem = { id: string; title: string; category: string; type: ResourceType; ago: string; favorite: boolean };

const ICON = { video: VideoCamera, pdf: FilePdf, text: TextAlignLeft, link: LinkIcon } as const;
const INITIAL = 4;

export function ContinueList({ items }: { items: ContinueItem[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, INITIAL);
  return (
    <section aria-labelledby="continua" className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card md:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 id="continua" className="text-xl font-bold tracking-tight">Continuă de unde ai rămas</h2>
        {items.length > INITIAL && (
          <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} className="min-h-11 rounded-full border border-line px-4 text-sm font-semibold transition-colors hover:bg-surface2">
            {all ? "Mai puține" : "Vezi toate"}
          </button>
        )}
      </div>
      <ul className="flex flex-col divide-y divide-line">
        {shown.map((it) => {
          const Icon = ICON[it.type];
          return (
            <li key={it.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Link href={`/resurse/${it.id}`} className="group flex min-w-0 flex-1 items-center gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-soft text-violet"><Icon size={22} weight="fill" /></span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-semibold group-hover:text-accent">{it.title}</span>
                  <span className="text-sm text-muted">Deschisă {it.ago}</span>
                </span>
                <span className="hidden shrink-0 rounded-full bg-violet-soft px-3 py-1 text-xs font-semibold text-violet sm:inline">{it.category}</span>
              </Link>
              <FavoriteButton resourceId={it.id} initial={it.favorite} compact />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
