import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, PageTitle, btn } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { restoreResource } from "../resurse/actions";
import { restoreUser } from "../useri/actions";

export const metadata: Metadata = { title: "Coș" };

export default async function TrashPage() {
  const supabase = await createClient();
  const [{ data: resources }, { data: users }] = await Promise.all([
    supabase.from("resources").select("id,title,deleted_at").not("deleted_at", "is", null).order("deleted_at", { ascending: false }).limit(100),
    supabase.from("profiles").select("id,email,first_name,last_name,deleted_at").not("deleted_at", "is", null).order("deleted_at", { ascending: false }).limit(100),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Coș" />
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Resurse șterse</h2>
        <ul className="divide-y divide-line">
          {(resources ?? []).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 py-3">
              <span className="flex flex-col"><span className="font-semibold">{r.title}</span><span className="text-sm text-muted">Șters {formatDateTime(r.deleted_at)}</span></span>
              <form action={restoreResource}><input type="hidden" name="id" value={r.id} /><button className={btn.secondary}>Restaurează ca draft</button></form>
            </li>
          ))}
          {(resources ?? []).length === 0 && <li className="py-3 text-sm text-muted">Nicio resursă în coș.</li>}
        </ul>
      </Card>
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Useri șterși</h2>
        <ul className="divide-y divide-line">
          {(users ?? []).map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-4 py-3">
              <span className="flex flex-col"><span className="font-semibold">{`${u.first_name} ${u.last_name}`.trim() || u.email}</span><span className="text-sm text-muted">{u.email} · șters {formatDateTime(u.deleted_at)}</span></span>
              <form action={restoreUser}><input type="hidden" name="id" value={u.id} /><button className={btn.secondary}>Restaurează</button></form>
            </li>
          ))}
          {(users ?? []).length === 0 && <li className="py-3 text-sm text-muted">Niciun user în coș.</li>}
        </ul>
      </Card>
    </div>
  );
}
