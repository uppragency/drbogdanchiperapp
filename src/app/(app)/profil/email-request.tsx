"use client";
import { useActionState } from "react";
import { Alert, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useTx } from "@/components/locale-provider";
import { requestEmailChange } from "./actions";
import type { FormState } from "@/app/login/actions";

export function EmailRequest({ email }: { email: string }) {
  const tx = useTx();
  const [state, action] = useActionState<FormState, FormData>(requestEmailChange, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label={tx("Adresa nouă de email", "New email address")} name="email" type="email" autoComplete="email" required help={tx(`Adresa actuală este ${email}. Echipa face schimbarea și te anunță.`, `Your current address is ${email}. The team makes the change and lets you know.`)} />
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
      <div><SubmitButton>{tx("Cere schimbarea", "Request change")}</SubmitButton></div>
    </form>
  );
}
