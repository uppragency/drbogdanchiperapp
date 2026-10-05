import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { PasswordForm } from "./password-form";
import { getT, getTx } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const [t, tx] = await Promise.all([getT(), getTx()]);
  return { title: t.setPassword.title, description: tx("Alege parola contului tău MentorMed.", "Choose the password for your MentorMed account.") };
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
