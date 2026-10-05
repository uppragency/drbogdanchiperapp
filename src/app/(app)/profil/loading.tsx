import { getTx } from "@/lib/i18n";

const bar = "animate-pulse rounded-control bg-surface2";

// Mirrors the profile: hero with avatar, tab row, four stat tiles, two cards.
export default async function Loading() {
  const tx = await getTx();
  return (
    <div aria-busy="true" aria-label={tx("Se încarcă", "Loading")} className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center gap-5 rounded-[28px] bg-surface2/60 p-6 md:p-8">
        <div className="size-20 animate-pulse rounded-full bg-surface2" />
        <div className="flex flex-col gap-3"><div className={`${bar} h-7 w-56`} /><div className={`${bar} h-4 w-40`} /></div>
      </div>
      <div className="flex gap-4 border-b border-line pb-3">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className={`${bar} h-5 w-20`} />)}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5"><div className={`${bar} h-8 w-12`} /><div className={`${bar} h-3 w-24`} /></div>)}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className={`${bar} h-56 rounded-card`} />
        <div className={`${bar} h-56 rounded-card`} />
      </div>
    </div>
  );
}
