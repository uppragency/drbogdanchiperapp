"use client";
import Link from "next/link";
import { useActionState } from "react";
import { login, type FormState } from "./actions";
import { Alert, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useT } from "@/components/locale-provider";

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const t = useT();
  const [state, action] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      {notice && <Alert>{notice}</Alert>}
      <input type="hidden" name="next" value={next} />
      <Field label={t.login.email} name="email" type="email" autoComplete="email" inputMode="email" required />
      <Field label={t.login.password} name="password" type="password" autoComplete="current-password" required error={state.error} />
      <SubmitButton className="w-full">{t.login.submit}</SubmitButton>
      <Link href="/parola-uitata" className="text-center text-sm font-semibold text-accent hover:underline">
        {t.login.forgot}
      </Link>
    </form>
  );
}
