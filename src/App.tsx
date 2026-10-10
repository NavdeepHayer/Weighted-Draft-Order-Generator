import { useCallback, useEffect, useRef, useState } from "react";
import type { Entrant } from "./types";

import EntrantForm from "./components/EntrantForm";
import EntrantsTable from "./components/EntrantsTable";
import SettingsPanel from "./components/SettingsPanel";
import DraftResults from "./components/DraftResults";
import ProbabilityMatrix from "./components/ProbabilityMatrix";
import RevealModal from "./components/RevealModal";
import ImportModal from "./components/ImportModal";

import { useLottery } from "./hooks/useLottery";
import { fetchLeagueFile } from "./lib/leagueFile";
import { toEntrants, type TeamRow } from "./lib/teamList";
import { Ball, Button, Card, CardHeader, CardTitle } from "./components/ui";
import { LockIcon, UploadIcon } from "./components/ui/icons";
import { cn } from "./components/ui/utils";
import { ToasterProvider, useToast } from "./components/ui/Toaster";

export default function App() {
  return (
    <ToasterProvider>
      <AppInner />
    </ToasterProvider>
  );
}

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    // A stacked tile in the strip; on the wide board, a row with the number at the right
    <div className="grid min-w-0 content-center gap-x-4 gap-y-1 px-3.5 py-3 sm:py-4 wide:grid-cols-[minmax(0,1fr)_auto] wide:px-5">
      <dt className="eyebrow truncate">{label}</dt>
      <dd className="font-display text-3xl font-extrabold leading-none tabular-nums sm:text-4xl wide:col-start-2 wide:row-span-2 wide:row-start-1 wide:self-center wide:text-5xl">
        {value}
      </dd>
      <dd className="line-clamp-2 text-xs leading-snug text-fog wide:text-sm">{note ?? "\u00a0"}</dd>
    </div>
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
    replaceEntrants, applyLeague,
  } = useLottery(initialEntrants);

  // UI-only state: the drawn order stays hidden until it's revealed or shown
  const [orderShown, setOrderShown] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const orderCard = useRef<HTMLDivElement>(null);

  // Toast API
  const { success, info, error } = useToast();

  const hideOrder = useCallback(() => {
    setOrderShown(false);
    setRevealOpen(false);
  }, []);

  // Teams sent over by the MCP server arrive as public/league.json
  useEffect(() => {
    const check = async () => {
      const league = await fetchLeagueFile();
      if (league && applyLeague(league)) {
        hideOrder();
        success(`Loaded ${league.entrants.length} teams from league.json`);
      }
    };
    check();
    window.addEventListener("focus", check);
    // The dev server is where the file changes under a running page
    const poll = import.meta.env.DEV ? window.setInterval(check, 3000) : undefined;
    return () => {
      window.removeEventListener("focus", check);
      window.clearInterval(poll);
    };
  }, [applyLeague, hideOrder, success]);

  const importTeams = (rows: TeamRow[]) => {
    replaceEntrants(toEntrants(rows));
    hideOrder();
    setImportOpen(false);
    success(`Imported ${rows.length} teams. Save to keep them.`);
  };

  const onRevealFinished = useCallback(() => {
    setOrderShown(true);
    success("Reveal complete 🎉");
  }, [success]);

  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
  const favorite = weighted.reduce<(typeof weighted)[number] | undefined>(
    (best, w) => (!best || w.p > best.p ? w : best),
    undefined
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 wide:max-w-[120rem] wide:px-8">
      <header className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <Ball className="h-12 w-12 text-2xl sm:h-14 sm:w-14 sm:text-3xl">1</Ball>
          <div>
            <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.9] tracking-tight sm:text-5xl">
              Draft <span className="text-flame-500">Lottery</span>
            </h1>
            <p className="mt-2 text-sm text-fog">
              Weighted draft order generator. Worse finish, more balls in the hopper.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              const ok = save();
              if (ok) success("Saved ✓");
              else error("Save failed");
            }}
            className="flex-1 sm:flex-none"
          >
            Save
          </Button>

          <Button
            size="sm"
            onClick={() => {
              const ok = load();
              if (ok) {
                hideOrder();
                success("Loaded ✓");
              } else {
                info("Nothing saved yet");
              }
            }}
            className="flex-1 sm:flex-none"
          >
            Load
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              reset();
              hideOrder();
              info("Reset");
            }}
            className="flex-1 sm:flex-none"
          >
            Reset
          </Button>
        </div>
      </header>

      <main className="board">
        <dl className="grid grid-cols-3 divide-x divide-ink-800 rounded-2xl border border-ink-700/80 bg-ink-900/90 [grid-area:stats] wide:grid-cols-1 wide:grid-rows-3 wide:divide-x-0 wide:divide-y">
          <Stat label="Teams" value={entrants.length} note="in the lottery" />
          <Stat
            label="Balls"
            value={Number.isInteger(totalWeight) ? totalWeight : totalWeight.toFixed(1)}
            note="in the hopper"
          />
          <Stat
            label="Best odds"
            value={favorite && favorite.p > 0 ? `${(favorite.p * 100).toFixed(1)}%` : "–"}
            note={favorite && favorite.p > 0 ? favorite.name : undefined}
          />
        </dl>

        <Card className="flex flex-col [grid-area:teams]">
          <CardHeader>
            <CardTitle>The field</CardTitle>
            <Button size="sm" onClick={() => setImportOpen(true)}>
              <UploadIcon />
              <span>
                Import<span className="hidden sm:inline"> from screenshot</span>
              </span>
            </Button>
          </CardHeader>

          {entrants.length > 0 ? (
            <EntrantsTable
              entrants={entrants}
              weighted={weighted}
              scheme={scheme}
              simFirstCounts={simFirst}
              onChange={setEntrants}
              onRemove={(id) => setEntrants((prev) => prev.filter((x) => x.id !== id))}
            />
          ) : (
            <div className="px-5 py-10 text-center">
              <div className="font-display text-2xl font-bold uppercase tracking-wide">No teams yet</div>
              <p className="mx-auto mt-1 max-w-sm text-sm text-fog">
                Import last season's standings from a screenshot or a list, or add teams one at a
                time below.
              </p>
              <Button variant="primary" className="mt-4" onClick={() => setImportOpen(true)}>
                <UploadIcon />
                Import teams
              </Button>
            </div>
          )}

          <div className="mt-auto border-t border-ink-800 p-4 sm:p-5">
            <EntrantForm scheme={scheme} onAdd={(e) => setEntrants((prev) => [...prev, e])} />
          </div>
        </Card>

        {/* As tall as the field beside it, so the panel inside can stick while the field scrolls */}
        <div className="[grid-area:draw] lg:self-stretch">
          <SettingsPanel
            className="lg:sticky lg:top-6"
            scheme={scheme}
            setScheme={setScheme}
            seed={seed}
            setSeed={setSeed}
            trials={trials}
            setTrials={setTrials}
            onDraw={() => {
              draw();
              // Hide results until they reveal at least once or hit "Show full order"
              hideOrder();
              info("Draft generated");
              orderCard.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
        </div>

        <Card ref={orderCard} className="flex scroll-my-6 flex-col [grid-area:order]">
          <CardHeader>
            <CardTitle>Draft order</CardTitle>
            <span
              className={cn(
                "eyebrow flex items-center gap-1.5 rounded-full border px-2.5 py-1",
                order.length === 0
                  ? "border-ink-700"
                  : orderShown
                    ? "border-emerald-500/40 text-emerald-300"
                    : "border-flame-500/50 text-flame-400"
              )}
            >
              {order.length > 0 && !orderShown && <LockIcon width={12} height={12} />}
              {order.length === 0 ? "Not drawn" : orderShown ? "Final" : "Sealed"}
            </span>
          </CardHeader>

          {/* Full order stays sealed until they've revealed it or asked to see it.
              The empty board only earns its space on the wide layout. */}
          <div className={cn("@container", order.length === 0 && "hidden wide:block")}>
            <DraftResults
              order={order}
              slots={entrants.length}
              shown={orderShown}
              odds={new Map(weighted.map((w) => [w.id, w.p]))}
            />
          </div>

          <div className="mt-auto flex flex-col gap-2 p-4 sm:p-5">
            {order.length === 0 ? (
              <p className="text-center text-sm text-fog">
                Hit <span className="font-semibold text-bone">Generate draft order</span> and the
                picks land here, sealed until you reveal them.
              </p>
            ) : orderShown ? (
              <Button onClick={() => setRevealOpen(true)}>Replay reveal</Button>
            ) : (
              <>
                <Button variant="primary" size="lg" onClick={() => setRevealOpen(true)}>
                  Start live reveal
                </Button>
                <Button onClick={() => setOrderShown(true)}>Show full order now</Button>
              </>
            )}
          </div>
        </Card>

        {matrix && (
          <ProbabilityMatrix
            className="[grid-area:matrix]"
            teams={weighted} // ✅ Must be weighted, not order
            countsByTeamPick={matrix.countsByTeamPick}
            trials={trials}
            averages={matrix.averages}
          />
        )}
      </main>

      {/* Modals live at root so they overlay everything */}
      <RevealModal
        open={revealOpen}
        draftOrder={order.map((o) => o.name)}
        auto
        revealEveryMs={1500}
        holdSpotlightMs={2200}
        onClose={() => setRevealOpen(false)}
        onFinished={onRevealFinished}
      />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onApply={importTeams} />

    </div>
  );
}
