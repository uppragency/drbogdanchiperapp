import Link from "next/link";
import { getTx } from "@/lib/i18n";

export async function LegalCrumbs({ current }: { current: string }) {
  const tx = await getTx();
  return (
    <nav aria-label={tx("Navigare", "Breadcrumb")} className="mb-6 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        <li><Link href="/" className="hover:text-ink hover:underline">{tx("Acasă", "Home")}</Link></li>
        <li aria-hidden>/</li>
        <li aria-current="page" className="font-semibold text-ink">{current}</li>
      </ol>
    </nav>
  );
}
