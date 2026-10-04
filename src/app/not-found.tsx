import { Compass } from "@phosphor-icons/react/dist/ssr";
import { LinkButton } from "@/components/ui";
import { Wordmark } from "@/components/brand";
import { getTx } from "@/lib/i18n";

export default async function NotFound() {
  const tx = await getTx();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Wordmark />
      <span className="flex size-16 items-center justify-center rounded-full bg-violet-soft text-violet"><Compass size={32} aria-hidden /></span>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{tx("Pagina nu a fost găsită", "Page not found")}</h1>
        <p className="max-w-[48ch] text-muted">{tx("Linkul poate fi vechi sau resursa nu mai este disponibilă pentru contul tău.", "The link may be outdated, or the resource is no longer available for your account.")}</p>
      </div>
      <LinkButton href="/feed" className="rounded-full">{tx("Înapoi la resurse", "Back to resources")}</LinkButton>
    </main>
  );
}
