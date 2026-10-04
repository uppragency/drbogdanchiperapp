import { getTx } from "@/lib/i18n";

export default async function Loading() {
  const tx = await getTx();
  return (
    <div aria-busy="true" aria-label={tx("Se încarcă", "Loading")} className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="h-10 w-2/3 animate-pulse rounded-control bg-surface2" />
      <div className="h-5 w-1/2 animate-pulse rounded-control bg-surface2" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-card bg-surface2" />
      ))}
    </div>
  );
}
