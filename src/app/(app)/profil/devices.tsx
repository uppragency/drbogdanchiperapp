import { DeviceMobile } from "@phosphor-icons/react/dist/ssr";
import { Badge, Card, btn } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/format";
import { getLocale, getTx } from "@/lib/i18n";
import { revokeDevice } from "./actions";

export async function Devices({ userId, currentSession }: { userId: string; currentSession: string | null }) {
  const tx = await getTx();
  const locale = await getLocale();
  const { data } = await createAdminClient().from("user_sessions").select("session_id,device,last_seen").eq("user_id", userId).is("revoked_at", null).order("last_seen", { ascending: false });
  const rows = data ?? [];
  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">{tx("Dispozitive conectate", "Connected devices")}</h2>
      <p className="mb-4 text-sm text-muted">{tx("Contul poate fi folosit pe cel mult 2 dispozitive în același timp.", "Your account can be used on at most 2 devices at the same time.")}</p>
      <ul className="divide-y divide-line">
        {rows.map((s) => {
          const current = s.session_id === currentSession;
          return (
            <li key={s.session_id} className="flex flex-wrap items-center gap-3 py-3">
              <DeviceMobile size={24} className="shrink-0 text-muted" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <span className="truncate">{s.device || tx("Dispozitiv necunoscut", "Unknown device")}</span>
                  {current && <Badge tone="ok">{tx("Acest dispozitiv", "This device")}</Badge>}
                </span>
                <span className="block text-xs text-muted">{tx("Ultima activitate", "Last active")}: {formatDateTime(s.last_seen, locale)}</span>
              </span>
              {!current && (
                <form action={revokeDevice}>
                  <input type="hidden" name="session" value={s.session_id} />
                  <button className={btn.secondary}>{tx("Deconectează", "Sign out")}</button>
                </form>
              )}
            </li>
          );
        })}
        {rows.length === 0 && <li className="py-3 text-sm text-muted">{tx("Niciun dispozitiv activ.", "No active devices.")}</li>}
      </ul>
    </Card>
  );
}
