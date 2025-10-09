import type { WeightedEntrant } from "../lib/lottery";

export default function LotteryBalls({ weighted }: { weighted: WeightedEntrant[] }) {
  const maxW = Math.max(1, ...weighted.map((e) => e.weight));
  const scale = maxW > 30 ? 30 / maxW : 1;
  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Lottery Balls (visual)</h2>
        <span className="text-xs text-slate-400">Scaled if very large</span>
      </div>
      <div className="mt-3 grid gap-2">
        {weighted.map((e) => {
          const balls = Math.max(1, Math.round(e.weight * scale));
          return (
            <div key={e.id} className="flex items-center gap-3">
              <div className="w-40 truncate">{e.name}</div>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: balls }, (_, i) => (
                  <span key={i} className="inline-block h-3 w-3 rounded-full bg-indigo-500/80 ring-1 ring-indigo-300/40" />
                ))}
              </div>
              <div className="text-xs text-slate-400 ml-2">w={e.weight}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
