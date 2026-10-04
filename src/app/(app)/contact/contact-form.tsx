"use client";
import { useActionState } from "react";
import { Alert, Field, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { sendContact } from "./actions";
import type { FormState } from "@/app/login/actions";

export function ContactForm() {
  const [state, action] = useActionState<FormState, FormData>(sendContact, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Subiect" name="subject" />
      <TextArea label="Mesaj" name="message" rows={7} />
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="ok">{state.ok}</Alert>}
      <div><SubmitButton>Trimite mesajul</SubmitButton></div>
    </form>
  );
}
