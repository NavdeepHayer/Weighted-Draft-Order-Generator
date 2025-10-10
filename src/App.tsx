import { useState } from "react";
import type { Entrant } from "./types";
import EntrantForm from "./components/EntrantForm";
import EntrantsTable from "./components/EntrantsTable";
import SettingsPanel from "./components/SettingsPanel";
import DraftResults from "./components/DraftResults";
import OddsPanel from "./components/OddsPanel";
import LotteryBalls from "./components/LotteryBalls";
import ProbabilityMatrix from "./components/ProbabilityMatrix";
import RevealModal from "./components/RevealModal";
import { useLottery } from "./hooks/useLottery";

export default function App() {
  // Seed entrants for first load; hook will hydrate from storage if present
  const initialEntrants: Entrant[] = [
    { id: crypto.randomUUID(), name: "Avery", finish: 14 },
    { id: crypto.randomUUID(), name: "Sam", finish: 10 },
    { id: crypto.randomUUID(), name: "Riya", finish: 6 },
    { id: crypto.randomUUID(), name: "Liam", finish: 3 },
  ];

  const {
    entrants, setEntrants,
    scheme, setScheme,
    seed, setSeed,
    trials, setTrials,
    order, simFirst, matrix, weighted,
    draw, runSimFirst, runSimFull,
    save, load, reset,
  } = useLottery(initialEntrants);

  // UI-only state for reveal & visibility
  const [hasRevealedOnce, setHasRevealedOnce] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);

  const startReveal = () => {
    if (order.length === 0) return;
    setRevealOpen(true);
  };

  const showFullOrderNow = () => {
    setHasRevealedOnce(true);
    setShowResults(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 text-slate-100">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Weighted Draft Order Generator
          </h1>
          <p className="text-slate-400">Worse finish → higher weight (w = finish).</p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700"
            onClick={save}
          >
            Save
          </button>
          <button
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700"
            onClick={() => {
              const ok = load();
              if (ok) {
                // Hide results until the user reveals or chooses to show
                setHasRevealedOnce(false);
                setShowResults(false);
                setRevealOpen(false);
              }
            }}
          >
            Load
          </button>
          <button
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700"
            onClick={() => {
              reset();
              setHasRevealedOnce(false);
              setShowResults(false);
              setRevealOpen(false);
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
            draw();
            // Hide results until they reveal at least once or hit "Show Full Order Now"
            setHasRevealedOnce(false);
            setShowResults(false);
            setRevealOpen(false);
          }}
          onSimFirst={runSimFirst}
          onSimFull={runSimFull}
        />
      </section>

      {/* Actions for reveal vs instant show */}
      {order.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={startReveal}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold"
          >
            Start Live Reveal
          </button>
          <button
            onClick={showFullOrderNow}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700"
          >
            Show Full Order Now
          </button>
        </div>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {/* HIDE full order until they’ve revealed once or clicked “Show Full Order Now” */}
        {showResults && hasRevealedOnce ? (
          <DraftResults order={order} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-slate-400">
            Generate an order, then <span className="text-slate-200">Start Live Reveal</span> or{" "}
            <span className="text-slate-200">Show Full Order Now</span>.
            {order.length > 0 && !hasRevealedOnce && (
              <div className="mt-2 text-sm">
                (Draft order is hidden until reveal completes or you choose to show it.)
              </div>
            )}
          </div>
        )}
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

      {/* Modal lives at root so it overlays everything */}
      <RevealModal
        open={revealOpen}
        draftOrder={order.map((o) => o.name)}
        auto
        revealEveryMs={2600}
        holdSpotlightMs={1100}
        onClose={() => setRevealOpen(false)}
        onFinished={() => {
          setHasRevealedOnce(true);
          setShowResults(true);
        }}
      />

      <footer className="mt-10 text-xs text-slate-500">
        <p>Pro tip: share your seed value with the league before drawing to keep it transparent.</p>
      </footer>
    </div>
  );
}
