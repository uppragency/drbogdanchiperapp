import { env } from "@/lib/env";

export type CheckState = "ok" | "slow" | "down";
export type Check = { key: string; ro: string; en: string; state: CheckState; ms: number };

async function probe(url: string, headers: Record<string, string> = {}, accept: (status: number) => boolean = (s) => s < 500): Promise<{ state: CheckState; ms: number }> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(5000) });
    const ms = Date.now() - t0;
    if (!accept(res.status)) return { state: "down", ms };
    return { state: ms > 1500 ? "slow" : "ok", ms };
  } catch {
    return { state: "down", ms: Date.now() - t0 };
  }
}

// Reachability checks only. Nothing here exposes keys, data or internal addresses.
export async function runChecks(): Promise<Check[]> {
  const key = { apikey: env.supabaseKey };
  const [db, auth, storage, email] = await Promise.all([
    probe(`${env.supabaseUrl}/rest/v1/`, key),
    probe(`${env.supabaseUrl}/auth/v1/health`, key, (s) => s === 200),
    probe(`${env.supabaseUrl}/storage/v1/bucket`, key),
    probe("https://api.resend.com/", {}, (s) => s < 500),
  ]);
  return [
    { key: "app", ro: "Platforma", en: "Platform", state: "ok", ms: 0 },
    { key: "auth", ro: "Autentificare", en: "Sign in", ...auth },
    { key: "db", ro: "Baza de date", en: "Database", ...db },
    { key: "storage", ro: "Fișiere și coperți", en: "Files and covers", ...storage },
    { key: "email", ro: "Emailuri", en: "Email", ...email },
  ];
}
