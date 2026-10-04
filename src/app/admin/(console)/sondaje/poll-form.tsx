"use client";
import { useActionState } from "react";
import { Alert, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createPoll } from "./actions";
import type { FormState } from "@/app/login/actions";

export function PollForm() {
  const [state, action] = useActionState<FormState, FormData>(createPoll, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Întrebare (română)" name="question" required />
      <Field label="Întrebare (engleză)" name="questionEn" help="Opțional. Dacă rămâne gol, se afișează întrebarea în română." />
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold">Variante de răspuns (2 până la 5)</legend>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-2">
            <Field label={`Varianta ${i} (română)`} name={`label${i}`} required={i <= 2} />
            <Field label={`Varianta ${i} (engleză)`} name={`labelEn${i}`} />
          </div>
        ))}
      </fieldset>
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
      <div><SubmitButton>Creează sondajul</SubmitButton></div>
    </form>
  );
}
