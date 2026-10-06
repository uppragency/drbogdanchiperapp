import type { Metadata } from "next";
import { LinkifiedText } from "@/components/linkified-text";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLocale, getTx, pick } from "@/lib/i18n";
import { EVENT_COLUMNS, eventImage, eventType, eventWhen, isNewEvent, isUpcoming, mentorLines, placeLabel, type EventRow } from "@/lib/events";
import { Badge } from "@/components/ui";
import { ArrowUpRight, CalendarBlank, CalendarPlus, CaretLeft, MapPin } from "@phosphor-icons/react/dist/ssr";

async function load(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select(EVENT_COLUMNS).eq("slug", slug).maybeSingle();
  return data as EventRow | null;
}

export async function generateMetadata({ params }: PageProps<"/eveniment/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [e, locale] = await Promise.all([load(slug), getLocale()]);
  if (!e) return {};
  return { title: pick(locale, e.title, e.title_en), description: pick(locale, e.short_description, e.short_description_en).slice(0, 160) };
}

export default async function EventPage({ params }: PageProps<"/eveniment/[slug]">) {
  await requireUser();
  const { slug } = await params;
  const [e, tx, locale] = await Promise.all([load(slug), getTx(), getLocale()]);
  if (!e || !e.is_published) notFound();
  const upcoming = isUpcoming(e);
  const t = eventType(e.type);
  const img = eventImage(e);
  const title = pick(locale, e.title, e.title_en);
  const paragraphs = pick(locale, e.description, e.description_en).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const mentors = mentorLines(e.mentors);
  const label = pick(locale, e.button_label, e.button_label_en) || tx("Înscrie-te", "Register");
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8 md:py-10">
      <Link href={`/evenimente/${e.type}`} className="inline-flex min-h-11 w-fit items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <CaretLeft size={16} aria-hidden /> {t ? tx(t.ro, t.en) : tx("Evenimente", "Events")}
      </Link>
      <section className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <div className="aspect-video overflow-hidden rounded-card border border-line bg-surface2 md:aspect-square">
          {img && (
            // eslint-disable-next-line @next/next/no-img-element -- external or storage image
            <img src={img} alt={title} referrerPolicy="no-referrer" className="size-full object-cover" />
          )}
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {t && <Badge>{tx(t.ro, t.en)}</Badge>}
            {isNewEvent(e) && <Badge tone="accent">{tx("Nou", "New")}</Badge>}
            <Badge tone={upcoming ? "ok" : "neutral"}>{upcoming ? tx("Gratuit", "Free") : tx("Încheiat", "Ended")}</Badge>
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">{title}</h1>
          <p className="max-w-[60ch] leading-relaxed text-muted">{pick(locale, e.short_description, e.short_description_en)}</p>
          <ul className="flex flex-col gap-2 text-base">
            <li className="flex items-center gap-2 font-semibold"><CalendarBlank size={20} aria-hidden />{eventWhen(e, locale)}</li>
            <li className="flex items-center gap-2"><MapPin size={20} aria-hidden />{placeLabel(e, locale === "en")}</li>
          </ul>
          {upcoming ? (
            <div className="flex flex-col gap-3">
              <a href={e.register_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-accent px-6 text-base font-semibold text-accent-ink transition-colors hover:bg-accent-hover active:scale-[0.98]">
                {label} <ArrowUpRight size={18} aria-hidden />
              </a>
              <a href={`/eveniment/${e.slug}/calendar`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-line bg-surface px-5 text-sm font-semibold transition-colors hover:bg-surface2">
                <CalendarPlus size={18} aria-hidden /> {tx("Adaugă în calendar", "Add to calendar")}
              </a>
              <p className="text-sm text-muted">{tx("Înscrierea se face pe drbogdanchiper.ro. Se deschide într-o pagină nouă.", "Registration takes place on drbogdanchiper.ro. Opens in a new tab.")}</p>
            </div>
          ) : (
            <p className="rounded-control bg-surface2 px-4 py-3 text-sm font-semibold">{tx("Evenimentul a avut loc.", "This event has taken place.")}</p>
          )}
        </div>
      </section>
      {(paragraphs.length > 0 || mentors.length > 0) && (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {paragraphs.length > 0 && (
            <section className="flex flex-col gap-3 lg:col-span-2">
              <h2 className="text-xl font-bold tracking-tight">{tx("Despre eveniment", "About the event")}</h2>
              {paragraphs.map((p, i) => <p key={i} className="max-w-[65ch] leading-relaxed text-muted [overflow-wrap:anywhere]"><LinkifiedText text={p} /></p>)}
            </section>
          )}
          {mentors.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-bold tracking-tight">{mentors.length > 1 ? tx("Mentori", "Mentors") : tx("Mentor", "Mentor")}</h2>
              <ul className="divide-y divide-line rounded-card border border-line bg-surface">
                {mentors.map((m, i) => <li key={i} className="px-4 py-3 font-semibold leading-snug">{m}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
