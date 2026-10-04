"use client";
import { useState, type ReactNode } from "react";
import { cn } from "@/components/ui";

export type TabItem = { id: string; label: string; count?: number; content: ReactNode };

export function Tabs({ items }: { items: TabItem[] }) {
  const [active, setActive] = useState(items[0]?.id);
  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" className="flex gap-6 border-b border-line">
        {items.map((it) => (
          <button key={it.id} type="button" role="tab" id={`tab-${it.id}`} aria-selected={active === it.id} aria-controls={`panel-${it.id}`} onClick={() => setActive(it.id)} className={cn("-mb-px min-h-11 border-b-2 px-1 text-sm font-semibold transition-colors", active === it.id ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink")}>
            {it.label}
            {it.count ? <span className="ml-2 rounded-full bg-surface2 px-2 py-0.5 text-xs">{it.count}</span> : null}
          </button>
        ))}
      </div>
      {items.map((it) => (
        <div key={it.id} role="tabpanel" id={`panel-${it.id}`} aria-labelledby={`tab-${it.id}`} hidden={active !== it.id}>
          {it.content}
        </div>
      ))}
    </div>
  );
}
