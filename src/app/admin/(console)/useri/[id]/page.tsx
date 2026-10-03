import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, PageTitle, btn } from "@/components/ui";
import { formatDateTime, isoToLocalInput } from "@/lib/format";
import { UserForm } from "../user-form";
import { purgeUser, resendInvite, resetSessions, restoreUser, trashUser, updateUser } from "../actions";

export const metadata: Metadata = { title: "Editează userul" };

export default async function EditUser({ params }: PageProps<"/admin/useri/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: p }, { data: tags }, { data: ut }, { data: inv }, { data: sessions }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("tags").select("id,name").order("position"),
    supabase.from("user_tags").select("tag_id").eq("user_id", id),
    supabase.from("invitations").select("sent_at,accepted_at").eq("user_id", id).maybeSingle(),
    supabase.from("user_sessions").select("session_id,device,last_seen").eq("user_id", id).is("revoked_at", null).order("last_seen", { ascending: false }),
  ]);
  if (!p) notFound();
  const trashed = Boolean(p.deleted_at);
  const isAdminAccount = p.role === "admin";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/useri" className="text-sm font-semibold text-muted hover:text-ink">Înapoi la useri</Link>
      <PageTitle title={`${p.first_name} ${p.last_name}`.trim() || p.email}>
        <div className="flex gap-2">
          {isAdminAccount && <Badge tone="accent">Administrator</Badge>}
          {trashed && <Badge tone="danger">Șters</Badge>}
        </div>
      </PageTitle>

      <Card>
        <UserForm
          tags={tags ?? []}
          action={updateUser}
          values={{
            id: p.id,
            email: p.email,
            firstName: p.first_name,
            lastName: p.last_name,
            tagIds: (ut ?? []).map((x) => x.tag_id),
            accessExpires: p.access_expires_at ? isoToLocalInput(p.access_expires_at).slice(0, 10) : "",
            paidAt: p.paid_at ?? "",
            paidNote: p.paid_note ?? "",
            adminNote: p.admin_note ?? "",
            isActive: p.is_active,
          }}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Activitate</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Ultima logare</dt><dd className="font-semibold">{formatDateTime(p.last_login_at) || "Niciodată"}</dd></div>
          <div><dt className="text-muted">Termeni acceptați</dt><dd className="font-semibold">{formatDateTime(p.terms_accepted_at) || "Nu"}</dd></div>
          <div><dt className="text-muted">Invitație trimisă</dt><dd className="font-semibold">{formatDateTime(inv?.sent_at) || "Nu"}</dd></div>
          <div><dt className="text-muted">Invitație acceptată</dt><dd className="font-semibold">{formatDateTime(inv?.accepted_at) || "Nu"}</dd></div>
        </dl>
        <div>
          <p className="text-sm text-muted">Dispozitive active ({(sessions ?? []).length} din maximum 2)</p>
          <ul className="mt-2 divide-y divide-line text-sm">
            {(sessions ?? []).map((s) => <li key={s.session_id} className="flex justify-between py-2"><span className="font-semibold">{s.device}</span><span className="text-muted">{formatDateTime(s.last_seen)}</span></li>)}
            {(sessions ?? []).length === 0 && <li className="py-2 text-muted">Niciun dispozitiv activ.</li>}
          </ul>
        </div>
        {!isAdminAccount && !trashed && (
          <div className="flex flex-wrap gap-2">
            <form action={resendInvite}><input type="hidden" name="id" value={p.id} /><button className={btn.secondary}>{inv?.sent_at ? "Retrimite invitația" : "Trimite invitația"}</button></form>
            <form action={resetSessions}><input type="hidden" name="id" value={p.id} /><button className={btn.secondary}>Deconectează de pe toate dispozitivele</button></form>
          </div>
        )}
      </Card>

      {!isAdminAccount && (
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted">{trashed ? "Contul este șters și nu se poate autentifica." : "Contul se dezactivează și poate fi restaurat."}</p>
          <div className="flex gap-2">
            {trashed ? (
              <>
                <form action={restoreUser}><input type="hidden" name="id" value={p.id} /><button className={btn.secondary}>Restaurează</button></form>
                <form action={purgeUser}><input type="hidden" name="id" value={p.id} /><button className={btn.danger}>Șterge definitiv</button></form>
              </>
            ) : (
              <form action={trashUser}><input type="hidden" name="id" value={p.id} /><button className={btn.danger}>Șterge userul</button></form>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
