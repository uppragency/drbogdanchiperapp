import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, PageTitle, cn } from "@/components/ui";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Raport lunar" };

type Row = { id: string; title: string; viewers: number; completions: number };
type Stats = {
  members_total: number; members_new: number; active_members: number; active_days: number;
  resources_opened: number; completions: number; comments: number; commenters: number; published: number;
  top_resources: Row[]; top_commented: { id: string; title: string; n: number }[]; by_category: { name: string; viewers: number; completions: number }[];
};

const MONTHS = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
const key = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
const label = (k: string) => { const [y, m] = k.split("-").map(Number); return `${MONTHS[m - 1]} ${y}`; };
const shift = (k: string, n: number) => { const [y, m] = k.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return key(d.getUTCFullYear(), d.getUTCMonth() + 1); };
const nextStart = (k: string) => `${shift(k, 1)}-01`;

function Delta({ now, before }: { now: number; before: number }) {
  if (before === 0 && now === 0) return <span className="text-xs text-muted">fără schimbare</span>;
  if (before === 0) return <span className="text-xs text-muted">nou față de luna trecută</span>;
  const pct = Math.round(((now - before) / before) * 100);
  return <span className={cn("text-xs font-semibold", pct > 0 ? "text-ok" : pct < 0 ? "text-danger" : "text-muted")}>{pct > 0 ? "+" : ""}{pct}% față de luna trecută ({before})</span>;
}

export default async function MonthlyReport({ searchParams }: PageProps<"/admin/raport">) {
  const sp = await searchParams;
  const nowD = new Date();
  const current = key(nowD.getUTCFullYear(), nowD.getUTCMonth() + 1);
  const raw = typeof sp.luna === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.luna) ? sp.luna : current;
  const luna = raw > current ? current : raw;
  const supabase = await createClient();
  const [cur, prev] = await Promise.all([
    supabase.rpc("report_stats", { p_start: `${luna}-01`, p_end: nextStart(luna) }),
    supabase.rpc("report_stats", { p_start: `${shift(luna, -1)}-01`, p_end: `${luna}-01` }),
  ]);
  const s = cur.data as Stats | null;
  const p = prev.data as Stats | null;
  if (!s || !p) {
    return <div className="flex flex-col gap-6"><PageTitle title="Raport lunar" /><p className="text-sm text-muted">Nu am putut încărca raportul.</p></div>;
  }
  const activePct = s.members_total > 0 ? Math.round((s.active_members / s.members_total) * 100) : 0;
  const doneRate = s.resources_opened > 0 ? Math.round((s.completions / s.resources_opened) * 100) : 0;
  const tiles = [
    { label: "Membri activi în lună", value: s.active_members, sub: `${activePct}% din ${s.members_total} membri`, now: s.active_members, before: p.active_members },
    { label: "Zile active, total", value: s.active_days, sub: "zile în care cineva a intrat", now: s.active_days, before: p.active_days },
    { label: "Resurse deschise", value: s.resources_opened, sub: "membru și resursă, o dată pe lună", now: s.resources_opened, before: p.resources_opened },
    { label: "Finalizări", value: s.completions, sub: `${doneRate}% din resursele deschise`, now: s.completions, before: p.completions },
    { label: "Comentarii", value: s.comments, sub: `${s.commenters} membri au comentat`, now: s.comments, before: p.comments },
    { label: "Membri noi", value: s.members_new, sub: "conturi create în lună", now: s.members_new, before: p.members_new },
    { label: "Resurse publicate", value: s.published, sub: "conținut nou în lună", now: s.published, before: p.published },
  ];
  const months = Array.from({ length: 6 }, (_, i) => shift(current, -i));
  const isNow = luna === current;
  const chip = "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors print:hidden";
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={`Raport lunar: ${label(luna)}`}>
        <PrintButton />
      </PageTitle>
      <p className="max-w-[70ch] text-sm text-muted">
        Doar membri, fără echipă. {isNow ? "Luna este în curs, cifrele sunt până azi. " : ""}Ora României. Datele vin din activitatea reală din platformă.
      </p>
      <nav aria-label="Alege luna" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 print:hidden">
        {months.map((m) => (
          <Link key={m} href={`/admin/raport?luna=${m}`} aria-current={m === luna ? "page" : undefined} className={cn(chip, "shrink-0 whitespace-nowrap", m === luna ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:bg-surface2 hover:text-ink")}>{label(m)}</Link>
        ))}
      </nav>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="flex flex-col gap-1 rounded-card border border-line bg-surface px-5 py-5">
            <dd className="text-3xl font-bold leading-none">{t.value}</dd>
            <dt className="text-sm font-semibold">{t.label}</dt>
            <span className="text-xs text-muted">{t.sub}</span>
            <Delta now={t.now} before={t.before} />
          </div>
        ))}
      </dl>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <Card className="md:p-6">
          <h2 className="mb-4 text-lg font-bold">Resurse populare</h2>
          {s.top_resources.length === 0 ? <p className="text-sm text-muted">Nicio activitate în această lună.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-muted"><th className="pb-2 font-semibold">Resursă</th><th className="pb-2 text-right font-semibold">Membri</th><th className="pb-2 text-right font-semibold">Finalizări</th></tr></thead>
              <tbody className="divide-y divide-line">
                {s.top_resources.map((r) => (
                  <tr key={r.id}><td className="py-2 pr-3 font-semibold">{r.title}</td><td className="py-2 text-right tabular-nums">{r.viewers}</td><td className="py-2 text-right tabular-nums">{r.completions}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <div className="flex flex-col gap-6">
          <Card className="md:p-6">
            <h2 className="mb-4 text-lg font-bold">Pe categorii</h2>
            {s.by_category.length === 0 ? <p className="text-sm text-muted">Nicio activitate în această lună.</p> : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wider text-muted"><th className="pb-2 font-semibold">Categorie</th><th className="pb-2 text-right font-semibold">Deschideri</th><th className="pb-2 text-right font-semibold">Finalizări</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {s.by_category.map((c) => (
                    <tr key={c.name}><td className="py-2 pr-3 font-semibold">{c.name}</td><td className="py-2 text-right tabular-nums">{c.viewers}</td><td className="py-2 text-right tabular-nums">{c.completions}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Card className="md:p-6">
            <h2 className="mb-4 text-lg font-bold">Cele mai comentate</h2>
            {s.top_commented.length === 0 ? <p className="text-sm text-muted">Niciun comentariu în această lună.</p> : (
              <ul className="divide-y divide-line text-sm">
                {s.top_commented.map((r) => <li key={r.id} className="flex items-center justify-between gap-3 py-2"><span className="font-semibold">{r.title}</span><span className="tabular-nums text-muted">{r.n}</span></li>)}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
