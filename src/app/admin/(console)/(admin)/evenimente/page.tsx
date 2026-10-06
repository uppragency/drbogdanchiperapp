import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, LinkButton, PageTitle } from "@/components/ui";
import { EVENT_COLUMNS, eventType, eventWhen, isUpcoming, type EventRow } from "@/lib/events";

export const metadata: Metadata = { title: "Evenimente" };

export default async function EventsAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select(EVENT_COLUMNS).order("starts_at", { ascending: false });
  const events = (data ?? []) as EventRow[];
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Evenimente">
        <LinkButton href="/admin/evenimente/nou">Eveniment nou</LinkButton>
      </PageTitle>
      {events.length === 0 && <p className="text-sm text-muted">Niciun eveniment încă.</p>}
      <div className="flex flex-col gap-3">
        {events.map((e) => (
          <Card key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5">
            <div className="flex min-w-0 flex-col gap-1">
              <Link href={`/admin/evenimente/${e.id}`} className="font-semibold hover:underline">{e.title}</Link>
              <p className="text-sm text-muted">{eventType(e.type)?.ro}. {eventWhen(e)}.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={isUpcoming(e) ? "info" : "neutral"}>{isUpcoming(e) ? "Viitor" : "Anterior"}</Badge>
              <Badge tone={e.is_published ? "ok" : "neutral"}>{e.is_published ? "Publicat" : "Ciornă"}</Badge>
              <LinkButton href={`/admin/evenimente/${e.id}`} variant="secondary">Editează</LinkButton>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
