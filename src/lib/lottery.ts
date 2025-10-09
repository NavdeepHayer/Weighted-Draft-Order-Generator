import type { Entrant, Scheme } from "../types";
import { rngFactory } from "./rng";

export type WeightedEntrant = Entrant & { weight: number; p: number };

export function toNumber(x: unknown, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

export function computeWeights(list: Entrant[], scheme: Scheme): WeightedEntrant[] {
  const withW = list.map((e) => {
    let w = 0;
    if (scheme === "inverse") {
      const finish = toNumber(e.finish, list.length); // default worst
      w = Math.max(1, finish);                        // 1..N (worse finish => larger weight)
    } else {
      w = Math.max(0, toNumber(e.manualWeight, 0));
    }
    return { ...e, weight: w, p: 0 };
  });
  const total = withW.reduce((s, e) => s + e.weight, 0);
  return withW.map((e) => ({ ...e, p: total > 0 ? e.weight / total : 0 }));
}

export function weightedDraft(list: WeightedEntrant[], rand: () => number): WeightedEntrant[] {
  const pool = list.map((e) => ({ ...e }));
  const order: WeightedEntrant[] = [];
  while (pool.length > 0) {
    const totalW = pool.reduce((s, e) => s + e.weight, 0);
    if (totalW <= 0) break;
    let r = rand() * totalW;
    let pickedIdx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r <= 0) { pickedIdx = i; break; }
    }
    const [picked] = pool.splice(pickedIdx, 1);
    order.push(picked);
  }
  if (order.length < list.length) {
    const zeros = list.filter((e) => !order.find((o) => o.id === e.id));
    for (let i = zeros.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [zeros[i], zeros[j]] = [zeros[j], zeros[i]];
    }
    order.push(...zeros);
  }
  return order;
}

export function simulateFirstPick(list: WeightedEntrant[], trials: number, seed?: string) {
  const rand = rngFactory(seed);
  const counts = new Map(list.map((e) => [e.id, 0]));
  for (let t = 0; t < trials; t++) {
    const order = weightedDraft(list, rand);
    if (order[0]) counts.set(order[0].id, (counts.get(order[0].id) || 0) + 1);
  }
  return counts; // teamId -> count at #1
}

export function simulateFullDrafts(list: WeightedEntrant[], trials: number, seed?: string) {
  const n = list.length;
  const rand = rngFactory(seed);
  const idToIdx = new Map(list.map((e, i) => [e.id, i]));
  const countsByTeamPick = Array.from({ length: n }, () => Array(n).fill(0));
  for (let t = 0; t < trials; t++) {
    const order = weightedDraft(list, rand);
    for (let pick = 0; pick < order.length; pick++) {
      const teamIdx = idToIdx.get(order[pick].id)!;
      countsByTeamPick[teamIdx][pick] += 1;
    }
  }
  const averages = countsByTeamPick.map((row) => {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += (i + 1) * (row[i] / trials);
    return sum;
  });
  return { countsByTeamPick, averages };
}
