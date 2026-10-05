import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, PageTitle, btn } from "@/components/ui";
import { activatePoll, deletePoll, stopPoll } from "./actions";
import { PollForm } from "./poll-form";

export const metadata: Metadata = { title: "Sondaje" };

type Poll = { id: string; question: string; is_active: boolean; created_at: string };
type Option = { id: string; poll_id: string; label: string; position: number };

export default async function PollsAdmin() {
  const supabase = await createClient();
  const [{ data: polls }, { data: options }] = await Promise.all([
    supabase.from("polls").select("id,question,is_active,created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("poll_options").select("id,poll_id,label,position").order("position"),
  ]);
  const list = (polls ?? []) as Poll[];
  const results = await Promise.all(list.map((p) => supabase.rpc("poll_results", { p_poll: p.id })));
  const votes = new Map<string, number>();
  results.forEach((r) => ((r.data ?? []) as { option_id: string; votes: number | string }[]).forEach((v) => votes.set(v.option_id, Number(v.votes))));

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Sondaje" />
      <p className="max-w-[65ch] text-muted">Un singur sondaj poate fi activ. Activarea unui sondaj îl oprește pe cel curent.</p>
      <Card><PollForm /></Card>
      <ul className="flex flex-col gap-3">
        {list.map((p) => {
          const opts = ((options ?? []) as Option[]).filter((o) => o.poll_id === p.id);
          const total = opts.reduce((n, o) => n + (votes.get(o.id) ?? 0), 0);
          return (
            <li key={p.id}>
              <Card className="flex flex-col gap-4 p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{p.question}</span>
                    <span className="text-sm text-muted">{total} voturi</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={p.is_active ? "ok" : "neutral"}>{p.is_active ? "Activ" : "Inactiv"}</Badge>
                    {p.is_active ? (
                      <form action={stopPoll}><input type="hidden" name="id" value={p.id} /><button className={btn.secondary}>Oprește</button></form>
                    ) : (
                      <form action={activatePoll}><input type="hidden" name="id" value={p.id} /><button className={btn.secondary}>Activează</button></form>
                    )}
                    <form action={deletePoll}><input type="hidden" name="id" value={p.id} /><button className={btn.danger}>Șterge</button></form>
                  </div>
                </div>
                <ul className="flex flex-col gap-2">
                  {opts.map((o) => {
                    const n = votes.get(o.id) ?? 0;
                    const pct = total ? Math.round((n / total) * 100) : 0;
                    return (
                      <li key={o.id} className="flex flex-col gap-1">
                        <div className="flex justify-between gap-3 text-sm"><span>{o.label}</span><span className="text-muted">{n} ({pct}%)</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface2"><div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </li>
          );
        })}
        {list.length === 0 && <li className="rounded-card border border-line bg-surface p-6 text-sm text-muted">Niciun sondaj.</li>}
      </ul>
    </div>
  );
}
