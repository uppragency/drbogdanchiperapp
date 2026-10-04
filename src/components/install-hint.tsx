"use client";
import { useState, useSyncExternalStore } from "react";
import { Export, X } from "@phosphor-icons/react";

const KEY = "install-hint-dismissed";
const noop = () => () => {};

function shouldShow(): boolean {
  try {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua);
    const safari = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!ios || !safari || standalone) return false;
    return window.localStorage.getItem(KEY) !== "1";
  } catch {
    return false;
  }
}

// iPhone Safari only: short guide to add the platform to the home screen.
export function InstallHint() {
  const eligible = useSyncExternalStore(noop, shouldShow, () => false);
  const [closed, setClosed] = useState(false);
  if (!eligible || closed) return null;
  return (
    <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-start gap-3 rounded-card border border-line bg-surface p-4 shadow-card pb-[max(1rem,env(safe-area-inset-bottom))]" role="region" aria-label="Instalare aplicație">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet"><Export size={20} aria-hidden /></span>
      <p className="flex-1 text-sm leading-relaxed">
        <span className="block font-bold">Folosește platforma ca aplicație</span>
        Apasă <strong>Partajează</strong> în Safari, apoi <strong>Adaugă pe ecranul principal</strong>.
      </p>
      <button
        type="button"
        aria-label="Închide"
        onClick={() => {
          try { window.localStorage.setItem(KEY, "1"); } catch {}
          setClosed(true);
        }}
        className="flex size-11 shrink-0 items-center justify-center rounded-control text-muted hover:bg-surface2 hover:text-ink"
      >
        <X size={20} />
      </button>
    </div>
  );
}
