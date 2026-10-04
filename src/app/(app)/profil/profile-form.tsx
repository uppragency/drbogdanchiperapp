"use client";
import { useActionState } from "react";
import { updateProfile } from "./actions";
import { Alert, Field, Select } from "@/components/ui";
import { SPECIALTIES } from "@/lib/specialties";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/app/login/actions";
import { useLocale, useT, useTx } from "@/components/locale-provider";

export function ProfileForm({ firstName, lastName, email, specialty, city }: { firstName: string; lastName: string; email: string; specialty: string; city: string }) {
  const t = useT();
  const locale = useLocale();
  const tx = useTx();
  const [state, action] = useActionState<FormState, FormData>(updateProfile, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.profile.firstName} name="firstName" defaultValue={firstName} autoComplete="given-name" required />
        <Field label={t.profile.lastName} name="lastName" defaultValue={lastName} autoComplete="family-name" required />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label={tx("Specialitate", "Speciality")} name="specialty" defaultValue={specialty}>
          <option value="">{tx("Nespecificată", "Not specified")}</option>
          {SPECIALTIES.map((s) => <option key={s.key} value={s.key}>{locale === "en" ? s.en : s.ro}</option>)}
        </Select>
        <Field label={tx("Oraș", "City")} name="city" defaultValue={city} autoComplete="address-level2" />
      </div>
      <p className="-mt-2 text-sm text-muted">{tx("Apar lângă numele tău în comentarii.", "Shown next to your name in comments.")}</p>
      <Field label={t.profile.email} name="email_display" type="email" defaultValue={email} disabled help={tx("Emailul se schimbă doar de către administrator.", "Your email can only be changed by an administrator.")} />
      <SubmitButton className="self-start">{t.profile.save}</SubmitButton>
    </form>
  );
}
