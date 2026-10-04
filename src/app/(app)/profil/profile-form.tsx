"use client";
import { useActionState } from "react";
import { updateProfile } from "./actions";
import { Alert, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/app/login/actions";
import { useT, useTx } from "@/components/locale-provider";

export function ProfileForm({ firstName, lastName, email }: { firstName: string; lastName: string; email: string }) {
  const t = useT();
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
      <Field label={t.profile.email} name="email_display" type="email" defaultValue={email} disabled help={tx("Emailul se schimbă doar de către administrator.", "Your email can only be changed by an administrator.")} />
      <SubmitButton className="self-start">{t.profile.save}</SubmitButton>
    </form>
  );
}
