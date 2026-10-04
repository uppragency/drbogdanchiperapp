import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const viewer = await requireUser();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Contact</h1>
      <p className="text-muted">Scrie-ne o întrebare sau o problemă tehnică. Răspundem pe {viewer.email}.</p>
      <div className="rounded-card border border-line bg-surface p-6 md:p-8">
        <ContactForm />
      </div>
    </div>
  );
}
