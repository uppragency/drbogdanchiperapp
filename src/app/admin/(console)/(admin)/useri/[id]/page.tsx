import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, PageTitle, btn } from "@/components/ui";
import { formatDateTime, isoToLocalInput } from "@/lib/format";
import { UserForm } from "../user-form";
import { pauseUser, resumeUser, purgeUser, resendInvite, resetSessions, restoreUser, sendResetLink, trashUser, updateUser, validateAccount } from "../actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { PasswordForm } from "../password-form";
import { AccountForms } from "../account-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Editează userul" };

export default async function EditUser({ params }: PageProps<"/admin/useri/[id]">) {
  const { id } = await params;
  const me = await requireUser();
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
  const { data: authUser } = await createAdminClient().auth.admin.getUserById(id);
  const emailConfirmed = Boolean(authUser?.user?.email_confirmed_at);
  const validated = emailConfirmed && p.is_active && !trashed;
  const isAdminAccount = p.role !== "user";
  const { data: events } = await supabase.from("access_events").select("id,kind,detail,actor,created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(100);
  const actorIds = [...new Set((events ?? []).map((e: { actor: string | null }) => e.actor).filter((a): a is string => Boolean(a)))];
  const { data: actors } = actorIds.length ? await supabase.from("profiles").select("id,first_name,last_name,email").in("id", actorIds) : { data: [] };
  const actorName = new Map((actors ?? []).map((a: { id: string; first_name: string; last_name: string; email: string }) => [a.id, `${a.first_name} ${a.last_name}`.trim() || a.email]));
  const EVENT_LABEL: Record<string, string> = {
    inscris: "Înscris în platformă",
    grupa_adaugata: "Grupă adăugată",
    grupa_scoasa: "Grupă scoasă",
    pauza: "Cont pus pe pauză",
    reactivare: "Cont reactivat",
    expirare_setata: "Acces până la",
    expirare_scoasa: "Expirare scoasă (era la)",
    sters: "Cont șters",
    restaurat: "Cont restaurat",
    rol: "Rol schimbat în",
  };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/useri" className="text-sm font-semibold text-muted hover:text-ink">Înapoi la useri</Link>
      <PageTitle title={`${p.first_name} ${p.last_name}`.trim() || p.email}>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/useri/${id}/previzualizare`} className={btn.secondary}>Ce vede userul</Link>
          {isAdminAccount && <Badge tone="accent">{p.role === "moderator" ? "Moderator" : "Administrator"}</Badge>}
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

      {!trashed && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Email și rol</h2>
          <AccountForms id={p.id} email={p.email} role={p.role as "user" | "moderator" | "admin"} isSelf={me.id === p.id} />
        </Card>
      )}

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Validare cont</h2>
          <Badge tone={validated ? "ok" : "danger"}>{validated ? "Validat" : "Nevalidat"}</Badge>
        </div>
        <ul className="flex flex-wrap gap-2 text-sm">
          <li><Badge tone={emailConfirmed ? "ok" : "danger"}>{emailConfirmed ? "Email confirmat" : "Email neconfirmat"}</Badge></li>
          <li><Badge tone={p.is_active ? "ok" : "warn"}>{p.is_active ? "Cont activ" : "Cont pe pauză"}</Badge></li>
          <li><Badge tone={p.terms_accepted_at ? "ok" : "neutral"}>{p.terms_accepted_at ? "Termeni acceptați" : "Termeni neacceptați"}</Badge></li>
        </ul>
        {!validated && (
          <form action={validateAccount} className="flex flex-col gap-2">
            <input type="hidden" name="id" value={p.id} />
            <p className="text-sm text-muted">Validarea confirmă emailul și activează contul, ca userul să se poată autentifica imediat.</p>
            <div><button className={btn.primary}>Validează contul</button></div>
          </form>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Parolă</h2>
        <PasswordForm userId={p.id} />
        <form action={sendResetLink} className="flex flex-col gap-2 border-t border-line pt-4">
          <input type="hidden" name="id" value={p.id} />
          <p className="text-sm text-muted">Sau trimite userului un link de resetare, ca să-și aleagă singur parola.</p>
          <div><button className={btn.secondary}>Trimite link de resetare</button></div>
        </form>
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
            {p.is_active ? (
              <form action={pauseUser}><input type="hidden" name="id" value={p.id} /><button className={btn.secondary}>Pune contul pe pauză</button></form>
            ) : (
              <form action={resumeUser}><input type="hidden" name="id" value={p.id} /><button className={btn.primary}>Reactivează contul</button></form>
            )}
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Istoric acces</h2>
        <ul className="divide-y divide-line text-sm">
          {(events ?? []).map((e: { id: string; kind: string; detail: string | null; actor: string | null; created_at: string }) => (
            <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
              <span className="font-semibold">{EVENT_LABEL[e.kind] ?? e.kind}{e.detail ? `: ${e.detail}` : ""}</span>
              <span className="text-muted">{formatDateTime(e.created_at)}{e.actor ? ` · ${actorName.get(e.actor) ?? "echipă"}` : ""}</span>
            </li>
          ))}
          {(events ?? []).length === 0 && <li className="py-2 text-muted">Nicio schimbare înregistrată.</li>}
        </ul>
        <p className="text-xs text-muted">Se înregistrează din 6 octombrie 2026. Schimbările de grupă și pauzele de dinainte nu sunt în istoric.</p>
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
