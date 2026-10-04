"use client";
import { useActionState, useState } from "react";
import { Alert, Field, Select, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { saveResource } from "./actions";
import type { FormState } from "@/app/login/actions";

type Option = { id: string; name: string };
export type ResourceValues = {
  id?: string;
  title: string;
  description: string;
  titleEn: string;
  descriptionEn: string;
  bodyEn: string;
  type: "video" | "pdf" | "text" | "link";
  categoryId: string;
  body: string;
  videoUrl: string;
  status: "draft" | "published";
  publishAt: string;
  eventAt: string;
  isPinned: boolean;
  commentsEnabled: boolean;
  presenter: string;
  tagIds: string[];
};

export function ResourceForm({ values, categories, tags }: { values: ResourceValues; categories: Option[]; tags: Option[] }) {
  const [state, action] = useActionState<FormState, FormData>(saveResource, {});
  const [type, setType] = useState(values.type);
  const [selected, setSelected] = useState<string[]>(values.tagIds);
  const allSelected = selected.length === tags.length;
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <form action={action} className="flex flex-col gap-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <Field label="Titlu (română)" name="title" defaultValue={values.title} required />
      <Field label="Titlu (engleză)" name="titleEn" defaultValue={values.titleEn} help="Opțional. Dacă rămâne gol, membrii care aleg engleza văd titlul în română." />
      <TextArea label="Descriere scurtă (română)" name="description" defaultValue={values.description} rows={2} help="Apare în listă, sub titlu. Maximum 500 de caractere." />
      <TextArea label="Descriere scurtă (engleză)" name="descriptionEn" defaultValue={values.descriptionEn} rows={2} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="type" className="text-sm font-semibold">Tip</label>
          <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as ResourceValues["type"])} className="h-11 rounded-control border border-line bg-bg px-3 text-base text-ink focus:border-accent focus:outline-none">
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="text">Text</option>
            <option value="link">Link</option>
          </select>
        </div>
        <Select label="Categorie" name="categoryId" defaultValue={values.categoryId} required>
          <option value="" disabled>Alege</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
      {(type === "video" || type === "link") && (
        <Field label={type === "video" ? "Link video (YouTube sau Vimeo)" : "Link resursă"} name="videoUrl" type="url" defaultValue={values.videoUrl} placeholder="https://" required />
      )}
      <TextArea label="Text (română)" name="body" defaultValue={values.body} rows={10} help="Paragrafele se separă printr-un rând liber." />
      <TextArea label="Text (engleză)" name="bodyEn" defaultValue={values.bodyEn} rows={10} help="Opțional. Același format, paragrafele separate printr-un rând liber." />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold">Cine vede resursa</legend>
        <label className="flex min-h-11 items-center gap-3 rounded-control border border-line bg-bg px-4 text-sm font-semibold">
          <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : tags.map((x) => x.id))} className="size-5 accent-[var(--accent)]" />
          Toate grupurile MentorMed
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {tags.map((tag) => (
            <label key={tag.id} className="flex min-h-11 items-center gap-3 rounded-control border border-line bg-bg px-4 text-sm">
              <input type="checkbox" name="tagIds" value={tag.id} checked={selected.includes(tag.id)} onChange={() => toggle(tag.id)} className="size-5 accent-[var(--accent)]" />
              {tag.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Stare" name="status" defaultValue={values.status}>
          <option value="draft">Draft (invizibil pentru useri)</option>
          <option value="published">Publicat</option>
        </Select>
        <Field label="Programează publicarea" name="publishAt" type="datetime-local" defaultValue={values.publishAt} help="Gol înseamnă imediat. Ora României." />
      </div>
      <Field label="Prezentator (opțional)" name="presenter" defaultValue={values.presenter} help="Apare pe card și se poate căuta. Ex: Dr. Bogdan Chiper." />
      <Field label="Data evenimentului (webinar, opțional)" name="eventAt" type="datetime-local" defaultValue={values.eventAt} help="Dacă o completezi, resursa apare în Calendar. Ora României." />
      <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
        <input type="checkbox" name="isPinned" defaultChecked={values.isPinned} className="size-5 accent-[var(--accent)]" />
        Fixează în capul listei (apare și la „Începe de aici” în feed)
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
        <input type="checkbox" name="commentsEnabled" defaultChecked={values.commentsEnabled} className="size-5 accent-[var(--accent)]" />
        Permite comentarii
      </label>

      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
      <div><SubmitButton>Salvează resursa</SubmitButton></div>
    </form>
  );
}
