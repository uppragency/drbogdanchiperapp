import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Statistici" };

export default async function StatsPage() {
  const supabase = await createClient();
  const now = Date.now();
  const d7 = new Date(now - 7 * 86400000).toISOString();
  const d30 = new Date(now - 30 * 86400000).toISOString();
  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
  const members = () => supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user").is("deleted_at", null);

  const [total, active, loggedIn, active7, active30, invSent, invAccepted, comments30, pendingReq, { data: viewRows }, { data: resources }, { data: cats }] = await Promise.all([
    count(members()),
    count(members().eq("is_active", true)),
    count(members().not("last_login_at", "is", null)),
    count(members().gte("last_login_at", d7)),
    count(members().gte("last_login_at", d30)),
    count(supabase.from("invitations").select("id", { count: "exact", head: true }).not("sent_at", "is", null)),
    count(supabase.from("invitations").select("id", { count: "exact", head: true }).not("accepted_at", "is", null)),
    count(supabase.from("comments").select("id", { count: "exact", head: true }).gte("created_at", d30)),
    count(supabase.from("access_requests").select("id", { count: "exact", head: true }).eq("status", "pending")),
    supabase.rpc("resource_view_counts"),
    supabase.from("resources").select("id,title,category_id,type").eq("status", "published").is("deleted_at", null).limit(1000),
    supabase.from("categories").select("id,name").order("position"),
  ]);

  const views = new Map(((viewRows ?? []) as { resource_id: string; views: number }[]).map((v) => [v.resource_id, Number(v.views)]));
  const res = (resources ?? []) as { id: string; title: string; category_id: string; type: string }[];
  const ranked = [...res].sort((a, b) => (views.get(b.id) ?? 0) - (views.get(a.id) ?? 0));
  const top = ranked.filter((r) => (views.get(r.id) ?? 0) > 0).slice(0, 10);
  const unseen = res.filter((r) => !views.get(r.id));
  const byCat = (cats ?? []).map((c: { id: string; name: string }) => ({ name: c.name, views: res.filter((r) => r.category_id === c.id).reduce((s, r) => s + (views.get(r.id) ?? 0), 0) })).sort((a, b) => b.views - a.views);
  const maxCat = Math.max(1, ...byCat.map((c) => c.views));
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "0%");

  const cards = [
    { label: "Membri activi", value: active, note: `din ${total}` },
    { label: "S-au logat cel puțin o dată", value: pct(loggedIn, total), note: `${loggedIn} membri` },
    { label: "Activi în ultimele 7 zile", value: active7, note: pct(active7, total) },
    { label: "Activi în ultimele 30 de zile", value: active30, note: pct(active30, total) },
    { label: "Invitații acceptate", value: pct(invAccepted, invSent), note: `${invAccepted} din ${invSent} trimise` },
    { label: "Comentarii în 30 de zile", value: comments30, note: pendingReq ? `${pendingReq} cereri de acces în așteptare` : "" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageTitle title="Statistici" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-card border border-line bg-surface p-5">
            <p className="text-3xl font-bold tracking-tight">{c.value}</p>
            <p className="mt-1 text-sm font-semibold">{c.label}</p>
            {c.note && <p className="text-sm text-muted">{c.note}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Cele mai deschise resurse</h2>
          <ol className="divide-y divide-line">
            {top.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <span className="w-6 text-sm font-bold text-muted">{i + 1}</span>
                <Link href={`/admin/resurse/${r.id}`} className="min-w-0 flex-1 truncate font-semibold hover:text-accent">{r.title}</Link>
                <span className="text-sm text-muted">{views.get(r.id)} deschideri</span>
              </li>
            ))}
            {top.length === 0 && <li className="py-3 text-sm text-muted">Nicio resursă deschisă de membri încă. Vizualizările adminului nu se numără.</li>}
          </ol>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Deschideri pe categorie</h2>
          <ul className="flex flex-col gap-3">
            {byCat.map((c) => (
              <li key={c.name} className="flex flex-col gap-1">
                <span className="flex justify-between text-sm"><span className="font-semibold">{c.name}</span><span className="text-muted">{c.views}</span></span>
                <span className="h-2 overflow-hidden rounded-full bg-surface2"><span className="block h-full rounded-full bg-accent" style={{ width: `${(c.views / maxCat) * 100}%` }} /></span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Resurse publicate pe care nu le-a deschis niciun membru ({unseen.length})</h2>
        <ul className="divide-y divide-line">
          {unseen.slice(0, 15).map((r) => (
            <li key={r.id} className="py-3"><Link href={`/admin/resurse/${r.id}`} className="font-semibold hover:text-accent">{r.title}</Link></li>
          ))}
          {unseen.length === 0 && <li className="py-3 text-sm text-muted">Toate resursele au fost deschise.</li>}
        </ul>
        {unseen.length > 15 && <p className="text-sm text-muted">Se afișează primele 15.</p>}
      </Card>
    </div>
  );
}
