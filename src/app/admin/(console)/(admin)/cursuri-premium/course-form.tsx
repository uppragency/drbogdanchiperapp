"use client";
import { useActionState, useState } from "react";
import { Alert, Card, Field, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { isoToLocalInput } from "@/lib/format";
import { formatLei, type Course } from "@/lib/courses";
import { saveCourse } from "./actions";
import type { FormState } from "@/app/login/actions";

const inp = "h-11 rounded-control border border-line bg-bg px-4 text-base focus:border-accent focus:outline-none";
const num = (v: string) => Number(v.replace(/\s/g, "").replace(",", "."));

export function CourseForm({ course }: { course: Course | null }) {
  const [state, action] = useActionState<FormState, FormData>(saveCourse, {});
  const [net, setNet] = useState(course ? String(course.price).replace(".", ",") : "");
  const [disc, setDisc] = useState(String(course?.member_discount ?? 20));
  const n = num(net);
  const d = num(disc);
  const preview = Number.isFinite(n) && n > 0 ? { member: Math.round(n * (1 - (Number.isFinite(d) ? d : 0) / 100) * 100) / 100 } : null;
  return (
    <form action={action} className="flex flex-col gap-6">
      {course && <input type="hidden" name="id" value={course.id} />}
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">General</h2>
        <Field label="Titlu (RO)" name="title" required defaultValue={course?.title} />
        <Field label="Titlu (EN)" name="titleEn" defaultValue={course?.title_en} />
        <Field label="Adresă (slug)" name="slug" defaultValue={course?.slug} help="Se generează din titlu dacă o lași goală. Apare în linkul /cursuri/adresa." />
        <Field label="Poziție în listă" name="position" inputMode="numeric" defaultValue={course?.position ?? 100} help="Numărul mic apare primul." />
        <TextArea label="Descriere scurtă (RO)" name="shortDescription" rows={3} defaultValue={course?.short_description} />
        <TextArea label="Descriere scurtă (EN)" name="shortDescriptionEn" rows={3} defaultValue={course?.short_description_en} />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Preț</h2>
        <div className="flex flex-col gap-2">
          <label htmlFor="price" className="text-sm font-semibold">Preț cu TVA (lei)</label>
          <input id="price" name="price" required value={net} onChange={(e) => setNet(e.target.value)} inputMode="decimal" className={inp} />
          <p className="text-sm text-muted">Prețul exact din magazin, cu TVA inclus (ex: 302,50).</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="memberDiscount" className="text-sm font-semibold">Reducere membri (%)</label>
            <input id="memberDiscount" name="memberDiscount" value={disc} onChange={(e) => setDisc(e.target.value)} inputMode="numeric" className={inp} />
          </div>
          <Field label="Cod reducere" name="memberCode" defaultValue={course?.member_code ?? "mentormeduser20"} />
        </div>
        {preview && (
          <p className="rounded-control bg-surface2 px-4 py-3 text-sm">
            Preț afișat membrilor, cu TVA: <strong>{formatLei(preview.member)}</strong>.
          </p>
        )}
        <h3 className="pt-2 text-base font-bold">Ofertă (opțional)</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Preț ofertă cu TVA (lei)" name="offerPrice" defaultValue={course?.offer_price != null ? String(course.offer_price).replace(".", ",") : ""} />
          <div className="flex flex-col gap-2">
            <label htmlFor="offerUntil" className="text-sm font-semibold">Ofertă valabilă până la</label>
            <input id="offerUntil" name="offerUntil" type="datetime-local" defaultValue={isoToLocalInput(course?.offer_until)} className="h-11 rounded-control border border-line bg-bg px-4 text-base focus:border-accent focus:outline-none" />
          </div>
        </div>
        <p className="text-sm text-muted">Completează ambele câmpuri sau niciunul. După data de final, se revine automat la prețul obișnuit.</p>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Magazin</h2>
        <Field label="Link produs în magazin" name="shopUrl" required type="url" defaultValue={course?.shop_url} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Text buton (RO)" name="buttonLabel" defaultValue={course?.button_label ?? "Vezi cursul în magazin"} />
          <Field label="Text buton (EN)" name="buttonLabelEn" defaultValue={course?.button_label_en} />
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Conținut pagină</h2>
        <TextArea label="Descriere lungă (RO)" name="longDescription" rows={8} defaultValue={course?.long_description} help="Un paragraf pe rând." />
        <TextArea label="Descriere lungă (EN)" name="longDescriptionEn" rows={8} defaultValue={course?.long_description_en} />
        <TextArea label="Beneficii (RO)" name="benefits" rows={5} defaultValue={course?.benefits} help="Un beneficiu pe rând." />
        <TextArea label="Beneficii (EN)" name="benefitsEn" rows={5} defaultValue={course?.benefits_en} />
        <TextArea label="Ce include (RO)" name="includes" rows={5} defaultValue={course?.includes} help="Un element pe rând." />
        <TextArea label="Ce include (EN)" name="includesEn" rows={5} defaultValue={course?.includes_en} />
        <TextArea label="Detalii (RO)" name="details" rows={5} defaultValue={course?.details} help="Un rând pe detaliu, în forma „Etichetă: valoare”." />
        <TextArea label="Detalii (EN)" name="detailsEn" rows={5} defaultValue={course?.details_en} />
        <Field label="Prezentator" name="presenter" defaultValue={course?.presenter} />
        <TextArea label="Despre prezentator (RO)" name="presenterBio" rows={4} defaultValue={course?.presenter_bio} />
        <TextArea label="Despre prezentator (EN)" name="presenterBioEn" rows={4} defaultValue={course?.presenter_bio_en} />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Imagine</h2>
        <Field label="Link imagine externă (opțional)" name="coverUrl" type="url" defaultValue={course?.cover_url ?? ""} help="Se folosește doar dacă nu ai încărcat o imagine proprie. O imagine încărcată e mai sigură decât un link către alt site." />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Publicare</h2>
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="isPublished" defaultChecked={course?.is_published ?? false} className="size-5 accent-[var(--color-accent)]" /> Publicat (vizibil membrilor)
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="announce" defaultChecked={course?.announce ?? true} className="size-5 accent-[var(--color-accent)]" /> Anunță în „Ce e nou”
        </label>
      </Card>

      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
      <div><SubmitButton>Salvează</SubmitButton></div>
    </form>
  );
}
