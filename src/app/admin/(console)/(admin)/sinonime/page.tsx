import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, PageTitle, btn } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { deleteSynonyms, saveSynonyms } from "./actions";

export const metadata: Metadata = { title: "Sinonime căutare" };

const area = "min-h-24 w-full rounded-control border border-line bg-bg px-3 py-2 text-base focus:border-accent focus:outline-none";

export default async function SynonymsAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from("search_synonyms").select("id,terms").order("created_at", { ascending: false });
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Sinonime pentru căutare" />
      <p className="max-w-[65ch] text-sm leading-relaxed text-muted">
        Termenii dintr-un grup se găsesc unul pe altul. Exemplu: „GBR, regenerare osoasă ghidată”. Greșelile mici de scriere și lipsa diacriticelor sunt tratate automat, nu trebuie adăugate aici.
      </p>
      <Card>
        <form action={saveSynonyms} className="flex flex-col gap-3">
          <label htmlFor="terms-new" className="text-lg font-bold">Grup nou</label>
          <textarea id="terms-new" name="terms" required placeholder="Termeni separați prin virgulă, minimum doi" className={area} />
          <div><SubmitButton>Adaugă</SubmitButton></div>
        </form>
      </Card>
      {(data ?? []).map((g: { id: string; terms: string[] }) => (
        <Card key={g.id}>
          <form action={saveSynonyms} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={g.id} />
            <label htmlFor={`t-${g.id}`} className="sr-only">Termeni</label>
            <textarea id={`t-${g.id}`} name="terms" defaultValue={g.terms.join(", ")} className={area} />
            <div className="flex gap-2">
              <SubmitButton>Salvează</SubmitButton>
              <button formAction={deleteSynonyms} className={btn.danger}>Șterge</button>
            </div>
          </form>
        </Card>
      ))}
      {(data ?? []).length === 0 && <p className="text-sm text-muted">Niciun grup încă.</p>}
    </div>
  );
}
