"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { getOnlineNow, type OnlineUser } from "./actions";

const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 1 ? "acum" : `acum ${m} min`;
};

export function OnlineNow({ initial }: { initial: OnlineUser[] }) {
  const [users, setUsers] = useState(initial);
  const [updated, setUpdated] = useState<number | null>(null);
  const [, start] = useTransition();

  const refresh = useCallback(() => {
    start(async () => {
      try {
        setUsers(await getOnlineNow());
        setUpdated(Date.now());
      } catch {
        /* keep the last list */
      }
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 60000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">Activi acum</h2>
        <span className="text-sm text-muted">Sesiuni active în ultimele 15 minute{updated ? `, actualizat ${new Date(updated).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
      </div>
      <p className="flex items-center gap-3 text-5xl font-bold tracking-tight" aria-live="polite">
        <span className="relative flex size-3" aria-hidden>
          <span className={`absolute inline-flex size-full rounded-full bg-ok ${users.length ? "animate-ping opacity-60" : "opacity-0"}`} />
          <span className={`relative inline-flex size-3 rounded-full ${users.length ? "bg-ok" : "bg-muted"}`} />
        </span>
        {users.length}
      </p>
      {users.length > 0 ? (
        <ul className="divide-y divide-line">
          {users.map((u) => (
            <li key={u.user_id} className="flex items-center gap-3 py-3">
              <Link href={`/admin/useri/${u.user_id}`} className="min-w-0 flex-1 truncate font-semibold hover:text-accent">{`${u.first_name} ${u.last_name}`.trim() || u.email}</Link>
              <span className="text-sm text-muted">{ago(u.last_seen)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Niciun membru activ în ultimele 15 minute. Cifra e aproximativă: o sesiune se reînnoiește la câteva minute, nu la fiecare click.</p>
      )}
    </Card>
  );
}
