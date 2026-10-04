"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

export type NavItem = { href: string; label: string; match: string[] };

// Active section = underline. Works on one row, scrolls sideways on narrow phones.
export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Navigare principală" className="no-scrollbar -mx-4 flex overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex items-center gap-1">
        {items.map((it) => {
          const active = it.match.some((m) => path === m || path.startsWith(m + "/"));
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-11 items-center whitespace-nowrap px-3 text-sm font-semibold transition-colors",
                  active ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                {it.label}
                <span aria-hidden className={cn("absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent transition-opacity", active ? "opacity-100" : "opacity-0")} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
