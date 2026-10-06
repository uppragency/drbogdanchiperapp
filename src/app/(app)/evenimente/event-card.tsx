import Link from "next/link";
import { Badge } from "@/components/ui";
import { CalendarBlank, MapPin } from "@phosphor-icons/react/dist/ssr";
import { eventImage, eventType, eventWhen, isNewEvent, placeLabel, type EventRow } from "@/lib/events";
import { pick, type Locale, type Tx } from "@/lib/i18n";

export function EventCard({ e, tx, locale }: { e: EventRow; tx: Tx; locale: Locale }) {
  const img = eventImage(e);
  const t = eventType(e.type);
  return (
    <li>
      <Link href={`/eveniment/${e.slug}`} className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-accent">
        <div className="relative aspect-video bg-surface2">
          {img && (
            // eslint-disable-next-line @next/next/no-img-element -- external or storage image
            <img src={img} alt="" referrerPolicy="no-referrer" loading="lazy" className="size-full object-cover" />
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge>{t ? tx(t.ro, t.en) : ""}</Badge>
            {isNewEvent(e) && <Badge tone="accent">{tx("Nou", "New")}</Badge>}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="text-lg font-bold leading-snug">{pick(locale, e.title, e.title_en)}</h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-muted">{pick(locale, e.short_description, e.short_description_en)}</p>
          <div className="mt-auto flex flex-col gap-1 pt-2 text-sm">
            <span className="flex items-center gap-2 font-semibold"><CalendarBlank size={16} aria-hidden />{eventWhen(e, locale)}</span>
            <span className="flex items-center gap-2 text-muted"><MapPin size={16} aria-hidden />{placeLabel(e, locale === "en")}</span>
            <span className="font-semibold text-accent">{tx("Gratuit", "Free")}</span>
          </div>
        </div>
      </Link>
    </li>
  );
}

export function PastEvents({ events, tx, locale }: { events: EventRow[]; tx: Tx; locale: Locale }) {
  if (events.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{tx("Evenimente anterioare", "Past events")}</h2>
      <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
        {events.map((e) => (
          <li key={e.id}>
            <Link href={`/eveniment/${e.slug}`} className="flex flex-col gap-0.5 p-4 transition-colors hover:bg-surface2 md:flex-row md:items-center md:justify-between md:gap-4">
              <span className="font-semibold">{pick(locale, e.title, e.title_en)}</span>
              <span className="text-sm text-muted">{eventWhen(e, locale)}, {placeLabel(e, locale === "en")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
