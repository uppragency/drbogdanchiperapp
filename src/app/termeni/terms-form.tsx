"use client";
import { useActionState } from "react";
import { acceptTerms } from "./actions";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/app/login/actions";
import { t } from "@/lib/texts";

export function TermsForm() {
  const [state, action] = useActionState<FormState, FormData>(acceptTerms, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && <Alert>{state.error}</Alert>}
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="accept" className="mt-0.5 size-5 accent-[var(--accent)]" required />
        <span>{t.terms.accept}</span>
      </label>
      <SubmitButton className="w-full">{t.terms.submit}</SubmitButton>
    </form>
  );
}
