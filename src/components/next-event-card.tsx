import Link from "next/link";
import { ArrowUpRight, CalendarBlank, MapPin } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getLocale, getTx, pick } from "@/lib/i18n";
import { EVENT_COLUMNS, eventImage, placeLabel, type EventRow } from "@/lib/events";
import { formatDate } from "@/lib/format";

const day = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });

// Next upcoming MentorMed event (for example the SuperBootcamp), shown at the top of the sidebar.
export async function NextEventCard() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("is_published", true)
    .eq("type", "mentormed")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const e = data as EventRow;
  const [tx, locale] = await Promise.all([getTx(), getLocale()]);
  const img = eventImage(e);
  const multi = e.ends_at && day(e.ends_at) !== day(e.starts_at);
  const when = multi ? `${formatDate(e.starts_at, locale)} – ${formatDate(e.ends_at!, locale)}` : formatDate(e.starts_at, locale);
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {img && (
        <Link href={`/eveniment/${e.slug}`} className="block aspect-video bg-surface2" tabIndex={-1} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- external or storage image */}
          <img src={img} alt="" referrerPolicy="no-referrer" loading="lazy" className="size-full object-cover" />
        </Link>
      )}
      <div className="flex flex-col gap-3 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted">{tx("Următorul eveniment", "Next event")}</h3>
        <Link href={`/eveniment/${e.slug}`} className="text-lg font-bold leading-snug hover:text-accent">{pick(locale, e.title, e.title_en)}</Link>
        <div className="flex flex-col gap-1 text-sm">
          <span className="flex items-center gap-2 font-semibold"><CalendarBlank size={16} aria-hidden />{when}</span>
          <span className="flex items-center gap-2 text-muted"><MapPin size={16} aria-hidden />{placeLabel(e, locale === "en")}</span>
        </div>
        <a href={e.register_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-violet px-5 text-sm font-semibold text-on-violet transition-colors hover:bg-violet-hover active:scale-[0.98]">
          {pick(locale, e.button_label, e.button_label_en) || tx("Detalii și înscriere", "Details and registration")} <ArrowUpRight size={16} weight="bold" />
        </a>
      </div>
    </div>
  );
}
