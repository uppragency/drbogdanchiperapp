"use client";
import { useActionState } from "react";
import { requestReset } from "./actions";
import { Alert, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useT } from "@/components/locale-provider";
import type { FormState } from "@/app/login/actions";

export function ForgotForm() {
  const t = useT();
  const [state, action] = useActionState<FormState, FormData>(requestReset, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
      <Field label={t.login.email} name="email" type="email" autoComplete="email" inputMode="email" required />
      <SubmitButton className="w-full">{t.forgot.submit}</SubmitButton>
    </form>
  );
}
