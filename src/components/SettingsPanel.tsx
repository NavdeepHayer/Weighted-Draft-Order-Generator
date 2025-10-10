import type { Scheme } from "../types";
import { Button } from "./ui";

export default function SettingsPanel({
  scheme, setScheme, seed, setSeed,
  onDraw, onSimFirst, onSimFull,
  trials, setTrials,
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
}) {
  return (
    <aside className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-4 flex flex-col gap-3">
      <h2 className="font-semibold">Settings</h2>

      <label className="flex items-center gap-2">
        <input
          type="radio"
          className="accent-indigo-500"
          checked={scheme === "inverse"}
          onChange={() => setScheme("inverse")}
        />
        <span>
          Use <span className="font-semibold">inverse finish</span> (w = finish)
        </span>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="radio"
          className="accent-indigo-500"
          checked={scheme === "custom"}
          onChange={() => setScheme("custom")}
        />
        <span>
          Use <span className="font-semibold">manual weights</span> only
        </span>
      </label>

      <div>
        <label className="block text-sm text-slate-400">
          Optional seed (for reproducible draws)
        </label>
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="leave blank for true random"
          className="w-full px-3 py-2 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <Button
        onClick={onDraw}
        variant="primary"
        className="mt-2"
      >
        Generate Draft Order
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={onSimFirst} size="sm">
          Simulate 10,000 first-pick odds
        </Button>
        <Button onClick={onSimFull} size="sm">
          Simulate Full Drafts
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-400">Trials:</label>
        <input
          type="number"
          min={100}
          step={100}
          value={trials}
          onChange={(e) =>
            setTrials(Math.max(100, Number(e.target.value) || 1000))
          }
          className="w-28 px-3 py-2 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </aside>
  );
}
