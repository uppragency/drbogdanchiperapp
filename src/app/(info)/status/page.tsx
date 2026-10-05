import type { Metadata } from "next";
import { connection } from "next/server";
import { CheckCircle, WarningCircle, XCircle } from "@phosphor-icons/react/dist/ssr";
import { getLocale, getTx } from "@/lib/i18n";
import { runChecks } from "@/lib/status";
import { cn } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const tx = await getTx();
  return {
    title: tx("Status sisteme", "System status"),
    description: tx("Starea în timp real a platformei MentorMed: autentificare, baza de date, fișiere și emailuri.", "Live status of the MentorMed platform: sign in, database, files and email."),
  };
}

export default async function StatusPage() {
  await connection();
  const [tx, locale, checks] = await Promise.all([getTx(), getLocale(), runChecks()]);
  const down = checks.filter((c) => c.state === "down").length;
  const slow = checks.filter((c) => c.state === "slow").length;
  const overall = down ? "down" : slow ? "slow" : "ok";
  const head = {
    ok: { text: tx("Toate sistemele funcționează", "All systems operational"), cls: "border-ok bg-ok-bg text-ok", Icon: CheckCircle },
    slow: { text: tx("Unele sisteme răspund mai lent", "Some systems are slower than usual"), cls: "border-warn bg-warn-bg text-warn", Icon: WarningCircle },
    down: { text: tx("Avem o problemă la unele sisteme", "Some systems have a problem"), cls: "border-danger bg-danger-bg text-danger", Icon: XCircle },
  }[overall];
  const label = { ok: tx("Funcționează", "Operational"), slow: tx("Lent", "Slow"), down: tx("Indisponibil", "Unavailable") };
  const checkedAt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ro-RO", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(new Date());

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight">{tx("Status sisteme", "System status")}</h1>
      <div role="status" className={cn("mt-6 flex items-center gap-3 rounded-card border p-5 text-lg font-bold", head.cls)}>
        <head.Icon size={26} weight="fill" aria-hidden />
        {head.text}
      </div>
      <ul className="mt-6 divide-y divide-line rounded-card border border-line bg-surface">
        {checks.map((c) => (
          <li key={c.key} className="flex items-center justify-between gap-4 p-4">
            <span className="font-semibold">{tx(c.ro, c.en)}</span>
            <span className="flex items-center gap-3 text-sm">
              {c.ms > 0 && <span className="text-muted">{c.ms} ms</span>}
              <span className={cn("font-semibold", c.state === "ok" ? "text-ok" : c.state === "slow" ? "text-warn" : "text-danger")}>{label[c.state]}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">{tx(`Verificat la ${checkedAt} (ora României). Reîncarcă pagina pentru o verificare nouă.`, `Checked at ${checkedAt} (Romania time). Reload the page to check again.`)}</p>
      <p className="mt-6 text-sm text-muted">
        {tx("Dacă o problemă persistă, scrie-ne la ", "If a problem persists, write to us at ")}
        <a href="mailto:contact@drbogdanchiper.ro" className="font-semibold text-violet hover:underline">contact@drbogdanchiper.ro</a>.
      </p>
    </div>
  );
}
