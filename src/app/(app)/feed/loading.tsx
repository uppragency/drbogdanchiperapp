import { getTx } from "@/lib/i18n";

const bar = "animate-pulse rounded-control bg-surface2";

// Mirrors the feed: hero, filters column, post cards with cover and text lines, side column.
export default async function Loading() {
  const tx = await getTx();
  return (
    <div aria-busy="true" aria-label={tx("Se încarcă", "Loading")} className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className={`${bar} h-[240px] rounded-[28px] md:h-[320px]`} />
      <div className="mt-10 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <div className="hidden flex-col gap-3 lg:flex">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className={`${bar} h-9`} />)}
        </div>
        <div className="flex flex-col gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
              <div className="flex items-center gap-3">
                <div className="size-10 animate-pulse rounded-full bg-surface2" />
                <div className="flex flex-col gap-2"><div className={`${bar} h-3 w-32`} /><div className={`${bar} h-3 w-20`} /></div>
              </div>
              <div className={`${bar} h-6 w-3/4`} />
              <div className={`${bar} h-3 w-full`} />
              <div className={`${bar} h-3 w-2/3`} />
              <div className="aspect-video w-full animate-pulse rounded-card bg-surface2" />
            </div>
          ))}
        </div>
        <div className="hidden flex-col gap-4 lg:flex">
          <div className={`${bar} h-40 rounded-card`} />
          <div className={`${bar} h-56 rounded-card`} />
        </div>
      </div>
    </div>
  );
}
