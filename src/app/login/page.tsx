import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";
import { safeNext } from "@/lib/safe-next";
import { t } from "@/lib/texts";

export const metadata: Metadata = { title: t.login.title };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const motiv = typeof sp.motiv === "string" ? sp.motiv : undefined;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined);
  const notice = motiv === "sesiune" ? t.login.sessionEnded : motiv === "inactiv" ? t.login.inactive : sp.eroare === "link" ? t.setPassword.failed : undefined;
  return (
    <AuthShell title={t.login.title} subtitle={t.login.subtitle}>
      <LoginForm next={next} notice={notice} />
      <p className="text-center text-sm text-muted">{t.login.noAccount}</p>
    </AuthShell>
  );
}
