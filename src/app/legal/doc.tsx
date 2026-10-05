import type { ReactNode } from "react";
import { getLocale, getTx } from "@/lib/i18n";
import { LegalCrumbs } from "./crumbs";

export const COMPANY = {
  name: "MENTOR MED TRAINING CENTER SRL",
  cui: "51764371",
  reg: "J2025033252008",
  euid: "ROONRC.J2025033252008",
  address: "Primaverii Plaza, Bulevardul Primăverii 19-21, Sc. B, Et. 3, Ap. 34, 011972 București",
  email: "contact@drbogdanchiper.ro",
  platform: "platforma.drbogdanchiper.ro",
};

export const UPDATED = "5 octombrie 2026";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 flex flex-col gap-3">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export const P = ({ children }: { children: ReactNode }) => <p className="leading-relaxed text-ink/85">{children}</p>;
export const UL = ({ items }: { items: ReactNode[] }) => (
  <ul className="flex list-disc flex-col gap-2 pl-5 leading-relaxed text-ink/85">
    {items.map((i, k) => <li key={k}>{i}</li>)}
  </ul>
);

export function CompanyBlock() {
  return (
    <dl className="grid gap-x-6 gap-y-1 rounded-card border border-line bg-surface p-5 text-sm sm:grid-cols-[10rem_1fr]">
      <dt className="text-muted">Denumire</dt><dd className="font-semibold">{COMPANY.name}</dd>
      <dt className="text-muted">CUI</dt><dd>{COMPANY.cui}</dd>
      <dt className="text-muted">Nr. Reg. Com.</dt><dd>{COMPANY.reg}</dd>
      <dt className="text-muted">EUID</dt><dd>{COMPANY.euid}</dd>
      <dt className="text-muted">Sediu</dt><dd>{COMPANY.address}</dd>
      <dt className="text-muted">Email</dt><dd><a className="text-accent hover:underline" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></dd>
    </dl>
  );
}

export async function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const en = (await getLocale()) === "en";
  const tx = await getTx();
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
      <LegalCrumbs current={title} />
      {en && <p className="mb-6 rounded-card border border-line bg-surface2 p-4 text-sm text-muted">{tx("", "The legal documents are available in Romanian only.")}</p>}
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">Ultima actualizare: {UPDATED}</p>
      <div className="mt-8"><CompanyBlock /></div>
      {children}
    </main>
  );
}
