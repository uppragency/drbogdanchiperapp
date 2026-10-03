import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politica de confidențialitate" };

// TODO inainte de lansare: inlocuieste cu textul final, validat juridic.
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Politica de confidențialitate</h1>
      <p className="mt-6 text-muted">Textul final al acestui document urmează să fie publicat aici.</p>
    </main>
  );
}
