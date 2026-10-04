import type { Metadata } from "next";
import { getLocale, getTx } from "@/lib/i18n";

export const metadata: Metadata = { title: "Politica de confidențialitate" };

// TODO inainte de lansare: inlocuieste cu textul final, validat juridic.
export default async function Page() {
  const en = (await getLocale()) === "en";
  const tx = await getTx();
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      {en && <p className="mb-6 rounded-card border border-line bg-surface2 p-4 text-sm text-muted">{tx("", "The legal documents are available in Romanian only.")}</p>}
      <h1 className="text-3xl font-bold tracking-tight">Politica de confidențialitate</h1>
      <p className="mt-6 text-muted">Textul final al acestui document urmează să fie publicat aici.</p>
    </main>
  );
}
