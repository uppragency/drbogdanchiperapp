import type { Metadata } from "next";
import Link from "next/link";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { getLocale, getTx, pick } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTx())("Calendar", "Calendar") };
}

export default async function CalendarPage() {
  await requireUser();
  const tx = await getTx();
  const locale = await getLocale();
  const month = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ro-RO", { month: "long", year: "numeric", timeZone: "Europe/Bucharest" });
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data } = await supabase.from("resources").select("id,title,title_en,event_at,categories(name,name_en)").not("event_at", "is", null).gte("event_at", nowIso).eq("status", "published").is("deleted_at", null).order("event_at").limit(100);
  type Cat = { name: string; name_en: string | null };
  type R = { id: string; title: string; title_en: string | null; event_at: string; categories: Cat | Cat[] | null };
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
                    <span className="font-bold">{pick(locale, r.title, r.title_en)}</span>
                    <span className="text-sm text-muted">{formatDateTime(r.event_at, locale)} · {(() => { const c = Array.isArray(r.categories) ? r.categories[0] : r.categories; return c ? pick(locale, c.name, c.name_en) : ""; })()}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {rows.length === 0 && <p className="rounded-card border border-dashed border-line p-10 text-center text-muted">{tx("Nu există evenimente programate.", "There are no scheduled events.")}</p>}
    </div>
  );
}
