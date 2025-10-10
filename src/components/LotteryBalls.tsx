// Mobile-friendly, wraps nicely; uses a local Weighted type so we don't rely on types.ts
type Weighted = { id: string; name: string; weight: number; p: number };

function Dot() {
  return (
    <span
      className="
        inline-block rounded-full
        h-2.5 w-2.5 sm:h-3 sm:w-3
        bg-indigo-400/80
      "
    />
  );
}

export default function LotteryBalls({ weighted }: { weighted: Weighted[] }) {
  if (!weighted?.length) return null;

  const maxWeight = Math.max(...weighted.map((w) => w.weight));
  const scale = maxWeight > 80 ? 0.6 : maxWeight > 40 ? 0.75 : 1;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lottery Balls (visual)</h2>
        <span className="text-slate-400 text-xs">Wraps on mobile · Scaled for large weights</span>
      </div>

      <ul className="space-y-3">
        {weighted.map((t) => (
          <li
            key={t.id}
            className="
              grid items-start gap-3
              grid-cols-1 sm:grid-cols-[auto,1fr,auto]
            "
          >
            {/* Name */}
            <div className="text-slate-200 leading-7">{t.name}</div>

            {/* Dots */}
            <div
              className="flex flex-wrap gap-1"
              style={{ transform: `scale(${scale})`, transformOrigin: "left center" }}
              aria-label={`${t.name} lottery balls`}
            >
              {Array.from({ length: t.weight }).map((_, i) => (
                <Dot key={i} />
              ))}
            </div>

            {/* Count */}
            <div className="text-slate-400 text-sm mt-1 sm:mt-0">w={t.weight}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
