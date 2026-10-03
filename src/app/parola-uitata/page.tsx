"use client";
import Link from "next/link";
import { useActionState } from "react";
import { requestReset } from "./actions";
import { AuthShell } from "@/components/auth-shell";
import { Alert, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/app/login/actions";
import { t } from "@/lib/texts";

export default function ForgotPage() {
  const [state, action] = useActionState<FormState, FormData>(requestReset, {});
  return (
    <AuthShell title={t.forgot.title} subtitle={t.forgot.subtitle}>
      <form action={action} className="flex flex-col gap-5">
        {state.ok && <Alert kind="ok">{state.ok}</Alert>}
        <Field label={t.login.email} name="email" type="email" autoComplete="email" inputMode="email" required />
        <SubmitButton className="w-full">{t.forgot.submit}</SubmitButton>
      </form>
      <Link href="/login" className="text-center text-sm font-semibold text-accent hover:underline">
        {t.forgot.back}
      </Link>
    </AuthShell>
  );
}
