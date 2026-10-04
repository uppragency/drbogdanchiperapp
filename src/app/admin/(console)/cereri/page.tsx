import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Alert, Badge, Card, PageTitle, btn } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { approveRequest, rejectRequest } from "./actions";

export const metadata: Metadata = { title: "Cereri de acces" };

export default async function RequestsAdmin({ searchParams }: PageProps<"/admin/cereri">) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data }, { data: tags }] = await Promise.all([
    supabase.from("access_requests").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("tags").select("id,name").order("position"),
  ]);
  const pending = (data ?? []).filter((r) => r.status === "pending");
  const done = (data ?? []).filter((r) => r.status !== "pending");
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Cereri de acces" />
      {sp.err && <Alert>{sp.err === "grup" ? "Alege grupul MentorMed înainte de aprobare." : String(sp.err)}</Alert>}
      <p className="max-w-[65ch] text-muted">Aprobarea creează contul cu grupul ales. Invitația se trimite apoi din pagina Invitații.</p>
      <ul className="flex flex-col gap-4">
        {pending.map((r) => (
          <li key={r.id}>
            <Card className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-lg font-bold">{`${r.first_name} ${r.last_name}`.trim()}</span>
                <span className="text-sm text-muted">{r.email} · {formatDateTime(r.created_at)}</span>
                {r.message && <p className="mt-2 max-w-[65ch] whitespace-pre-line">{r.message}</p>}
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <form action={approveRequest} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={r.id} />
                  <div className="flex flex-col gap-2">
                    <label htmlFor={`tag-${r.id}`} className="text-sm font-semibold">Grup</label>
                    <select id={`tag-${r.id}`} name="tagId" required defaultValue="" className="h-11 rounded-control border border-line bg-bg px-3 text-base">
                      <option value="" disabled>Alege</option>
                      {(tags ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select>
                  </div>
                  <button className={btn.primary}>Aprobă și creează contul</button>
                </form>
                <form action={rejectRequest}><input type="hidden" name="id" value={r.id} /><button className={btn.secondary}>Respinge</button></form>
              </div>
            </Card>
          </li>
        ))}
        {pending.length === 0 && <li className="rounded-card border border-dashed border-line p-8 text-center text-muted">Nicio cerere în așteptare.</li>}
      </ul>
      {done.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-muted">Cereri procesate ({done.length})</summary>
          <ul className="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
            {done.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <span>{`${r.first_name} ${r.last_name}`.trim()} · {r.email}</span>
                <Badge tone={r.status === "approved" ? "ok" : "neutral"}>{r.status === "approved" ? "Aprobată" : "Respinsă"}</Badge>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
