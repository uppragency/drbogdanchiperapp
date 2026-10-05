import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { TermsForm } from "./terms-form";
import { getT, getTx } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const [t, tx] = await Promise.all([getT(), getTx()]);
  return { title: t.terms.title, description: tx("Citește și acceptă termenii și politica de confidențialitate pentru a folosi platforma.", "Read and accept the terms and privacy policy to use the platform.") };
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
