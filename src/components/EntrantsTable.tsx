import type * as React from "react";
import type { Entrant, Scheme } from "../types";
import type { WeightedEntrant } from "../lib/lottery";
import { Ball } from "./ui";
import { CloseIcon } from "./ui/icons";
import { cn } from "./ui/utils";

// Wide: finish | team | (weight, manual scheme only) | balls | odds | remove.
// Narrow: balls and odds drop to a second line and only the number that drives them is shown.
const ROW = "grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 sm:px-5";
const COLS = {
  inverse: "sm:grid-cols-[3rem_minmax(0,1fr)_var(--visual)_4rem_2rem]",
  custom: "sm:grid-cols-[3rem_minmax(0,1fr)_4.5rem_var(--visual)_4rem_2rem]",
};

// Past this many, a row of balls stops being countable and a bar reads better
const MAX_BALLS = 20;
// Ball plus the gap after it
const BALL_PITCH = 14;

export default function EntrantsTable({
  entrants,
  weighted,
  scheme,
  simFirstCounts,
  onChange,
  onRemove,
}: {
  entrants: Entrant[];
  weighted: WeightedEntrant[];
  scheme: Scheme;
  simFirstCounts?: Map<string, number>;
  onChange: (next: Entrant[]) => void;
  onRemove: (id: string) => void;
}) {
  const custom = scheme === "custom";
  const byId = new Map(weighted.map((w) => [w.id, w]));
  const maxP = Math.max(0, ...weighted.map((w) => w.p));
  const showBalls = weighted.every((w) => Number.isInteger(w.weight) && w.weight <= MAX_BALLS);
  // Just wide enough for the longest row of balls (and the column heading), so names get the rest
  const mostBalls = Math.max(0, ...weighted.map((w) => w.weight));
  const visualWidth = showBalls ? `${Math.max(136, mostBalls * BALL_PITCH)}px` : "11rem";
  const simTrials = simFirstCounts
    ? Array.from(simFirstCounts.values()).reduce((a, b) => a + b, 0)
    : 0;

  const update = (id: string, patch: Partial<Entrant>) =>
    onChange(entrants.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const numberOrBlank = (v: string) => (v === "" ? undefined : Number(v));

  // With manual weights the finish is only for reference: dimmed, and dropped on narrow screens
  const finishUnused = custom && "hidden opacity-40 sm:block";
  const row = cn(ROW, COLS[scheme]);
  const visualCol = custom ? "sm:col-start-4" : "sm:col-start-3";
  const oddsCol = custom ? "sm:col-start-5" : "sm:col-start-4";
  const number = "field px-1 py-1.5 text-center font-display text-lg font-bold leading-6 tabular-nums";

  return (
    <div style={{ "--visual": visualWidth } as React.CSSProperties}>
      <div className={cn(row, "eyebrow border-b border-ink-800 py-2.5")}>
        <span className={cn("col-start-1 row-start-1 text-center", finishUnused)}>Finish</span>
        <span className="col-start-2 row-start-1 pl-2">Team</span>
        {custom && (
          <span className="col-start-1 row-start-1 text-center sm:col-start-3">Weight</span>
        )}
        <span className={cn("hidden sm:row-start-1 sm:block", visualCol)}>
          {showBalls ? "Balls in the hopper" : "Share of the hopper"}
        </span>
        <span className={cn("hidden text-right sm:row-start-1 sm:block", oddsCol)}>First pick</span>
      </div>

      <ul className="divide-y divide-ink-800">
        {entrants.map((e) => {
          const w = byId.get(e.id);
          const p = w?.p ?? 0;
          const simPct =
            simTrials && simFirstCounts
              ? ((simFirstCounts.get(e.id) || 0) / simTrials) * 100
              : undefined;
          return (
            <li key={e.id} className={cn(row, "py-1.5 hover:bg-ink-800/40 sm:py-1")}>
              <input
                type="number"
                min={1}
                step={1}
                value={e.finish ?? ""}
                onChange={(ev) => update(e.id, { finish: numberOrBlank(ev.target.value) })}
                aria-label={`Finish for ${e.name}`}
                className={cn(number, "col-start-1 row-start-1", finishUnused)}
              />
              <input
                value={e.name}
                onChange={(ev) => update(e.id, { name: ev.target.value })}
                aria-label="Team name"
                className="field col-start-2 row-start-1 truncate border-transparent bg-transparent px-2 py-1.5 text-[15px] font-medium leading-6 hover:border-ink-700"
              />
              {custom && (
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={e.manualWeight ?? ""}
                  onChange={(ev) => update(e.id, { manualWeight: numberOrBlank(ev.target.value) })}
                  aria-label={`Manual weight for ${e.name}`}
                  placeholder="0"
                  className={cn(number, "col-start-1 row-start-1 sm:col-start-3")}
                />
              )}

              <div className={cn("col-start-2 row-start-2 pl-2 sm:row-start-1 sm:pl-0", visualCol)}>
                {showBalls ? (
                  <div className="flex flex-wrap gap-1" aria-hidden>
                    {Array.from({ length: w?.weight ?? 0 }, (_, i) => (
                      <Ball key={i} className="h-2.5 w-2.5" />
                    ))}
                  </div>
                ) : (
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className="h-full rounded-full bg-flame-500 transition-[width] duration-300"
                      style={{ width: `${maxP > 0 ? (p / maxP) * 100 : 0}%` }}
                    />
                  </div>
                )}
              </div>
              <div className={cn("col-start-3 row-start-2 text-right leading-tight sm:row-start-1", oddsCol)}>
                <div className="text-sm font-semibold tabular-nums">{(p * 100).toFixed(2)}%</div>
                {simPct !== undefined && (
                  <div className="text-[11px] tabular-nums text-fog">sim {simPct.toFixed(1)}%</div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onRemove(e.id)}
                aria-label={`Remove ${e.name}`}
                className={cn(
                  "col-start-3 row-start-1 flex h-8 w-8 items-center justify-center justify-self-end rounded-md text-fog transition hover:bg-rose-500/15 hover:text-rose-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-flame-400",
                  custom ? "sm:col-start-6" : "sm:col-start-5"
                )}
              >
                <CloseIcon />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
