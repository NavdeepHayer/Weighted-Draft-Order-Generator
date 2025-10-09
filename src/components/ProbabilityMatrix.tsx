import type { WeightedEntrant } from "../lib/lottery";

export default function ProbabilityMatrix({
  teams, countsByTeamPick, trials, averages,
}: {
  teams: WeightedEntrant[];
  countsByTeamPick: number[][];
  trials: number;
  averages: number[];
}) {
  if (!countsByTeamPick.length) return null;
  const n = teams.length;
  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Full Probability Matrix (by pick)</h2>
        <span className="text-xs text-slate-400">Based on {trials.toLocaleString()} simulated full drafts</span>
      </div>
      <div className="overflow-auto max-h-[480px]">
        <table className="text-sm min-w-[640px] w-full">
          <thead>
            <tr>
              <th className="sticky left-0 bg-slate-900/60 backdrop-blur px-2 py-1 text-left">Team</th>
              {Array.from({ length: n }, (_, i) => (
                <th key={i} className="px-2 py-1 text-right">#{i + 1}</th>
              ))}
              <th className="px-2 py-1 text-right">Avg</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, idx) => (
              <tr key={t.id}>
                <td className="sticky left-0 bg-slate-900/60 backdrop-blur px-2 py-1 text-left">{t.name}</td>
                {countsByTeamPick[idx].map((c, i) => (
                  <td key={i} className="px-2 py-1 text-right">{((c / trials) * 100).toFixed(1)}%</td>
                ))}
                <td className="px-2 py-1 text-right font-semibold">{averages[idx].toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
