import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, PageTitle, btn } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { markHandled } from "./actions";

export const metadata: Metadata = { title: "Mesaje" };

type Row = { id: string; subject: string; message: string; handled_at: string | null; created_at: string; profiles: { first_name: string; last_name: string; email: string } | { first_name: string; last_name: string; email: string }[] | null };

export default async function MessagesAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from("contact_messages").select("id,subject,message,handled_at,created_at,profiles(first_name,last_name,email)").order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as Row[];
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Mesaje" />
      <ul className="flex flex-col gap-4">
        {rows.map((m) => {
          const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          return (
            <li key={m.id}>
              <Card className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{m.subject || "Fără subiect"}</span>
                  <Badge tone={m.handled_at ? "ok" : "accent"}>{m.handled_at ? "Rezolvat" : "Nou"}</Badge>
                </div>
                <p className="text-sm text-muted">{p ? `${p.first_name} ${p.last_name}`.trim() : ""} · <a className="underline" href={`mailto:${p?.email}`}>{p?.email}</a> · {formatDateTime(m.created_at)}</p>
                <p className="max-w-[65ch] whitespace-pre-line">{m.message}</p>
                <form action={markHandled}><input type="hidden" name="id" value={m.id} />{m.handled_at && <input type="hidden" name="undo" value="1" />}<button className={btn.secondary}>{m.handled_at ? "Marchează ca nou" : "Marchează rezolvat"}</button></form>
              </Card>
            </li>
          );
        })}
        {rows.length === 0 && <li className="rounded-card border border-dashed border-line p-8 text-center text-muted">Niciun mesaj.</li>}
      </ul>
    </div>
  );
}
