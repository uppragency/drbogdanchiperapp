import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, PageTitle, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { saveWelcome } from "./actions";

export const metadata: Metadata = { title: "Grupuri" };

export default async function GroupsAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("id,name,welcome_message").order("position");
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Mesaj de bun venit pe grup" />
      <p className="max-w-[65ch] text-muted">Mesajul apare pe pagina principală a membrilor din grupul respectiv. Lasă gol pentru a nu afișa nimic.</p>
      {(data ?? []).map((g) => (
        <Card key={g.id}>
          <form action={saveWelcome} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={g.id} />
            <TextArea label={g.name} name="message" defaultValue={g.welcome_message} rows={3} />
            <div><SubmitButton variant="secondary">Salvează</SubmitButton></div>
          </form>
        </Card>
      ))}
    </div>
  );
}
