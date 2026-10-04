"use client";
import { useActionState, useState } from "react";
import { Alert, Field, TextArea, cn } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { sendContact } from "./actions";
import type { FormState } from "@/app/login/actions";

const REASONS = ["Problemă tehnică", "Acces", "Altceva"] as const;

export function ContactForm() {
  const [state, action] = useActionState<FormState, FormData>(sendContact, {});
  const [reason, setReason] = useState<(typeof REASONS)[number]>("Problemă tehnică");
  return (
    <form action={action} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">Despre ce este vorba?</legend>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <label key={r} className={cn("inline-flex h-11 cursor-pointer items-center rounded-full border px-5 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent", reason === r ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-ink hover:bg-surface2")}>
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="sr-only" />
              {r}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Subiect (opțional)" name="subject" />
      <TextArea label="Mesaj" name="message" rows={7} />
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
      <div><SubmitButton>Trimite mesajul</SubmitButton></div>
    </form>
  );
}
