import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Alert, Card, PageTitle } from "@/components/ui";
import { MfaEnroll } from "./mfa-enroll";

export const metadata: Metadata = { title: "Securitate" };

export default async function SecurityPage() {
  await requireAdmin({ allowEnrol: true });
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const enrolled = (data?.totp?.length ?? 0) > 0;
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Securitate" />
      <Card className="flex max-w-xl flex-col gap-4">
        <h2 className="text-lg font-bold">Verificare în doi pași</h2>
        {enrolled ? (
          <Alert kind="ok">Verificarea în doi pași este activă pentru contul de administrator.</Alert>
        ) : (
          <>
            <p className="text-sm text-muted">Contul de administrator controlează accesul tuturor medicilor. Activează verificarea în doi pași cu o aplicație de autentificare (Google Authenticator, Authy, 1Password) ca să poți folosi administrarea.</p>
            <MfaEnroll />
          </>
        )}
      </Card>
    </div>
  );
}
