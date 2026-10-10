import type { Entrant } from "../types";

export type TeamRow = { name: string; finish: number };

// "3. NBA Ballers", "*3 NBA Ballers", "3) NBA Ballers" -> rank 3
const LEADING_RANK = /^\W{0,2}(\d{1,3})\s*[.):]?\s+(?=\S)/;
const RANK_CELL = /^\W{0,2}(\d{1,3})\W?$/;
// W-L or W-L-T, where the stats columns start in a pasted standings row
const RECORD = /\s\d+-\d+(-\d+)?(\s|$)/;
const HEADER = /^(rank|pos|#)\b.*\bteam\b/i;

const hasLetter = (s: string) => /\p{L}/u.test(s);

/**
 * One team per line, best finish first. A leading number is taken as the finish;
 * without one the line's position is used. Rows copied out of a standings table
 * (tab-separated, or with a W-L-T record after the name) are trimmed down to the name.
 */
export function parseTeamList(text: string): TeamRow[] {
  const rows: TeamRow[] = [];
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.trim();
    if (!line || HEADER.test(line)) continue;

    let finish: number | undefined;
    let name: string | undefined;

    if (line.includes("\t")) {
      const cells = line.split("\t").map((c) => c.trim()).filter(Boolean);
      const rank = cells[0]?.match(RANK_CELL);
      if (rank) finish = Number(rank[1]);
      name = cells.slice(rank ? 1 : 0).find(hasLetter);
    } else {
      const rank = line.match(LEADING_RANK);
      if (rank) {
        finish = Number(rank[1]);
        line = line.slice(rank[0].length);
      }
      const stats = line.search(RECORD);
      name = (stats > 0 ? line.slice(0, stats) : line).trim();
    }

    if (!name) continue;
    rows.push({ name, finish: finish && finish > 0 ? finish : rows.length + 1 });
  }
  return rows;
}

export function formatTeamList(rows: TeamRow[]): string {
  return rows.map((r) => `${r.finish}. ${r.name}`).join("\n");
}

export function toEntrants(rows: TeamRow[]): Entrant[] {
  return rows.map((r) => ({ id: crypto.randomUUID(), name: r.name, finish: r.finish }));
}
