"use client";
import { useActionState } from "react";
import { setPassword } from "./actions";
import { Alert, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/app/login/actions";
import { useT } from "@/components/locale-provider";

export function PasswordForm() {
  const t = useT();
  const [state, action] = useActionState<FormState, FormData>(setPassword, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && <Alert>{state.error}</Alert>}
      <Field label={t.setPassword.password} name="password" type="password" autoComplete="new-password" minLength={10} required />
      <Field label={t.setPassword.confirm} name="confirm" type="password" autoComplete="new-password" minLength={10} required />
      <SubmitButton className="w-full">{t.setPassword.submit}</SubmitButton>
    </form>
  );
}
