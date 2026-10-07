import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageTitle } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { DownloadSimple, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { CountUp } from "@/components/count-up";
import { createAdminClient } from "@/lib/supabase/admin";
import { OnlineNow } from "./online-now";
import type { OnlineUser } from "./actions";

export const metadata: Metadata = { title: "Statistici" };

type TopUser = { user_id: string; first_name: string; last_name: string; email: string; groups: string; opened: number; completed: number; comments: number; score: number; last_login_at: string | null };
type Activation = { total: number; sent: number; accepted: number; opened: number; completed: number };
const PERIODS = [
  { key: "7", label: "7 zile", days: 7 },
  { key: "30", label: "30 de zile", days: 30 },
  { key: "tot", label: "Tot timpul", days: null },
] as const;
const shortDay = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short" });

export default async function StatsPage({ searchParams }: PageProps<"/admin/statistici">) {
  const sp = await searchParams;
  const period = PERIODS.find((p) => p.key === sp.perioada) ?? PERIODS[1];
  const supabase = await createClient();
  const now = new Date().getTime();
  const d7 = new Date(now - 7 * 86400000).toISOString();
  const d30 = new Date(now - 30 * 86400000).toISOString();
  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
  const members = () => supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user").is("deleted_at", null);

  const [total, active, loggedIn, active7, active30, invSent, invAccepted, comments30, pendingReq, { data: viewRows }, { data: resources }, { data: cats }, { data: inactive, count: inactiveCount }] = await Promise.all([
    count(members()),
    count(members().eq("is_active", true)),
    count(members().not("last_login_at", "is", null)),
    count(members().gte("last_login_at", d7)),
    count(members().gte("last_login_at", d30)),
    count(supabase.from("invitations").select("id", { count: "exact", head: true }).not("sent_at", "is", null)),
    count(supabase.from("invitations").select("id", { count: "exact", head: true }).not("accepted_at", "is", null)),
    count(supabase.from("comments").select("id", { count: "exact", head: true }).gte("created_at", d30)),
    count(supabase.from("access_requests").select("id", { count: "exact", head: true }).eq("status", "pending")),
    createAdminClient().rpc("resource_view_stats"),
    supabase.from("resources").select("id,title,category_id,type").eq("status", "published").is("deleted_at", null).limit(1000),
    supabase.from("categories").select("id,name").order("position"),
    supabase.from("profiles").select("id,email,first_name,last_name,last_login_at", { count: "exact" }).eq("role", "user").eq("is_active", true).is("deleted_at", null).or(`last_login_at.is.null,last_login_at.lt.${d30}`).order("last_login_at", { ascending: true, nullsFirst: true }).limit(15),
  ]);

  type ViewStat = { resource_id: string; unique_viewers: number; repeat_viewers: number; total_views: number };
  const stats = new Map(((viewRows ?? []) as ViewStat[]).map((v) => [v.resource_id, v]));
  const views = new Map([...stats].map(([id, v]) => [id, Number(v.total_views)]));
  const res = (resources ?? []) as { id: string; title: string; category_id: string; type: string }[];
  const ranked = [...res].sort((a, b) => (views.get(b.id) ?? 0) - (views.get(a.id) ?? 0));
  const top = ranked.filter((r) => (views.get(r.id) ?? 0) > 0).slice(0, 10);
  const unseen = res.filter((r) => !views.get(r.id));
  const byCat = (cats ?? []).map((c: { id: string; name: string }) => ({ name: c.name, views: res.filter((r) => r.category_id === c.id).reduce((s, r) => s + (views.get(r.id) ?? 0), 0) })).sort((a, b) => b.views - a.views);
  const maxCat = Math.max(1, ...byCat.map((c) => c.views));
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "0%");

  const [{ data: onlineRaw }, { data: topRaw }, { data: dailyRaw }, { data: weeklyRaw }, { data: actRaw }] = await Promise.all([
    supabase.rpc("admin_online_now", { p_minutes: 15 }),
    supabase.rpc("admin_top_users", { p_days: period.days, p_limit: 10 }),
    supabase.rpc("admin_daily_active", { p_days: 30 }),
    supabase.rpc("admin_weekly_retention", { p_weeks: 8 }),
    supabase.rpc("admin_activation"),
  ]);
  const online = (onlineRaw ?? []) as OnlineUser[];
  const topUsers = (topRaw ?? []) as TopUser[];
  const daily = ((dailyRaw ?? []) as { day: string; active: number }[]).map((d) => ({ day: d.day, active: Number(d.active) }));
  const maxDaily = Math.max(1, ...daily.map((d) => d.active));
  const weekly = ((weeklyRaw ?? []) as { week_start: string; new_users: number; returning_users: number }[]).map((w) => ({ week: w.week_start, fresh: Number(w.new_users), back: Number(w.returning_users) }));
  const maxWeekly = Math.max(1, ...weekly.map((w) => w.fresh + w.back));
  const act = ((actRaw ?? []) as Activation[])[0];
  const funnel = act
    ? [
        { label: "Invitații create", value: Number(act.total) },
        { label: "Trimise", value: Number(act.sent) },
        { label: "Acceptate", value: Number(act.accepted) },
        { label: "Au deschis cel puțin o resursă", value: Number(act.opened) },
        { label: "Au terminat cel puțin o resursă", value: Number(act.completed) },
      ]
    : [];
  const funnelMax = Math.max(1, ...funnel.map((f) => f.value));

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
            <p className="text-3xl font-bold tracking-tight">{typeof c.value === "number" ? <CountUp value={c.value} /> : c.value}</p>
            <p className="mt-1 text-sm font-semibold">{c.label}</p>
            {c.note && <p className="text-sm text-muted">{c.note}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OnlineNow initial={online} />

        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Cei mai activi useri</h2>
            <nav aria-label="Perioadă" className="flex gap-1">
              {PERIODS.map((p) => (
                <Link key={p.key} href={p.key === "30" ? "/admin/statistici" : `/admin/statistici?perioada=${p.key}`} aria-current={p.key === period.key ? "true" : undefined} className={`inline-flex min-h-9 items-center rounded-full px-3 text-sm font-semibold ${p.key === period.key ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface2"}`}>{p.label}</Link>
              ))}
            </nav>
          </div>
          <ol className="divide-y divide-line">
            {topUsers.map((u, i) => (
              <li key={u.user_id} className="flex items-center gap-3 py-3">
                <span className="w-6 text-sm font-bold text-muted">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <Link href={`/admin/useri/${u.user_id}`} className="block truncate font-semibold hover:text-accent">{`${u.first_name} ${u.last_name}`.trim() || u.email}</Link>
                  <span className="block truncate text-xs text-muted">{u.groups || "fără grupă"}{u.last_login_at ? ` · ultima intrare ${formatDate(u.last_login_at)}` : ""}</span>
                </span>
                <span className="text-right text-sm text-muted">{u.opened} deschise, {u.completed} terminate, {u.comments} comentarii</span>
              </li>
            ))}
            {topUsers.length === 0 && <li className="py-3 text-sm text-muted">Nicio activitate a membrilor în această perioadă. Conturile echipei nu se numără. Scorul este deschise plus terminate plus comentarii.</li>}
          </ol>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Activare</h2>
          <ul className="flex flex-col gap-3">
            {funnel.map((f, i) => (
              <li key={f.label} className="flex flex-col gap-1">
                <span className="flex justify-between gap-3 text-sm"><span className="font-semibold">{f.label}</span><span className="text-muted">{f.value}{i > 0 && funnel[i - 1].value ? ` (${pct(f.value, funnel[i - 1].value)} din pasul anterior)` : ""}</span></span>
                <span className="h-2 overflow-hidden rounded-full bg-surface2"><span className="block h-full rounded-full bg-accent" style={{ width: `${(f.value / funnelMax) * 100}%` }} /></span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">„Au deschis” și „au terminat” numără membrii cu cont, indiferent de data invitației.</p>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Activi pe zi, ultimele 30 de zile</h2>
          <div className="flex h-40 items-end gap-0.5" role="img" aria-label={`Membri activi pe zi, maximum ${maxDaily}`}>
            {daily.map((d) => (
              <div key={d.day} title={`${shortDay.format(new Date(d.day))}: ${d.active}`} className="flex h-full flex-1 items-end">
                <div className="w-full rounded-t-sm bg-accent" style={{ height: `${Math.max(d.active ? 4 : 1, (d.active / maxDaily) * 100)}%`, opacity: d.active ? 1 : 0.25 }} />
              </div>
            ))}
          </div>
          <p className="flex justify-between text-xs text-muted"><span>{daily[0] ? shortDay.format(new Date(daily[0].day)) : ""}</span><span>Maximum {maxDaily} pe zi</span><span>{daily.length ? shortDay.format(new Date(daily[daily.length - 1].day)) : ""}</span></p>
          <p className="text-sm text-muted">Un membru e activ într-o zi dacă a deschis cel puțin o resursă.</p>
        </Card>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Noi vs reveniți, pe săptămână</h2>
          <span className="flex gap-4 text-sm text-muted"><span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-accent" /> Noi (prima activitate)</span><span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-violet" /> Reveniți</span></span>
        </div>
        <div className="flex h-40 items-end gap-2" role="img" aria-label="Membri activi pe săptămână, noi și reveniți">
          {weekly.map((w) => (
            <div key={w.week} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`Săptămâna din ${shortDay.format(new Date(w.week))}: ${w.fresh} noi, ${w.back} reveniți`}>
              <span className="text-xs font-semibold">{w.fresh + w.back}</span>
              <div className="flex w-full flex-col justify-end overflow-hidden rounded-t-sm" style={{ height: `${((w.fresh + w.back) / maxWeekly) * 78}%` }}>
                <div className="bg-violet" style={{ flex: w.back }} />
                <div className="bg-accent" style={{ flex: w.fresh }} />
              </div>
              <span className="text-xs text-muted">{shortDay.format(new Date(w.week))}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted">„Nou” înseamnă prima săptămână în care a deschis o resursă, „revenit” înseamnă că a mai fost activ într-o săptămână anterioară. Săptămânile încep luni. Cifrele sunt mici la început și devin utile după câteva săptămâni.</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Cele mai deschise resurse</h2>
          <ol className="divide-y divide-line">
            {top.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <span className="w-6 text-sm font-bold text-muted">{i + 1}</span>
                <Link href={`/admin/resurse/${r.id}`} className="min-w-0 flex-1 truncate font-semibold hover:text-accent">{r.title}</Link>
                <span className="text-right text-sm text-muted">{stats.get(r.id)?.unique_viewers} unici, {stats.get(r.id)?.repeat_viewers} revin</span>
              </li>
            ))}
            {top.length === 0 && <li className="py-3 text-sm text-muted">Nicio resursă deschisă de membri încă. Vizualizările adminului nu se numără. „Unici” sunt membrii care au deschis resursa, „revin” cei care au deschis-o de mai multe ori.</li>}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Membri inactivi de peste 30 de zile ({inactiveCount ?? 0})</h2>
          {(inactiveCount ?? 0) > 0 && (
            <a href="/admin/statistici/inactivi" className="inline-flex h-11 items-center gap-2 rounded-control border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface2">
              <DownloadSimple size={18} /> Descarcă CSV
            </a>
          )}
        </div>
        {(inactive ?? []).length === 0 ? (
          <EmptyState icon={UsersThree} title="Toți membrii activi s-au logat în ultimele 30 de zile" />
        ) : (
          <ul className="divide-y divide-line">
            {(inactive ?? []).map((m: { id: string; email: string; first_name: string; last_name: string; last_login_at: string | null }) => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                <Link href={`/admin/useri/${m.id}`} className="min-w-0 flex-1 truncate font-semibold hover:text-accent">{`${m.first_name} ${m.last_name}`.trim() || m.email}</Link>
                <span className="text-sm text-muted">{m.last_login_at ? `Ultima autentificare ${formatDate(m.last_login_at)}` : "Nu s-a autentificat niciodată"}</span>
              </li>
            ))}
          </ul>
        )}
        {(inactiveCount ?? 0) > 15 && <p className="text-sm text-muted">Se afișează primii 15. CSV-ul conține lista completă.</p>}
      </Card>

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
