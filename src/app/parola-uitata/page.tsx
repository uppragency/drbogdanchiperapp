import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { getT } from "@/lib/i18n";
import { ForgotForm } from "./forgot-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).forgot.title };
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
