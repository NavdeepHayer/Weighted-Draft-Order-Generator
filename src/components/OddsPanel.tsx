import type { WeightedEntrant } from "../lib/lottery";

export default function OddsPanel({
  weighted, simFirstCounts,
}: {
  weighted: WeightedEntrant[];
  simFirstCounts?: Map<string, number>;
}) {
  const trials = simFirstCounts ? Array.from(simFirstCounts.values()).reduce((a, b) => a + b, 0) : 0;
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-4">
      <h2 className="font-semibold mb-2">First Pick Odds</h2>
      <ul className="grid gap-1 text-slate-200">
        {weighted.map((e) => {
          const pct = e.p * 100;
          const simPct = trials && simFirstCounts ? ((simFirstCounts.get(e.id) || 0) / trials) * 100 : undefined;
          return (
            <li key={e.id}>
              {e.name}: <span className="font-semibold">{pct.toFixed(2)}%</span>
              {simPct !== undefined && <span className="text-slate-400"> ({simPct.toFixed(2)}% sim)</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
