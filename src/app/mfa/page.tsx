import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { MfaChallenge } from "./mfa-challenge";
import { safeNext } from "@/lib/safe-next";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).mfa.title };
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
