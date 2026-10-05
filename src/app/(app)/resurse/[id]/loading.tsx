import { getTx } from "@/lib/i18n";

const bar = "animate-pulse rounded-control bg-surface2";

// Mirrors the resource page: breadcrumb, 16:9 player, title, meta, actions, description, comments.
export default async function Loading() {
  const tx = await getTx();
  return (
    <div aria-busy="true" aria-label={tx("Se încarcă", "Loading")} className="mx-auto grid w-full max-w-6xl gap-8 px-4 pt-10 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex flex-col gap-5">
        <div className={`${bar} h-4 w-40`} />
        <div className="aspect-video w-full animate-pulse rounded-card bg-surface2" />
        <div className={`${bar} h-8 w-4/5`} />
        <div className="flex gap-3"><div className={`${bar} h-4 w-24`} /><div className={`${bar} h-4 w-20`} /></div>
        <div className="flex gap-3"><div className={`${bar} h-11 w-40`} /><div className={`${bar} h-11 w-11`} /></div>
        <div className="flex flex-col gap-2 pt-2">
          <div className={`${bar} h-3 w-full`} /><div className={`${bar} h-3 w-full`} /><div className={`${bar} h-3 w-2/3`} />
        </div>
        <div className={`${bar} mt-4 h-24 rounded-card`} />
      </div>
      <div className="hidden flex-col gap-4 lg:flex">
        <div className={`${bar} h-48 rounded-card`} />
        <div className={`${bar} h-32 rounded-card`} />
      </div>
    </div>
  );
}
