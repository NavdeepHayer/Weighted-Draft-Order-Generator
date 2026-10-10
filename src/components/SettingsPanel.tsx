import type { Scheme } from "../types";
import { Button, Card, CardContent, CardHeader, CardTitle } from "./ui";
import { cn } from "./ui/utils";

const SCHEMES: { value: Scheme; label: string; hint: string }[] = [
  {
    value: "inverse",
    label: "Inverse finish",
    hint: "Weight equals finishing position, so last place gets the most balls.",
  },
  {
    value: "custom",
    label: "Manual weights",
    hint: "Only the Weight column counts. Finish is ignored.",
  },
];

export default function SettingsPanel({
  scheme, setScheme, seed, setSeed,
  onDraw, onSimFirst, onSimFull,
  trials, setTrials,
  className,
}: {
  scheme: Scheme;
  setScheme: (s: Scheme) => void;
  seed: string;
  setSeed: (s: string) => void;
  onDraw: () => void;
  onSimFirst: () => void;
  onSimFull: () => void;
  trials: number;
  setTrials: (n: number) => void;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>The draw</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div>
          <div className="eyebrow mb-1.5">Weighting</div>
          <div role="radiogroup" aria-label="Weighting" className="grid grid-cols-2 gap-1 rounded-lg bg-ink-950/70 p-1">
            {SCHEMES.map((s) => (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={scheme === s.value}
                onClick={() => setScheme(s.value)}
                className={cn(
                  "rounded-md px-2 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-flame-400",
                  scheme === s.value
                    ? "bg-ink-700 text-bone shadow-sm"
                    : "text-fog hover:text-bone"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-fog">
            {SCHEMES.find((s) => s.value === scheme)?.hint}
          </p>
        </div>

        <label>
          <span className="eyebrow mb-1.5 block">Seed (optional)</span>
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="Blank for true random"
            className="field"
          />
          <span className="mt-2 block text-sm text-fog">
            The same seed and teams always produce the same order. Share it with the league
            before drawing to keep things transparent.
          </span>
        </label>

        <Button onClick={onDraw} variant="primary" size="lg" className="w-full">
          Generate draft order
        </Button>

        <div className="border-t border-ink-800 pt-4">
          <div className="eyebrow mb-2.5">Simulate</div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2">
            <Button onClick={onSimFirst} size="sm">
              First-pick odds
            </Button>
            <span className="text-sm tabular-nums text-fog">10,000 runs</span>

            <Button onClick={onSimFull} size="sm">
              Full drafts
            </Button>
            <label className="flex items-center gap-2 text-sm text-fog">
              <input
                type="number"
                min={100}
                step={100}
                value={trials}
                onChange={(e) =>
                  setTrials(Math.max(100, Number(e.target.value) || 1000))
                }
                aria-label="Full draft trials"
                className="field w-20 px-2 py-1 text-center tabular-nums"
              />
              runs
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
