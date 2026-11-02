"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { DotsThreeVertical, Export, X } from "@phosphor-icons/react";
import { useTx } from "@/components/locale-provider";

const KEY = "install-hint-dismissed";
const noop = () => () => {};

type Platform = "ios" | "android" | "none";
type InstallPrompt = Event & { prompt: () => Promise<void> };

function detect(): Platform {
  try {
    const ua = navigator.userAgent;
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
    if (standalone || window.localStorage.getItem(KEY) === "1") return "none";
    if (/iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) return "ios";
    if (/Android/.test(ua)) return "android";
    return "none";
  } catch {
    return "none";
  }
}

// Short guide to add the platform to the home screen. Shown from the member's second sign in (the server passes `ready`).
export function InstallHint({ ready }: { ready: boolean }) {
  const tx = useTx();
  const platform = useSyncExternalStore(noop, detect, () => "none" as Platform);
  const [closed, setClosed] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setClosed(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!ready || platform === "none" || closed) return null;
  const dismiss = () => {
    try { window.localStorage.setItem(KEY, "1"); } catch {}
    setClosed(true);
  };
  return (
    <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-start gap-3 rounded-card border border-line bg-surface p-4 shadow-card pb-[max(1rem,env(safe-area-inset-bottom))]" role="region" aria-label={tx("Instalare aplicație", "Install app")}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet">{platform === "ios" ? <Export size={20} aria-hidden /> : <DotsThreeVertical size={20} weight="bold" aria-hidden />}</span>
      <div className="flex-1 text-sm leading-relaxed">
        <span className="block font-bold">{tx("Folosește platforma ca aplicație", "Use the platform as an app")}</span>
        {platform === "ios" ? (
          <p>{tx("Apasă ", "Tap ")}<strong>{tx("Partajează", "Share")}</strong>{tx(" în Safari, apoi ", " in Safari, then ")}<strong>{tx("Adaugă pe ecranul principal", "Add to Home Screen")}</strong>.</p>
        ) : prompt ? (
          <>
            <p>{tx("Se deschide direct de pe ecranul telefonului, fără a căuta linkul.", "It opens straight from your home screen, no need to look for the link.")}</p>
            <button
              type="button"
              onClick={async () => {
                await prompt.prompt();
                setPrompt(null);
                dismiss();
              }}
              className="mt-2 inline-flex h-11 items-center rounded-full bg-violet px-5 font-semibold text-on-violet transition-colors hover:bg-violet-hover active:scale-[0.98]"
            >
              {tx("Instalează aplicația", "Install the app")}
            </button>
          </>
        ) : (
          <p>{tx("Apasă ", "Tap ")}<strong>⋮</strong>{tx(" în Chrome, apoi ", " in Chrome, then ")}<strong>{tx("Instalează aplicația", "Install app")}</strong>{tx(" sau ", " or ")}<strong>{tx("Adaugă pe ecranul de pornire", "Add to Home screen")}</strong>.</p>
        )}
      </div>
      <button type="button" aria-label={tx("Închide", "Close")} onClick={dismiss} className="flex size-11 shrink-0 items-center justify-center rounded-control text-muted hover:bg-surface2 hover:text-ink">
        <X size={20} />
      </button>
    </div>
  );
}
