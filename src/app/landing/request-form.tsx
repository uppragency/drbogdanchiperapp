"use client";
import { useActionState } from "react";
import { Alert, Field, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { requestAccess } from "./actions";
import { useTx } from "@/components/locale-provider";
import type { FormState } from "@/app/login/actions";

export function RequestForm() {
  const tx = useTx();
  const [state, action] = useActionState<FormState, FormData>(requestAccess, {});
  if (state.ok) return <Alert kind="ok">{state.ok}</Alert>;
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={tx("Prenume", "First name")} name="firstName" autoComplete="given-name" required />
        <Field label={tx("Nume", "Last name")} name="lastName" autoComplete="family-name" />
      </div>
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <TextArea label={tx("Mesaj (opțional)", "Message (optional)")} name="message" rows={3} />
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {state.error && <Alert>{state.error}</Alert>}
      <div><SubmitButton>{tx("Trimite cererea", "Send request")}</SubmitButton></div>
    </form>
  );
}
