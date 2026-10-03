import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { PasswordForm } from "./password-form";
import { t } from "@/lib/texts";

export const metadata: Metadata = { title: t.setPassword.title };

export default async function SetPasswordPage() {
  await requireUser({ allowUnacceptedTerms: true });
  return (
    <AuthShell title={t.setPassword.title} subtitle={t.setPassword.subtitle}>
      <PasswordForm />
    </AuthShell>
  );
}
