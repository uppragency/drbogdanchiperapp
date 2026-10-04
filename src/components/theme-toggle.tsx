"use client";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "@phosphor-icons/react";
import { useTx } from "@/components/locale-provider";

export type ThemePref = "light" | "dark" | "auto";
const EVENT = "theme-pref-change";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function readPref(): ThemePref {
  try {
    const s = window.localStorage.getItem("theme");
    return s === "light" || s === "dark" ? s : "auto";
  } catch {
    return "auto";
  }
}

export function applyTheme(pref: ThemePref) {
  const dark = pref === "dark" || (pref === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  try {
    if (pref === "auto") window.localStorage.removeItem("theme");
    else window.localStorage.setItem("theme", pref);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribe, readPref, () => "auto" as ThemePref);
}

// Quick light/dark switch for pages without the user menu (login, password reset).
export function ThemeToggle() {
  const pref = useThemePref();
  const tx = useTx();
  const isDark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.getAttribute("data-theme") === "dark",
    () => false,
  );
  const next = isDark ? "light" : "dark";
  void pref;
  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={next === "dark" ? tx("Comută pe tema închisă", "Switch to dark theme") : tx("Comută pe tema luminoasă", "Switch to light theme")}
      title={next === "dark" ? tx("Tema închisă", "Dark theme") : tx("Tema luminoasă", "Light theme")}
      className="flex size-11 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface2 hover:text-ink"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
