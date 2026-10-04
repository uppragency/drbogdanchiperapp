export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Se încarcă" className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="animate-pulse rounded-[28px] bg-surface2 h-[320px] md:h-[420px]" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <div className="hidden animate-pulse rounded-card bg-surface2 h-72 lg:block" />
        <div className="flex flex-col gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-card bg-surface2 h-64" />
          ))}
        </div>
        <div className="hidden animate-pulse rounded-card bg-surface2 h-72 lg:block" />
      </div>
    </div>
  );
}
