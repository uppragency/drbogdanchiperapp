import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { validUnsubToken } from "@/lib/unsub";

export const metadata: Metadata = { title: "Dezabonare" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Unsubscribe({ searchParams }: PageProps<"/dezabonare">) {
  const sp = await searchParams;
  const u = typeof sp.u === "string" ? sp.u : "";
  const token = typeof sp.t === "string" ? sp.t : "";
  const ok = UUID.test(u) && token.length > 0 && validUnsubToken(u, token);
  if (ok) await createAdminClient().from("profiles").update({ email_notifications: false }).eq("id", u);
  return (
    <AuthShell title={ok ? "Te-ai dezabonat" : "Link invalid"} subtitle={ok ? "Nu vei mai primi emailuri cu noutăți și remindere. Poți reactiva opțiunea oricând din Profil." : "Linkul de dezabonare nu este valid. Poți schimba preferința din Profil."}>
      <Link href="/profil" className="text-sm font-semibold text-accent hover:underline">Mergi la profil</Link>
    </AuthShell>
  );
}
