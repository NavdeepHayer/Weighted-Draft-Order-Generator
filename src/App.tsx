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
import Button from "./components/ui/Button";
import { Card, CardContent } from "./components/ui/Card";
import { ToasterProvider, useToast } from "./components/ui/Toaster";

export default function App() {
  return (
    <ToasterProvider>
      <AppInner />
    </ToasterProvider>
  );
}

function AppInner() {
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

  // Toast API
  const { success, info, error } = useToast();

  const startReveal = () => {
    if (order.length === 0) return;
    setRevealOpen(true);
  };

  const showFullOrderNow = () => {
    setHasRevealedOnce(true);
    setShowResults(true);
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 text-slate-100">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
            Weighted Draft Order Generator
          </h1>
          <p className="text-slate-400">Worse finish → higher weight (w = finish).</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={() => {
              const ok = save();
              ok ? success("Saved ✓") : error("Save failed");
            }}
            className="w-full sm:w-auto"
          >
            Save
          </Button>

          <Button
            onClick={() => {
              const ok = load();
              if (ok) {
                setHasRevealedOnce(false);
                setShowResults(false);
                setRevealOpen(false);
                success("Loaded ✓");
              } else {
                info("Nothing saved yet");
              }
            }}
            className="w-full sm:w-auto"
          >
            Load
          </Button>

          <Button
            onClick={() => {
              reset();
              setHasRevealedOnce(false);
              setShowResults(false);
              setRevealOpen(false);
              info("Reset");
            }}
            className="w-full sm:w-auto"
          >
            Reset
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent>
            <EntrantForm onAdd={(e) => setEntrants((prev) => [...prev, e])} />
            <div className="h-4" />
            <EntrantsTable
              entrants={entrants}
              onChange={setEntrants}
              onRemove={(id) => setEntrants((prev) => prev.filter((x) => x.id !== id))}
            />
          </CardContent>
        </Card>

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
            info("Draft generated");
          }}
          onSimFirst={() => {
            runSimFirst();
            info("Simulated first-pick odds");
          }}
          onSimFull={() => {
            runSimFull();
            info(`Simulated ${trials.toLocaleString()} full drafts`);
          }}
        />
      </section>

      {/* Actions for reveal vs instant show */}
      {order.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">
          <Button variant="primary" onClick={startReveal} className="w-full sm:w-auto">
            Start Live Reveal
          </Button>
          <Button onClick={showFullOrderNow} className="w-full sm:w-auto">
            Show Full Order Now
          </Button>
        </div>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {/* HIDE full order until they’ve revealed once or clicked “Show Full Order Now” */}
        {showResults && hasRevealedOnce ? (
          <DraftResults order={order} />
        ) : (
          <Card className="bg-slate-900/40 border-dashed">
            <CardContent className="text-slate-400">
              Generate an order, then{" "}
              <span className="text-slate-200">Start Live Reveal</span> or{" "}
              <span className="text-slate-200">Show Full Order Now</span>.
              {order.length > 0 && !hasRevealedOnce && (
                <div className="mt-2 text-sm">
                  (Draft order is hidden until reveal completes or you choose to show it.)
                </div>
              )}
            </CardContent>
          </Card>
        )}
        <OddsPanel weighted={weighted} simFirstCounts={simFirst} />
      </section>

      <LotteryBalls weighted={weighted} />

      {matrix && (
        <ProbabilityMatrix
          teams={weighted} // ✅ Must be weighted, not order
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
          success("Reveal complete 🎉");
        }}
      />

      <footer className="mt-10 text-xs text-slate-500">
        <p>Pro tip: share your seed value with the league before drawing to keep it transparent.</p>
      </footer>
    </div>
  );
}
