import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getTx } from "@/lib/i18n";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const viewer = await requireUser();
  const tx = await getTx();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Contact</h1>
      <p className="text-muted">{tx(`Scrie-ne o întrebare sau o problemă tehnică. Răspundem pe ${viewer.email}.`, `Send us a question or report a technical issue. We reply to ${viewer.email}.`)}</p>
      <div className="rounded-card border border-line bg-surface p-6 md:p-8">
        <ContactForm />
      </div>
    </div>
  );
}
