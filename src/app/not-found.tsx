import { Compass } from "@phosphor-icons/react/dist/ssr";
import { LinkButton } from "@/components/ui";
import { Wordmark } from "@/components/brand";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Wordmark />
      <span className="flex size-16 items-center justify-center rounded-full bg-violet-soft text-violet"><Compass size={32} aria-hidden /></span>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Pagina nu a fost găsită</h1>
        <p className="max-w-[48ch] text-muted">Linkul poate fi vechi sau resursa nu mai este disponibilă pentru contul tău.</p>
      </div>
      <LinkButton href="/feed" className="rounded-full">Înapoi la resurse</LinkButton>
    </main>
  );
}
