import { useMemo, useState, useCallback, useEffect } from "react";
import type { Entrant, Scheme } from "../types";
import { computeWeights, weightedDraft, simulateFirstPick, simulateFullDrafts } from "../lib/lottery";
import { rngFactory } from "../lib/rng";

type Matrix = { countsByTeamPick: number[][]; averages: number[] };

export function useLottery(initialEntrants: Entrant[] = []) {
  const [entrants, setEntrants] = useState<Entrant[]>(initialEntrants);
  const [scheme, setScheme] = useState<Scheme>("inverse");
  const [seed, setSeed] = useState("");
  const [trials, setTrials] = useState(1000);

  const [order, setOrder] = useState<{ id: string; name: string }[]>([]);
  const [simFirst, setSimFirst] = useState<Map<string, number>>();
  const [matrix, setMatrix] = useState<Matrix>();

  const weighted = useMemo(() => computeWeights(entrants, scheme), [entrants, scheme]);

  const draw = useCallback(() => {
    const rand = rngFactory(seed);
    const result = weightedDraft(weighted, rand);
    setOrder(result);
  }, [seed, weighted]);

  const runSimFirst = useCallback(() => {
    setSimFirst(simulateFirstPick(weighted, 10000, seed));
  }, [weighted, seed]);

  const runSimFull = useCallback(() => {
    setMatrix(simulateFullDrafts(weighted, trials, seed));
  }, [weighted, trials, seed]);

  // persistence (localStorage)
  useEffect(() => {
    const raw = localStorage.getItem("wdraft_state");
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      if (Array.isArray(s.entrants)) setEntrants(s.entrants);
      if (s.scheme === "custom" || s.scheme === "inverse") setScheme(s.scheme);
      if (typeof s.seed === "string") setSeed(s.seed);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = useCallback(() => {
    localStorage.setItem("wdraft_state", JSON.stringify({ entrants, scheme, seed }));
  }, [entrants, scheme, seed]);

  const reset = useCallback(() => {
    setEntrants([]);
    setOrder([]);
    setSimFirst(undefined);
    setMatrix(undefined);
    setSeed("");
    setScheme("inverse");
  }, []);

  return {
    // state
    entrants, scheme, seed, trials, order, simFirst, matrix, weighted,
    // setters
    setEntrants, setScheme, setSeed, setTrials,
    // actions
    draw, runSimFirst, runSimFull, save, reset,
  };
}
