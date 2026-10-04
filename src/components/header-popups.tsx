"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChatsCircle, FilePdf, Link as LinkIcon, MagnifyingGlass, Sparkle, TextAlignLeft, VideoCamera, X } from "@phosphor-icons/react";
import { useTx } from "@/components/locale-provider";
import { Highlight } from "@/components/highlight";
import { notificationsPreview, searchPreview, type NoticeItem, type SearchHit } from "@/app/(app)/header-actions";
import { markNotificationsSeen } from "@/app/(app)/notificari/actions";

const iconBtn = "relative flex size-11 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface2 hover:text-ink";
const TYPE_ICON = { video: VideoCamera, pdf: FilePdf, text: TextAlignLeft, link: LinkIcon } as const;
// Keep normal link behaviour for new-tab clicks; open the popup otherwise.
const plain = (e: React.MouseEvent) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0);

export function SearchPopup() {
  const tx = useTx();
  const dialog = useRef<HTMLDialogElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);

  const onChange = (value: string) => {
    setQ(value);
    clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setHits(null);
      return;
    }
    timer.current = setTimeout(async () => setHits(await searchPreview(value)), 220);
  };
  const close = () => dialog.current?.close();

  return (
    <>
      <Link
        href="/cauta"
        data-tour="search"
        aria-label={tx("Caută în toate categoriile", "Search all categories")}
        title={tx("Caută", "Search")}
        className={iconBtn}
        onClick={(e) => {
          if (!plain(e)) return;
          e.preventDefault();
          dialog.current?.showModal();
        }}
      >
        <MagnifyingGlass size={20} />
      </Link>
      <dialog
        ref={dialog}
        aria-label={tx("Căutare", "Search")}
        onClick={(e) => e.target === dialog.current && close()}
        className="m-0 mx-auto mt-[8vh] w-[min(40rem,calc(100vw-2rem))] max-w-none rounded-card border border-line bg-surface p-0 text-ink shadow-card backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim().length < 2) return;
            close();
            router.push(`/cauta?q=${encodeURIComponent(q.trim())}`);
          }}
          className="flex items-center gap-3 border-b border-line px-5"
        >
          <MagnifyingGlass size={20} className="shrink-0 text-muted" />
          <input
            value={q}
            onChange={(e) => onChange(e.target.value)}
            placeholder={tx("Caută în toate categoriile", "Search all categories")}
            aria-label={tx("Caută în toate categoriile", "Search all categories")}
            autoComplete="off"
            className="h-16 min-w-0 flex-1 bg-transparent text-base placeholder:text-muted focus:outline-none"
          />
          <button type="button" onClick={close} aria-label={tx("Închide", "Close")} className="flex size-11 shrink-0 items-center justify-center rounded-control text-muted hover:bg-surface2 hover:text-ink">
            <X size={20} />
          </button>
        </form>
        <div className="max-h-[60vh] overflow-y-auto p-2" aria-live="polite">
          {hits === null && <p className="px-3 py-6 text-center text-sm text-muted">{tx("Scrie cel puțin 2 caractere. Apasă Enter pentru toate rezultatele.", "Type at least 2 characters. Press Enter for all results.")}</p>}
          {hits && hits.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted">{tx(`Nu am găsit nicio resursă pentru „${q}”.`, `No resources found for “${q}”.`)}</p>}
          {hits && hits.length > 0 && (
            <ul>
              {hits.map((h) => {
                const Icon = TYPE_ICON[h.type];
                return (
                  <li key={h.id}>
                    <Link href={`/resurse/${h.id}`} onClick={close} className="flex min-h-14 items-center gap-3 rounded-control px-3 py-2 hover:bg-surface2">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet"><Icon size={18} /></span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-semibold"><Highlight text={h.title} q={q} /></span>
                        <span className="text-xs text-muted">{h.category}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link href={`/cauta?q=${encodeURIComponent(q.trim())}`} onClick={close} className="flex min-h-11 items-center justify-center rounded-control text-sm font-semibold text-accent hover:bg-surface2">
                  {tx("Vezi toate rezultatele", "See all results")}
                </Link>
              </li>
            </ul>
          )}
        </div>
      </dialog>
    </>
  );
}

export function NotificationsPopup({ unread }: { unread: number }) {
  const tx = useTx();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NoticeItem[] | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

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

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setItems(null);
      const list = await notificationsPreview();
      setItems(list);
      // The list is already loaded, so clearing the badge no longer changes what is shown.
      if (list.some((x) => x.unread)) void markNotificationsSeen();
    }
  };

  return (
    <div ref={wrap}>
      <Link
        href="/notificari"
        data-tour="bell"
        aria-label={unread > 0 ? tx(`Notificări, ${unread} necitite`, `Notifications, ${unread} unread`) : tx("Notificări", "Notifications")}
        aria-expanded={open}
        title={tx("Notificări", "Notifications")}
        className={iconBtn}
        onClick={(e) => {
          if (!plain(e)) return;
          e.preventDefault();
          void toggle();
        }}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span aria-hidden className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-violet px-1 text-[10px] font-bold leading-4 text-on-violet">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
      {open && (
        <div role="dialog" aria-label={tx("Notificări", "Notifications")} className="page-fade absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-line bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <p className="font-bold">{tx("Notificări", "Notifications")}</p>
            <Link href="/notificari" onClick={() => setOpen(false)} className="text-sm font-semibold text-accent hover:underline">{tx("Vezi toate", "See all")}</Link>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {items === null && <p className="px-3 py-6 text-center text-sm text-muted">{tx("Se încarcă", "Loading")}</p>}
            {items && items.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted">{tx("Nu ai notificări.", "You have no notifications.")}</p>}
            {items && items.length > 0 && (
              <ul>
                {items.map((n) => (
                  <li key={n.key}>
                    <Link href={n.href} onClick={() => setOpen(false)} className={`flex items-start gap-3 rounded-control px-3 py-3 hover:bg-surface2 ${n.unread ? "bg-violet-soft/60" : ""}`}>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet">{n.kind === "new" ? <Sparkle size={18} /> : <ChatsCircle size={18} />}</span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="line-clamp-2 text-sm font-semibold">{n.text}</span>
                        <span className="text-xs text-muted">{n.sub}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
