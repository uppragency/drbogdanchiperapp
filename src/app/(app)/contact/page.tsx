import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getTx } from "@/lib/i18n";
import { EnvelopeSimple, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact" };

const ADDRESS = "Primaverii Plaza, Bulevardul Primăverii 19-21, Sc. B, Et. 3, Ap. 34, 011972 București";
const MAPS_URL = "https://share.google/JYABnbDtONOaQT2be";
const MAPS_EMBED = `https://www.google.com/maps?q=${encodeURIComponent("Primaverii Plaza, Bulevardul Primăverii 19-21, București")}&output=embed`;

export default async function ContactPage() {
  const viewer = await requireUser();
  const tx = await getTx();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Contact</h1>
      <p className="text-muted">{tx(`Scrie-ne o întrebare sau o problemă tehnică. Răspundem pe ${viewer.email}.`, `Send us a question or report a technical issue. We reply to ${viewer.email}.`)}</p>
      <p className="text-sm text-muted">{tx("Poate răspunsul este deja în ", "The answer may already be in ")}<Link href="/faq" className="font-semibold text-accent hover:underline">{tx("Întrebări frecvente", "Frequently asked questions")}</Link>.</p>
      <div className="rounded-card border border-line bg-surface p-6 md:p-8">
        <ContactForm />
      </div>
      <section aria-label={tx("Date de contact", "Contact details")} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 md:p-8">
        <ul className="flex flex-col gap-4">
          <li className="flex items-start gap-3">
            <EnvelopeSimple size={22} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <a href="mailto:contact@drbogdanchiper.ro" className="font-semibold hover:underline">contact@drbogdanchiper.ro</a>
          </li>
          <li className="flex items-start gap-3">
            <Phone size={22} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <a href="tel:+40746020724" className="font-semibold hover:underline">0746 020 724</a>
          </li>
          <li className="flex items-start gap-3">
            <MapPin size={22} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <span className="flex flex-col gap-1">
              <span>MENTOR MED TRAINING CENTER SRL</span>
              <span className="text-muted">{ADDRESS}</span>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">{tx("Deschide în Google Maps", "Open in Google Maps")}</a>
            </span>
          </li>
        </ul>
        <iframe title={tx("Hartă", "Map")} src={MAPS_EMBED} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-64 w-full rounded-xl border border-line" />
      </section>
    </div>
  );
}
