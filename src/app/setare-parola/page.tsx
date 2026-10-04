import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { PasswordForm } from "./password-form";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).setPassword.title };
}

export default async function SetPasswordPage() {
  await requireUser({ allowUnacceptedTerms: true });
  const t = await getT();
  return (
    <AuthShell title={t.setPassword.title} subtitle={t.setPassword.subtitle}>
      <PasswordForm />
    </AuthShell>
  );
}
