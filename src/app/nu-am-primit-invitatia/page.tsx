import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { getT, getTx } from "@/lib/i18n";
import { InviteForm } from "./invite-form";

export async function generateMetadata(): Promise<Metadata> {
  const [t, tx] = await Promise.all([getT(), getTx()]);
  return { title: t.noInvite.title, description: tx("Primești din nou pe email linkul de activare a contului MentorMed.", "You receive the MentorMed account activation link again by email.") };
}

export default async function NoInvitePage() {
  const t = await getT();
  return (
    <AuthShell title={t.noInvite.title} subtitle={t.noInvite.subtitle}>
      <InviteForm />
      <Link href="/login" className="text-center text-sm font-semibold text-accent hover:underline">
        {t.noInvite.back}
      </Link>
    </AuthShell>
  );
}
