"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ClockCounterClockwise, Desktop, GearSix, Moon, SignOut, Sun, UserCircle } from "@phosphor-icons/react";
import { logout } from "@/app/actions";
import { cn } from "@/components/ui";
import { applyTheme, useThemePref, type ThemePref } from "@/components/theme-toggle";

const THEMES: { value: ThemePref; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Luminos", Icon: Sun },
  { value: "dark", label: "Întunecat", Icon: Moon },
  { value: "auto", label: "Automat", Icon: Desktop },
];

const item = "flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-sm font-semibold transition-colors hover:bg-surface2";

export function UserMenu({ initials, name, email, isAdmin }: { initials: string; name: string; email: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const pref = useThemePref();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Meniul contului"
        data-tour="menu"
        onClick={() => setOpen((v) => !v)}
        className="ml-1 flex size-11 items-center justify-center"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink">{initials}</span>
      </button>
      {open && (
        <div role="menu" className="page-fade absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-card border border-line bg-surface p-2 shadow-card">
          <div className="px-3 py-3">
            <p className="truncate font-bold">{name}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link role="menuitem" href="/profil" onClick={() => setOpen(false)} className={item}><UserCircle size={20} /> Profil</Link>
          <Link role="menuitem" href="/recente" onClick={() => setOpen(false)} className={item}><ClockCounterClockwise size={20} /> Văzute recent</Link>
          {isAdmin && <Link role="menuitem" href="/admin" onClick={() => setOpen(false)} className={item}><GearSix size={20} /> Administrare</Link>}
          <div className="my-1 h-px bg-line" />
          <div className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-muted">Temă</div>
          <div role="radiogroup" aria-label="Temă" className="grid grid-cols-3 gap-1 px-1 pb-2">
            {THEMES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={pref === value}
                onClick={() => applyTheme(value)}
                className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-control border text-xs font-semibold transition-colors", pref === value ? "border-accent bg-surface2 text-ink" : "border-transparent text-muted hover:bg-surface2 hover:text-ink")}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
          <div className="my-1 h-px bg-line" />
          <form action={logout}>
            <button type="submit" role="menuitem" className={item}><SignOut size={20} /> Ieși din cont</button>
          </form>
        </div>
      )}
    </div>
  );
}
