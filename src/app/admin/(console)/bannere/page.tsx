import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Alert, Badge, Card, Field, PageTitle, Select, btn } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { formatDateTime } from "@/lib/format";
import { createBanner, deleteBanner, toggleBanner } from "./actions";

export const metadata: Metadata = { title: "Bannere" };

export default async function BannersAdmin({ searchParams }: PageProps<"/admin/bannere">) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data }, { data: tags }] = await Promise.all([
    supabase.from("site_banners").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("tags").select("id,name").order("position"),
  ]);
  const tagName = new Map((tags ?? []).map((t: { id: string; name: string }) => [t.id, t.name]));
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Bannere" />
      <p className="max-w-[65ch] text-muted">Bannerul activ apare deasupra conținutului pentru toți membrii. Dacă sunt mai multe active, se afișează cel mai nou.</p>
      {sp.err && <Alert>Mesajul este obligatoriu (maximum 240 de caractere), iar linkul trebuie să înceapă cu https://.</Alert>}
      <Card>
        <form action={createBanner} className="flex flex-col gap-4">
          <Field label="Mesaj (română)" name="message" required />
          <Field label="Mesaj (engleză)" name="messageEn" help="Opțional. Dacă rămâne gol, se afișează mesajul în română." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Link (opțional)" name="linkUrl" type="url" placeholder="https://" />
            <Field label="Text buton link (română)" name="linkLabel" placeholder="Vezi detalii" />
            <Field label="Text buton link (engleză)" name="linkLabelEn" placeholder="See details" />
            <Field label="Începe la (opțional)" name="startsAt" type="datetime-local" />
            <Field label="Se oprește la (opțional)" name="endsAt" type="datetime-local" help="Ora României." />
          </div>
          <Select label="Doar pentru grupul" name="tagId" defaultValue="">
            <option value="">Toți membrii</option>
            {(tags ?? []).map((t: { id: string; name: string }) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <div><SubmitButton>Publică bannerul</SubmitButton></div>
        </form>
      </Card>
      <ul className="divide-y divide-line rounded-card border border-line bg-surface">
        {(data ?? []).map((b) => (
          <li key={b.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-semibold">{b.message}</span>
              <span className="text-sm text-muted">{b.link_url ?? "Fără link"}{b.starts_at ? ` · de la ${formatDateTime(b.starts_at)}` : ""}{b.ends_at ? ` · până la ${formatDateTime(b.ends_at)}` : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              {b.tag_id && <Badge tone="info">{tagName.get(b.tag_id) ?? "Grup"}</Badge>}
              <Badge tone={b.is_active ? "ok" : "neutral"}>{b.is_active ? "Activ" : "Oprit"}</Badge>
              <form action={toggleBanner}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="active" value={b.is_active ? "0" : "1"} /><button className={btn.secondary}>{b.is_active ? "Oprește" : "Activează"}</button></form>
              <form action={deleteBanner}><input type="hidden" name="id" value={b.id} /><button className={btn.danger}>Șterge</button></form>
            </div>
          </li>
        ))}
        {(data ?? []).length === 0 && <li className="p-6 text-sm text-muted">Niciun banner.</li>}
      </ul>
    </div>
  );
}
