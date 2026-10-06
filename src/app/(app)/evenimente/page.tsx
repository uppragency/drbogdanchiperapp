import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLocale, getTx } from "@/lib/i18n";
import { EVENT_COLUMNS, EVENT_TYPES, type EventRow } from "@/lib/events";
import { EmptyState } from "@/components/ui";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import { EventCard, PastEvents } from "./event-card";

export async function generateMetadata(): Promise<Metadata> {
  const tx = await getTx();
  return { title: tx("Evenimente", "Events"), description: tx("StudyClub, BookClub și evenimentele MentorMed: următoarele întâlniri și cele anterioare.", "StudyClub, BookClub and MentorMed events: upcoming and past meetings.") };
}

export default async function EventsPage() {
  await requireUser();
  const [tx, locale] = await Promise.all([getTx(), getLocale()]);
  const supabase = await createClient();
  const now = new Date().toISOString();
  const [up, past] = await Promise.all([
    supabase.from("events").select(EVENT_COLUMNS).eq("is_published", true).gt("starts_at", now).order("starts_at"),
    supabase.from("events").select(EVENT_COLUMNS).eq("is_published", true).lte("starts_at", now).order("starts_at", { ascending: false }).limit(20),
  ]);
  const upcoming = (up.data ?? []) as EventRow[];
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tx("Evenimente", "Events")}</h1>
        <p className="max-w-[60ch] text-muted">{tx("Întâlniri gratuite pentru membrii MentorMed. Înscrierea se face pe site-ul principal.", "Free meetings for MentorMed members. Registration takes place on the main site.")}</p>
      </header>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {EVENT_TYPES.map((t) => (
          <li key={t.key}>
            <Link href={`/evenimente/${t.key}`} className="flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-5 transition-colors hover:border-accent">
              <span className="text-lg font-bold">{tx(t.ro, t.en)}</span>
              <span className="text-sm leading-relaxed text-muted">{tx(t.tagRo, t.tagEn)}</span>
            </Link>
          </li>
        ))}
      </ul>
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
