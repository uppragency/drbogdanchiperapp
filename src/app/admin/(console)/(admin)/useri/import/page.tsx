import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageTitle } from "@/components/ui";
import { CsvImport } from "./csv-import";

export const metadata: Metadata = { title: "Import useri" };

export default function ImportPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/useri" className="text-sm font-semibold text-muted hover:text-ink">Înapoi la useri</Link>
      <PageTitle title="Import useri din CSV" />
      <Card className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 text-sm text-muted">
          <p>Coloane: <span className="font-semibold text-ink">email, prenume, nume, taguri</span>. Prima linie conține numele coloanelor.</p>
          <p>În coloana taguri poți scrie numere sau denumiri, separate prin punct și virgulă: <span className="font-semibold text-ink">3; 5</span> sau <span className="font-semibold text-ink">MentorMed 3; MentorMed 5</span>. Tagurile care nu există se creează automat.</p>
          <p>Importul creează conturile, dar nu trimite emailuri. Invitațiile se trimit din pagina Invitații, în loturi.</p>
        </div>
        <CsvImport />
      </Card>
    </div>
  );
}
