import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Alert, Card, PageTitle, btn } from "@/components/ui";
import { sendNextInvitations } from "../useri/actions";

export const metadata: Metadata = { title: "Invitații" };

export default async function InvitationsPage({ searchParams }: PageProps<"/admin/invitatii">) {
  const sp = await searchParams;
  const supabase = await createClient();
  const cnt = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
  const [total, notSent, accepted, waiting] = await Promise.all([
    cnt(supabase.from("invitations").select("id", { count: "exact", head: true })),
    cnt(supabase.from("invitations").select("id", { count: "exact", head: true }).is("sent_at", null)),
    cnt(supabase.from("invitations").select("id", { count: "exact", head: true }).not("accepted_at", "is", null)),
    cnt(supabase.from("invitations").select("id", { count: "exact", head: true }).not("sent_at", "is", null).is("accepted_at", null)),
  ]);
  const sent = typeof sp.trimise === "string" ? Number(sp.trimise) : null;
  const failed = typeof sp.esuate === "string" ? Number(sp.esuate) : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Invitații" />
      {sent !== null && (failed ? <Alert>{sent} trimise, {failed} eșuate. Verifică domeniul și cheia Resend.</Alert> : <Alert kind="ok">{sent} invitații trimise.</Alert>)}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Total", total], ["Netrimise", notSent], ["În așteptare", waiting], ["Acceptate", accepted]].map(([l, v]) => (
          <div key={l as string} className="rounded-card border border-line bg-surface p-5"><p className="text-3xl font-bold tracking-tight">{v}</p><p className="mt-1 text-sm text-muted">{l}</p></div>
        ))}
      </div>
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Trimite invitații</h2>
        <p className="text-sm text-muted">Se trimit câte 30 de emailuri la o apăsare, ca să rămâi în limita zilnică a planului gratuit Resend (100 pe zi). Linkul din invitație este valabil conform setării Supabase pentru expirarea linkurilor, iar după expirare userul poate folosi „Am uitat parola”.</p>
        <div className="flex flex-wrap gap-2">
          <form action={sendNextInvitations}><input type="hidden" name="mode" value="first" /><button className={btn.primary} disabled={notSent === 0}>Trimite următoarele 30 ({notSent} rămase)</button></form>
          <form action={sendNextInvitations}><input type="hidden" name="mode" value="reminder" /><button className={btn.secondary} disabled={waiting === 0}>Trimite reminder (neacceptate de peste 3 zile)</button></form>
        </div>
      </Card>
    </div>
  );
}
