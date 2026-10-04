import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Field, PageTitle, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createCollection } from "./actions";

export const metadata: Metadata = { title: "Colecții" };

export default async function CollectionsAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from("collections").select("id,title,description,collection_resources(resource_id)").order("position");
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Colecții" />
      <p className="max-w-[65ch] text-muted">O colecție grupează resurse pe o temă. Membrii văd în colecție doar resursele la care au acces.</p>
      <Card>
        <form action={createCollection} className="flex flex-col gap-4">
          <Field label="Titlu colecție" name="title" required />
          <TextArea label="Descriere" name="description" rows={2} />
          <div><SubmitButton>Creează colecția</SubmitButton></div>
        </form>
      </Card>
      <ul className="divide-y divide-line rounded-card border border-line bg-surface">
        {(data ?? []).map((c) => (
          <li key={c.id}>
            <Link href={`/admin/colectii/${c.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-surface2">
              <span className="font-semibold">{c.title}</span>
              <span className="text-sm text-muted">{c.collection_resources.length} resurse</span>
            </Link>
          </li>
        ))}
        {(data ?? []).length === 0 && <li className="p-6 text-sm text-muted">Nicio colecție.</li>}
      </ul>
    </div>
  );
}
