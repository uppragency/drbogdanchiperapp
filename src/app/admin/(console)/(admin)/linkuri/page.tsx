import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Alert, Badge, Card, PageTitle } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { formatDateTime } from "@/lib/format";
import { runLinkCheck } from "./actions";
import { gatherItems } from "./gather";

export const metadata: Metadata = { title: "Linkuri" };
// A run checks up to 120 links with 8 second timeouts.
export const maxDuration = 60;

export default async function LinksAdmin({ searchParams }: PageProps<"/admin/linkuri">) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [items, { data }] = await Promise.all([gatherItems(), supabase.from("link_checks").select("resource_id,url,ok,status,checked_at").limit(5000)]);
  const keys = new Set(items.map((x) => `${x.resource_id}|${x.url}`));
  const checks = ((data ?? []) as { resource_id: string; url: string; ok: boolean; status: string; checked_at: string }[]).filter((c) => keys.has(`${c.resource_id}|${c.url}`));
  const failures = checks.filter((c) => !c.ok).sort((a, b) => b.checked_at.localeCompare(a.checked_at));
  const unchecked = items.length - checks.length;

  const ids = [...new Set(failures.map((f) => f.resource_id))];
  const { data: titles } = ids.length ? await supabase.from("resources").select("id,title").in("id", ids) : { data: [] };
  const title = new Map(((titles ?? []) as { id: string; title: string }[]).map((t) => [t.id, t.title]));
  const num = (v: unknown) => (typeof v === "string" && /^\d+$/.test(v) ? Number(v) : null);
  const ran = num(sp.rulat);
  const ramase = num(sp.ramase);

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Linkuri" />
      <p className="max-w-[65ch] text-muted">Verifică linkurile din resursele publicate: videoclipuri, linkuri și fișiere atașate. O verificare procesează cel mult 120 de linkuri, cele neverificate sau verificate cel mai demult.</p>
      {ran !== null && (
        <Alert kind={num(sp.probleme) ? "warn" : "ok"}>
          Am verificat {ran} linkuri, {num(sp.probleme) ?? 0} cu probleme.{ramase ? ` Mai sunt ${ramase} de verificat, rulează din nou.` : ""}
        </Alert>
      )}
      <Card className="flex flex-col gap-4">
        <form action={runLinkCheck} className="flex flex-wrap items-center gap-4">
          <SubmitButton>Verifică acum</SubmitButton>
          <p className="text-sm text-muted">{items.length} linkuri în total, {unchecked} încă neverificate. Verificarea poate dura până la un minut.</p>
        </form>
        <p className="text-sm font-semibold">{checks.length} verificate, {failures.length} cu probleme</p>
      </Card>
      <ul className="divide-y divide-line rounded-card border border-line bg-surface">
        {failures.map((f) => (
          <li key={`${f.resource_id}|${f.url}`} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <Link href={`/admin/resurse/${f.resource_id}`} className="font-semibold hover:text-accent">{title.get(f.resource_id) ?? "Resursă"}</Link>
              <span className="break-all text-sm text-muted">{f.url.startsWith("fisier:") ? `Fișier: ${f.url.slice(7)}` : f.url}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-sm text-muted">
              <Badge tone="danger">{f.status}</Badge>
              {formatDateTime(f.checked_at)}
            </div>
          </li>
        ))}
        {failures.length === 0 && <li className="p-6 text-sm text-muted">{checks.length ? "Niciun link cu probleme." : "Nicio verificare încă."}</li>}
      </ul>
    </div>
  );
}
