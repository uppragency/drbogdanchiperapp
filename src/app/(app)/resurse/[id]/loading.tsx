import { getTx } from "@/lib/i18n";

export default async function Loading() {
  const tx = await getTx();
  return (
    <div aria-busy="true" aria-label={tx("Se încarcă", "Loading")} className="mx-auto grid w-full max-w-6xl gap-8 px-4 pt-10 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
      <div className="hidden animate-pulse rounded-card bg-surface2 h-72 lg:block" />
      <div className="flex flex-col gap-5">
        <div className="animate-pulse rounded-card bg-surface2 h-6 w-32" />
        <div className="animate-pulse rounded-card bg-surface2 h-[480px]" />
      </div>
      <div className="hidden animate-pulse rounded-card bg-surface2 h-72 lg:block" />
    </div>
  );
}
