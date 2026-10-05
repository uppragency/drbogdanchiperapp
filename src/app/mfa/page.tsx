import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { MfaChallenge } from "./mfa-challenge";
import { safeNext } from "@/lib/safe-next";
import { getT, getTx } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const [t, tx] = await Promise.all([getT(), getTx()]);
  return { title: t.mfa.title, description: tx("Introdu codul din aplicația de autentificare pentru a continua.", "Enter the code from your authenticator app to continue.") };
}

export default async function MfaPage({ searchParams }: PageProps<"/mfa">) {
  await requireUser({ allowUnacceptedTerms: true });
  const t = await getT();
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined, "/admin");
  return (
    <AuthShell title={t.mfa.title} subtitle={t.mfa.subtitle}>
      <MfaChallenge next={next} />
    </AuthShell>
  );
}
