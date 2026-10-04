"use client";
import { useEffect, useState, useTransition } from "react";
import { btn, cn } from "@/components/ui";
import { useTx } from "@/components/locale-provider";
import { removePushSubscription, savePushSubscription, sendTestPush } from "./push-actions";

type Status = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function urlBase64ToUint8Array(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushToggle() {
  const tx = useTx();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ua = navigator.userAgent;
      const isIos = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      let next: Status;
      if (isIos && !standalone) next = "ios-install";
      else if (!supported) next = "unsupported";
      else if (Notification.permission === "denied") next = "denied";
      else {
        next = "off";
        try {
          const reg = await navigator.serviceWorker.getRegistration("/sw.js");
          const sub = await reg?.pushManager.getSubscription();
          if (sub && Notification.permission === "granted") next = "on";
        } catch {}
      }
      if (!cancelled) setStatus(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fail = () => setMessage({ kind: "error", text: tx("Nu am putut activa notificările. Încearcă din nou.", "Could not enable notifications. Try again.") });

  function enable() {
    setMessage(null);
    start(async () => {
      try {
        const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!key) return fail();
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        const permission = await Notification.requestPermission();
        if (permission === "denied") return setStatus("denied");
        if (permission !== "granted") return;
        const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
        const json = sub.toJSON();
        const res = await savePushSubscription({ endpoint: sub.endpoint, keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" } });
        if (!res.ok) {
          await sub.unsubscribe().catch(() => {});
          return fail();
        }
        setStatus("on");
      } catch {
        fail();
      }
    });
  }

  function disable() {
    setMessage(null);
    start(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe();
          await removePushSubscription(endpoint);
        }
        setStatus("off");
      } catch {
        setMessage({ kind: "error", text: tx("Nu am putut dezactiva notificările. Încearcă din nou.", "Could not disable notifications. Try again.") });
      }
    });
  }

  function test() {
    setMessage(null);
    start(async () => {
      try {
        const r = await sendTestPush();
        setMessage(r.ok ? { kind: "ok", text: tx("Notificarea de test a fost trimisă.", "Test notification sent.") } : { kind: "error", text: tx("Nu am putut trimite notificarea de test.", "Could not send the test notification.") });
      } catch {
        setMessage({ kind: "error", text: tx("Nu am putut trimite notificarea de test.", "Could not send the test notification.") });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold text-ink">{tx("Notificări", "Notifications")}</h2>
        <p className="mt-1 text-sm text-muted">{tx("Primești o notificare când apare o resursă nouă pentru tine.", "Get a notification when a new resource is added for you.")}</p>
      </div>

      {status === "ios-install" && (
        <p className="text-sm text-muted">
          {tx("Pe iPhone, deschide meniul Partajare și alege Adaugă pe ecranul principal.", "On iPhone, open the Share menu and choose Add to Home Screen.")}
          <br />
          {tx("Apoi deschide aplicația din ecranul principal și activează notificările.", "Then open the app from your home screen and enable notifications.")}
        </p>
      )}
      {status === "unsupported" && <p className="text-sm text-muted">{tx("Acest browser nu suportă notificări.", "This browser does not support notifications.")}</p>}
      {status === "denied" && <p className="text-sm text-muted">{tx("Notificările sunt blocate. Le poți permite din setările browserului sau ale telefonului.", "Notifications are blocked. You can allow them in your browser or phone settings.")}</p>}

      {status === "off" && (
        <div>
          <button type="button" onClick={enable} disabled={pending} className={cn(btn.primary)}>
            {tx("Activează notificările", "Enable notifications")}
          </button>
        </div>
      )}
      {status === "on" && (
        <>
          <p className="text-sm font-medium text-ink">{tx("Notificările sunt active pe acest dispozitiv", "Notifications are active on this device")}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={test} disabled={pending} className={cn(btn.secondary)}>
              {tx("Trimite o notificare de test", "Send a test notification")}
            </button>
            <button type="button" onClick={disable} disabled={pending} className={cn(btn.ghost)}>
              {tx("Dezactivează notificările", "Disable notifications")}
            </button>
          </div>
        </>
      )}

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={cn("text-sm", message.kind === "error" ? "text-danger" : "text-muted")}>
          {message.text}
        </p>
      )}
    </div>
  );
}
