import type { WeightedEntrant } from "../lib/lottery";
import { Card, CardHeader, CardTitle } from "./ui";

export default function ProbabilityMatrix({
  teams, countsByTeamPick, trials, averages,
  className,
}: {
  teams: WeightedEntrant[];
  countsByTeamPick: number[][];
  trials: number;
  averages: number[];
  className?: string;
}) {
  if (!countsByTeamPick.length) return null;
  const n = teams.length;
  // Shade each cell relative to the likeliest outcome on the board
  const peak = Math.max(1, ...countsByTeamPick.flat());
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Pick probabilities</CardTitle>
        <span className="text-right text-sm text-fog">
          % chance of each pick over {trials.toLocaleString()} simulated drafts
        </span>
      </CardHeader>
      <div className="max-h-[520px] overflow-auto rounded-b-2xl">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm tabular-nums">
          <thead className="eyebrow">
            <tr>
              <th className="sticky left-0 top-0 z-20 bg-ink-900 px-4 py-2.5 text-left font-semibold sm:px-5">Team</th>
              {Array.from({ length: n }, (_, i) => (
                <th key={i} className="sticky top-0 z-10 bg-ink-900 px-2 py-2.5 text-right font-semibold">#{i + 1}</th>
              ))}
              <th className="sticky top-0 z-10 bg-ink-900 px-4 py-2.5 text-right font-semibold sm:px-5">Avg</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, idx) => (
              <tr key={t.id}>
                <td className="sticky left-0 z-10 max-w-[9rem] truncate border-t border-ink-800 bg-ink-900 px-4 py-1.5 text-left font-medium sm:max-w-[14rem] sm:px-5">
                  {t.name}
                </td>
                {countsByTeamPick[idx].map((c, i) => {
                  const heat = c / peak;
                  return (
                    <td
                      key={i}
                      className="border-t border-ink-800 px-2 py-1.5 text-right"
                      style={{
                        backgroundColor: `rgb(255 106 31 / ${(heat * 0.85).toFixed(3)})`,
                        color: heat > 0.6 ? "var(--color-ink-950)" : c === 0 ? "var(--color-ink-600)" : undefined,
                      }}
                    >
                      {((c / trials) * 100).toFixed(1)}
                    </td>
                  );
                })}
                <td className="border-t border-ink-800 px-4 py-1.5 text-right font-semibold sm:px-5">
                  {averages[idx].toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
