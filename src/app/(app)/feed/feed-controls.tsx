"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListBullets, SquaresFour } from "@phosphor-icons/react";
import { cn } from "@/components/ui";
import { useTx } from "@/components/locale-provider";

function remember(view: string) {
  try {
    document.cookie = `vedere=${view}; path=/; max-age=31536000; samesite=lax`;
  } catch {}
}

export function ViewToggle({ current, listHref, gridHref }: { current: "lista" | "grila"; listHref: string; gridHref: string }) {
  const tx = useTx();
  const item = (key: "lista" | "grila", href: string, label: string, Icon: typeof ListBullets) => (
    <Link
      href={href}
      scroll={false}
      onClick={() => remember(key)}
      aria-label={label}
      title={label}
      aria-pressed={current === key}
      className={cn("flex size-9 items-center justify-center rounded-full transition-colors", current === key ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}
    >
      <Icon size={18} />
    </Link>
  );
  return (
    <div className="inline-flex gap-1 rounded-full bg-surface2 p-1" role="group" aria-label={tx("Mod de afișare", "Display mode")}>
      {item("lista", listHref, tx("Listă", "List"), ListBullets)}
      {item("grila", gridHref, tx("Grilă", "Grid"), SquaresFour)}
    </div>
  );
}

export function SortSelect({ value, options }: { value: string; options: { value: string; label: string; href: string }[] }) {
  const router = useRouter();
  const tx = useTx();
  return (
    <label className="inline-flex items-center gap-2 text-sm font-semibold text-muted">
      <span className="sr-only sm:not-sr-only">{tx("Sortare", "Sort by")}</span>
      <select
        value={value}
        onChange={(e) => {
          const o = options.find((x) => x.value === e.target.value);
          if (o) router.push(o.href, { scroll: false });
        }}
        className="h-11 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink focus:border-accent focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
