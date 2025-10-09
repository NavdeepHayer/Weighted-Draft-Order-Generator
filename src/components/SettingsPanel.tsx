import type { Scheme } from "../types";

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
        <input type="radio" className="accent-indigo-500" checked={scheme === "inverse"} onChange={() => setScheme("inverse")} />
        <span>Use <span className="font-semibold">inverse finish</span> (w = finish)</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="radio" className="accent-indigo-500" checked={scheme === "custom"} onChange={() => setScheme("custom")} />
        <span>Use <span className="font-semibold">manual weights</span> only</span>
      </label>
      <div>
        <label className="block text-sm text-slate-400">Optional seed (for reproducible draws)</label>
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="leave blank for true random"
          className="w-full px-3 py-2 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <button onClick={onDraw} className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold">
        Generate Draft Order
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onSimFirst} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700">Simulate 10,000 first-pick odds</button>
        <button onClick={onSimFull} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700">Simulate Full Drafts</button>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-400">Trials:</label>
        <input
          type="number" min={100} step={100} value={trials}
          onChange={(e) => setTrials(Math.max(100, Number(e.target.value) || 1000))}
          className="w-28 px-3 py-2 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </aside>
  );
}
