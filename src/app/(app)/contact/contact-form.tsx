"use client";
import { useActionState, useState } from "react";
import { Alert, Field, TextArea, cn } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { sendContact } from "./actions";
import type { FormState } from "@/app/login/actions";
import { useTx } from "@/components/locale-provider";

const REASONS = ["Problemă tehnică", "Acces", "Altceva"] as const;
const REASON_EN: Record<(typeof REASONS)[number], string> = { "Problemă tehnică": "Technical issue", Acces: "Access", Altceva: "Something else" };

export function ContactForm() {
  const tx = useTx();
  const [state, action] = useActionState<FormState, FormData>(sendContact, {});
  const [reason, setReason] = useState<(typeof REASONS)[number]>("Problemă tehnică");
  return (
    <form action={action} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">{tx("Despre ce este vorba?", "What is this about?")}</legend>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <label key={r} className={cn("inline-flex h-11 cursor-pointer items-center rounded-full border px-5 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent", reason === r ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-ink hover:bg-surface2")}>
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="sr-only" />
              {tx(r, REASON_EN[r])}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label={tx("Subiect (opțional)", "Subject (optional)")} name="subject" />
      <TextArea label={tx("Mesaj", "Message")} name="message" rows={7} />
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
      <div><SubmitButton>{tx("Trimite mesajul", "Send message")}</SubmitButton></div>
    </form>
  );
}
