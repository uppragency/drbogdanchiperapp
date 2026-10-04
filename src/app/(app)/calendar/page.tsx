import type { Metadata } from "next";
import Link from "next/link";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Calendar" };

const month = new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric", timeZone: "Europe/Bucharest" });

export default async function CalendarPage() {
  await requireUser();
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data } = await supabase.from("resources").select("id,title,event_at,categories(name)").not("event_at", "is", null).gte("event_at", nowIso).eq("status", "published").is("deleted_at", null).order("event_at").limit(100);
  type R = { id: string; title: string; event_at: string; categories: { name: string } | { name: string }[] | null };
  const rows = (data ?? []) as R[];
  const groups = new Map<string, R[]>();
  rows.forEach((r) => {
    const k = month.format(new Date(r.event_at));
    groups.set(k, [...(groups.get(k) ?? []), r]);
  });
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Calendar</h1>
      {Array.from(groups.entries()).map(([m, list]) => (
        <section key={m} className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{m}</h2>
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {list.map((r) => (
              <li key={r.id}>
                <Link href={`/resurse/${r.id}`} className="flex items-center gap-4 p-5 hover:bg-surface2">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet"><CalendarBlank size={22} /></span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-bold">{r.title}</span>
                    <span className="text-sm text-muted">{formatDateTime(r.event_at)} · {(Array.isArray(r.categories) ? r.categories[0] : r.categories)?.name}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {rows.length === 0 && <p className="rounded-card border border-dashed border-line p-10 text-center text-muted">Nu există evenimente programate.</p>}
    </div>
  );
}
