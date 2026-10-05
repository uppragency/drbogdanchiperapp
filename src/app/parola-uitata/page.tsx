import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { getT, getTx } from "@/lib/i18n";
import { ForgotForm } from "./forgot-form";

export async function generateMetadata(): Promise<Metadata> {
  const [t, tx] = await Promise.all([getT(), getTx()]);
  return { title: t.forgot.title, description: tx("Primești pe email un link pentru a-ți reseta parola MentorMed.", "You receive an email with a link to reset your MentorMed password.") };
}

export default async function ForgotPage() {
  const t = await getT();
  return (
    <AuthShell title={t.forgot.title} subtitle={t.forgot.subtitle}>
      <ForgotForm />
      <Link href="/login" className="text-center text-sm font-semibold text-accent hover:underline">
        {t.forgot.back}
      </Link>
    </AuthShell>
  );
}
