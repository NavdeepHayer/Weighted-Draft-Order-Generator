import { useCallback, useMemo, useState } from "react";
import type { Entrant, Scheme } from "../types";
import {
  computeWeights,
  simulateFirstPick,
  simulateFullDrafts,
  weightedDraft,
} from "../lib/lottery";
import { rngFactory } from "../lib/rng";

export type Matrix = { countsByTeamPick: number[][]; averages: number[] };
export type DraftPick = { id: string; name: string };

const STORAGE_KEY = "wdraft_state";

type PersistShape = {
  entrants: Entrant[];
  scheme: Scheme;
  seed: string;
};

function readStorage(): PersistShape | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistShape>;
    const entrants = Array.isArray(parsed.entrants) ? parsed.entrants : [];
    const scheme: Scheme =
      parsed.scheme === "custom" || parsed.scheme === "inverse" ? parsed.scheme : "inverse";
    const seed = typeof parsed.seed === "string" ? parsed.seed : "";
    return { entrants, scheme, seed };
  } catch {
    return null;
  }
}

export function useLottery(initialEntrants: Entrant[] = []) {
  // Synchronous hydration to avoid flicker:
  const fromStorage = (() => {
    const s = readStorage();
    // Use saved entrants only if they’re non-empty; otherwise keep seed data
    if (s && s.entrants.length > 0) return s;
    return { entrants: initialEntrants, scheme: "inverse" as Scheme, seed: "" };
  })();

  // Core knobs (hydrated immediately)
  const [entrants, setEntrants] = useState<Entrant[]>(fromStorage.entrants);
  const [scheme, setScheme] = useState<Scheme>(fromStorage.scheme);
  const [seed, setSeed] = useState<string>(fromStorage.seed);
  const [trials, setTrials] = useState<number>(1000);

  // Outputs
  const [order, setOrder] = useState<DraftPick[]>([]);
  const [simFirst, setSimFirst] = useState<Map<string, number>>();
  const [matrix, setMatrix] = useState<Matrix>();

  // Derived
  const weighted = useMemo(() => computeWeights(entrants, scheme), [entrants, scheme]);

  // Actions
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

  // Persistence
  const save = useCallback(() => {
    const data: PersistShape = { entrants, scheme, seed };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }, [entrants, scheme, seed]);

  const load = useCallback(() => {
    const s = readStorage();
    if (!s) return false;

    // Only replace entrants if the saved list is non-empty; otherwise keep current
    if (s.entrants.length > 0) setEntrants(s.entrants);
    setScheme(s.scheme);
    setSeed(s.seed);

    // Clear computed outputs after loading a new base state
    setOrder([]);
    setSimFirst(undefined);
    setMatrix(undefined);
    return true;
  }, []);

  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }, []);

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
    entrants, scheme, seed, trials,
    order, simFirst, matrix, weighted,

    // setters
    setEntrants, setScheme, setSeed, setTrials,

    // actions
    draw, runSimFirst, runSimFull, save, load, reset, clearSaved,
  };
}
