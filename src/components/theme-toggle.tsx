"use client";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

type Theme = "light" | "dark";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
const read = (): Theme => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as Theme);
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.setAttribute("data-theme", next);
        try {
          window.localStorage.setItem("theme", next);
        } catch {}
      }}
      aria-label={next === "dark" ? "Comută pe tema închisă" : "Comută pe tema luminoasă"}
      title={next === "dark" ? "Tema închisă" : "Tema luminoasă"}
      className="flex size-11 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface2 hover:text-ink"
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
