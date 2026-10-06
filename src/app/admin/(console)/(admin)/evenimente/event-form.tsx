"use client";
import { useActionState, useState } from "react";
import { Alert, Card, Field, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { isoToLocalInput } from "@/lib/format";
import { EVENT_TYPES, type EventRow } from "@/lib/events";
import { saveEvent } from "./actions";
import type { FormState } from "@/app/login/actions";

const inp = "h-11 rounded-control border border-line bg-bg px-4 text-base focus:border-accent focus:outline-none";

export function EventForm({ event }: { event: EventRow | null }) {
  const [state, action] = useActionState<FormState, FormData>(saveEvent, {});
  const [format, setFormat] = useState<string>(event?.format ?? "online");
  return (
    <form action={action} className="flex flex-col gap-6">
      {event && <input type="hidden" name="id" value={event.id} />}
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">General</h2>
        <div className="flex flex-col gap-2">
          <label htmlFor="type" className="text-sm font-semibold">Tip</label>
          <select id="type" name="type" defaultValue={event?.type ?? "studyclub"} className={inp}>
            {EVENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.ro}</option>)}
          </select>
        </div>
        <Field label="Titlu (RO)" name="title" required defaultValue={event?.title} />
        <Field label="Titlu (EN)" name="titleEn" defaultValue={event?.title_en} />
        <Field label="Adresă (slug)" name="slug" defaultValue={event?.slug} help="Se generează din titlu dacă o lași goală." />
        <TextArea label="Descriere scurtă (RO)" name="shortDescription" rows={3} defaultValue={event?.short_description} />
        <TextArea label="Descriere scurtă (EN)" name="shortDescriptionEn" rows={3} defaultValue={event?.short_description_en} />
        <TextArea label="Descriere lungă (RO)" name="description" rows={6} defaultValue={event?.description} help="Un paragraf pe rând." />
        <TextArea label="Descriere lungă (EN)" name="descriptionEn" rows={6} defaultValue={event?.description_en} />
        <TextArea label="Mentori" name="mentors" rows={3} defaultValue={event?.mentors} help="Un mentor pe rând, cu titlul dacă vrei. Exemplu: Dr. Bogdan Chiper" />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Dată și loc</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="startsAt" className="text-sm font-semibold">Start</label>
            <input id="startsAt" name="startsAt" type="datetime-local" required defaultValue={isoToLocalInput(event?.starts_at)} className={inp} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="endsAt" className="text-sm font-semibold">Final (opțional)</label>
            <input id="endsAt" name="endsAt" type="datetime-local" defaultValue={isoToLocalInput(event?.ends_at)} className={inp} />
          </div>
        </div>
        <p className="text-sm text-muted">La ora de start evenimentul trece automat la „Evenimente anterioare”, fără buton de înscriere. Finalul se folosește doar în fișierul de calendar.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="format" className="text-sm font-semibold">Desfășurare</label>
            <select id="format" name="format" value={format} onChange={(e) => setFormat(e.target.value)} className={inp}>
              <option value="online">Online</option>
              <option value="fizic">Fizic</option>
            </select>
          </div>
          {format === "fizic" && <Field label="Oraș" name="city" defaultValue={event?.city} />}
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Înscriere</h2>
        <Field label="Link pagină de înscriere (site principal)" name="registerUrl" required type="url" defaultValue={event?.register_url} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Text buton (RO)" name="buttonLabel" defaultValue={event?.button_label ?? "Înscrie-te"} />
          <Field label="Text buton (EN)" name="buttonLabelEn" defaultValue={event?.button_label_en} />
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Imagine</h2>
        <Field label="Link imagine externă (opțional)" name="coverUrl" type="url" defaultValue={event?.cover_url ?? ""} help="Se folosește doar dacă nu ai încărcat o imagine proprie." />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Publicare</h2>
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="isPublished" defaultChecked={event?.is_published ?? false} className="size-5 accent-[var(--color-accent)]" /> Publicat (vizibil membrilor)
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="announce" defaultChecked={event?.announce ?? true} className="size-5 accent-[var(--color-accent)]" /> Anunță în „Ce e nou”
        </label>
      </Card>

      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
      <div><SubmitButton>Salvează</SubmitButton></div>
    </form>
  );
}
