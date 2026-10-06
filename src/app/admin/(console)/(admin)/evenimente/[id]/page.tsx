import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { Alert, Card, PageTitle, btn } from "@/components/ui";
import { EVENT_COLUMNS, type EventRow } from "@/lib/events";
import { EventForm } from "../event-form";
import { EventCoverUpload } from "../cover-upload";
import { deleteEvent } from "../actions";

export const metadata: Metadata = { title: "Eveniment" };

export default async function EditEvent({ params, searchParams }: PageProps<"/admin/evenimente/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  let event: EventRow | null = null;
  if (id !== "nou") {
    if (!z.string().uuid().safeParse(id).success) notFound();
    const supabase = await createClient();
    const { data } = await supabase.from("events").select(EVENT_COLUMNS).eq("id", id).maybeSingle();
    if (!data) notFound();
    event = data as EventRow;
  }
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/evenimente" className="text-sm font-semibold text-muted hover:text-ink">Înapoi la evenimente</Link>
      <PageTitle title={event ? event.title : "Eveniment nou"} />
      {sp.creat && <Alert kind="ok">Eveniment creat. Poți încărca acum imaginea.</Alert>}
      {event ? (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Imagine proprie</h2>
          <EventCoverUpload eventId={event.id} current={event.cover_path} />
        </Card>
      ) : (
        <p className="text-sm text-muted">Imaginea se încarcă după prima salvare.</p>
      )}
      <EventForm event={event} />
      {event && (
        <form action={deleteEvent}>
          <input type="hidden" name="id" value={event.id} />
          <button className={btn.danger}>Șterge evenimentul</button>
        </form>
      )}
    </div>
  );
}
