import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLocale, getTx } from "@/lib/i18n";
import { EVENT_COLUMNS, eventType, type EventRow } from "@/lib/events";
import { EmptyState } from "@/components/ui";
import { CalendarBlank, CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { EventCard, PastEvents } from "../event-card";

export async function generateMetadata({ params }: PageProps<"/evenimente/[tip]">): Promise<Metadata> {
  const [{ tip }, tx] = await Promise.all([params, getTx()]);
  const t = eventType(tip);
  return t ? { title: tx(t.ro, t.en), description: tx(t.descRo, t.descEn).slice(0, 160) } : {};
}

export default async function EventTypePage({ params }: PageProps<"/evenimente/[tip]">) {
  await requireUser();
  const { tip } = await params;
  const t = eventType(tip);
  if (!t) notFound();
  const [tx, locale] = await Promise.all([getTx(), getLocale()]);
  const supabase = await createClient();
  const now = new Date().toISOString();
  const [up, past] = await Promise.all([
    supabase.from("events").select(EVENT_COLUMNS).eq("is_published", true).eq("type", t.key).gt("starts_at", now).order("starts_at"),
    supabase.from("events").select(EVENT_COLUMNS).eq("is_published", true).eq("type", t.key).lte("starts_at", now).order("starts_at", { ascending: false }).limit(20),
  ]);
  const upcoming = (up.data ?? []) as EventRow[];
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
      <Link href="/evenimente" className="inline-flex min-h-11 w-fit items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <CaretLeft size={16} aria-hidden /> {tx("Toate evenimentele", "All events")}
      </Link>
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tx(t.ro, t.en)}</h1>
        <p className="text-lg font-semibold">{tx(t.tagRo, t.tagEn)}</p>
        <p className="max-w-[65ch] leading-relaxed text-muted">{tx(t.descRo, t.descEn)}</p>
      </header>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight">{tx("Următoarele evenimente", "Upcoming events")}</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarBlank} title={tx("Niciun eveniment programat acum", "No event scheduled right now")} text={tx("Când anunțăm unul, apare aici.", "When we announce one, it appears here.")} />
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{upcoming.map((e) => <EventCard key={e.id} e={e} tx={tx} locale={locale} />)}</ul>
        )}
      </section>
      <PastEvents events={(past.data ?? []) as EventRow[]} tx={tx} locale={locale} />
    </div>
  );
}
