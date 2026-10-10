import type { Entrant, Scheme } from "../types";

// public/league.json, written by the MCP server (mcp/server.mjs)
export type LeagueFile = {
  updatedAt: string;
  entrants: Entrant[];
  scheme?: Scheme;
  seed?: string;
};

const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : undefined);

export async function fetchLeagueFile(): Promise<LeagueFile | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}league.json`, { cache: "no-store" });
    if (!res.ok) return null;
    const raw = await res.json();
    if (typeof raw?.updatedAt !== "string" || !Array.isArray(raw.entrants)) return null;

    const entrants: Entrant[] = [];
    for (const e of raw.entrants) {
      if (typeof e?.name !== "string" || !e.name.trim()) continue;
      entrants.push({
        id: typeof e.id === "string" ? e.id : crypto.randomUUID(),
        name: e.name.trim(),
        finish: num(e.finish),
        manualWeight: num(e.manualWeight),
      });
    }
    if (entrants.length === 0) return null;

    return {
      updatedAt: raw.updatedAt,
      entrants,
      scheme: raw.scheme === "custom" || raw.scheme === "inverse" ? raw.scheme : undefined,
      seed: typeof raw.seed === "string" ? raw.seed : undefined,
    };
  } catch {
    // No league file (or the host served its HTML fallback instead): nothing to apply
    return null;
  }
}
