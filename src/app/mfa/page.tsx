import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { MfaChallenge } from "./mfa-challenge";
import { safeNext } from "@/lib/safe-next";
import { t } from "@/lib/texts";

export const metadata: Metadata = { title: t.mfa.title };

export default async function MfaPage({ searchParams }: PageProps<"/mfa">) {
  await requireUser({ allowUnacceptedTerms: true });
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined, "/admin");
  return (
    <AuthShell title={t.mfa.title} subtitle={t.mfa.subtitle}>
      <MfaChallenge next={next} />
    </AuthShell>
  );
}
