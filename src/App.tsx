import { useMemo, useState } from "react";
import type { Entrant, Scheme } from "./types";
import { computeWeights, simulateFirstPick, simulateFullDrafts, weightedDraft } from "./lib/lottery";
import { rngFactory } from "./lib/rng";
import EntrantForm from "./components/EntrantForm";
import EntrantsTable from "./components/EntrantsTable";
import SettingsPanel from "./components/SettingsPanel";
import DraftResults from "./components/DraftResults";
import OddsPanel from "./components/OddsPanel";
import LotteryBalls from "./components/LotteryBalls";
import ProbabilityMatrix from "./components/ProbabilityMatrix";

export default function App() {
  const [entrants, setEntrants] = useState<Entrant[]>([
    { id: crypto.randomUUID(), name: "Avery", finish: 14 },
    { id: crypto.randomUUID(), name: "Sam", finish: 10 },
    { id: crypto.randomUUID(), name: "Riya", finish: 6 },
    { id: crypto.randomUUID(), name: "Liam", finish: 3 },
  ]);
  const [scheme, setScheme] = useState<Scheme>("inverse");
  const [seed, setSeed] = useState("");
  const [trials, setTrials] = useState(1000);
  const [order, setOrder] = useState<any[]>([]);
  const [simFirst, setSimFirst] = useState<Map<string, number>>();
  const [matrix, setMatrix] = useState<{ countsByTeamPick: number[][]; averages: number[] }>();

  const weighted = useMemo(() => computeWeights(entrants, scheme), [entrants, scheme]);

  return (
    <div className="max-w-7xl mx-auto p-6 text-slate-100">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Weighted Draft Order Generator</h1>
          <p className="text-slate-400">React + TypeScript + Tailwind. Worse finish → higher weight (w = finish).</p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700"
            onClick={() => {
              localStorage.setItem("wdraft_state", JSON.stringify({ entrants, scheme, seed }));
            }}
          >
            Save
          </button>
          <button
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700"
            onClick={() => {
              const raw = localStorage.getItem("wdraft_state");
              if (!raw) return;
              try {
                const s = JSON.parse(raw);
                setEntrants(Array.isArray(s.entrants) ? s.entrants : []);
                setScheme(s.scheme === "custom" ? "custom" : "inverse");
                setSeed(s.seed || "");
              } catch {}
            }}
          >
            Load
          </button>
          <button
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700"
            onClick={() => {
              setEntrants([]); setOrder([]); setSimFirst(undefined); setMatrix(undefined); setSeed(""); setScheme("inverse");
            }}
          >
            Reset
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-4">
          <EntrantForm onAdd={(e) => setEntrants((prev) => [...prev, e])} />
          <div className="h-4" />
          <EntrantsTable
            entrants={entrants}
            onChange={setEntrants}
            onRemove={(id) => setEntrants((prev) => prev.filter((x) => x.id !== id))}
          />
        </div>
        <SettingsPanel
          scheme={scheme}
          setScheme={setScheme}
          seed={seed}
          setSeed={setSeed}
          trials={trials}
          setTrials={setTrials}
          onDraw={() => {
            const rand = rngFactory(seed);
            const result = weightedDraft(weighted, rand);
            setOrder(result);
          }}
          onSimFirst={() => {
            const counts = simulateFirstPick(weighted, 10000, seed);
            setSimFirst(counts);
          }}
          onSimFull={() => {
            const res = simulateFullDrafts(weighted, trials, seed);
            setMatrix(res);
          }}
        />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <DraftResults order={order} />
        <OddsPanel weighted={weighted} simFirstCounts={simFirst} />
      </section>

      <LotteryBalls weighted={weighted} />

      {matrix && (
        <ProbabilityMatrix
          teams={weighted}
          countsByTeamPick={matrix.countsByTeamPick}
          trials={trials}
          averages={matrix.averages}
        />
      )}

      <footer className="mt-10 text-xs text-slate-500">
        <p>Pro tip: share your seed value with the league before drawing to keep it transparent.</p>
      </footer>
    </div>
  );
}
