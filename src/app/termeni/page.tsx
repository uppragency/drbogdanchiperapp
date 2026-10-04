import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { TermsForm } from "./terms-form";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).terms.title };
}

export default async function TermsPage() {
  const viewer = await requireUser({ allowUnacceptedTerms: true });
  const t = await getT();
  if (viewer.termsAcceptedAt) redirect("/feed");
  return (
    <AuthShell title={t.terms.title} subtitle={t.terms.intro}>
      <ul className="flex flex-col gap-2 text-sm font-semibold text-accent">
        <li><Link href="/legal/termeni" target="_blank" className="hover:underline">{t.terms.termsLink}</Link></li>
        <li><Link href="/legal/confidentialitate" target="_blank" className="hover:underline">{t.terms.privacyLink}</Link></li>
      </ul>
      <TermsForm />
    </AuthShell>
  );
}
