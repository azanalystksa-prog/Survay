// Shown during route transitions/data fetches across the authenticated app.
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-8 w-64 rounded-lg bg-line" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-line bg-card p-4 shadow-soft">
            <div className="h-4 w-24 rounded bg-line" />
            <div className="mt-3 h-7 w-16 rounded bg-line" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-card border border-line bg-card p-5 shadow-soft lg:col-span-2">
          <div className="h-5 w-40 rounded bg-line" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-full rounded-lg bg-soft" />
            ))}
          </div>
        </div>
        <div className="rounded-card border border-line bg-card p-5 shadow-soft">
          <div className="h-5 w-32 rounded bg-line" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 w-full rounded-xl bg-soft" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
