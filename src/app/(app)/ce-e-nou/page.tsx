import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { changelog } from "@/lib/changelog";
import { formatDate } from "@/lib/format";
import { getLocale, getTx } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTx())("Ce e nou", "What's new") };
}

export default async function WhatsNewPage() {
  await requireUser();
  const [tx, locale] = await Promise.all([getTx(), getLocale()]);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tx("Ce e nou", "What's new")}</h1>
        <p className="max-w-[60ch] text-muted">{tx("Cele mai recente îmbunătățiri ale platformei.", "The latest improvements to the platform.")}</p>
      </header>
      <ol className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
        {changelog.map((e) => (
          <li key={`${e.date}-${e.title.ro}`} className="flex flex-col gap-1 p-6">
            <time dateTime={e.date} className="text-xs font-semibold uppercase tracking-wider text-muted">{formatDate(`${e.date}T12:00:00Z`, locale)}</time>
            <h2 className="text-lg font-bold leading-snug">{tx(e.title.ro, e.title.en)}</h2>
            <p className="max-w-[65ch] leading-relaxed text-muted">{tx(e.text.ro, e.text.en)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
