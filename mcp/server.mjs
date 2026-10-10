#!/usr/bin/env node
// MCP server for the draft lottery app.
// Its tools read and write public/league.json, which the app applies on load
// and again whenever the file changes.
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const LEAGUE_FILE = fileURLToPath(new URL("../public/league.json", import.meta.url));

async function readLeague() {
  try {
    return JSON.parse(await readFile(LEAGUE_FILE, "utf8"));
  } catch {
    return null;
  }
}

// Mirrors computeWeights in src/lib/lottery.ts
function describe(league) {
  const scheme = league.scheme ?? "inverse";
  const n = league.entrants.length;
  const weights = league.entrants.map((e) =>
    scheme === "inverse" ? Math.max(1, e.finish ?? n) : Math.max(0, e.manualWeight ?? 0),
  );
  const total = weights.reduce((s, w) => s + w, 0);
  const rows = league.entrants.map((e, i) => {
    const pct = total > 0 ? ((weights[i] / total) * 100).toFixed(2) : "0.00";
    return `${String(e.finish ?? "-").padStart(3)}  ${e.name}  (weight ${weights[i]}, first pick ${pct}%)`;
  });
  return [
    `${n} entrants, scheme: ${scheme}${league.seed ? `, seed: "${league.seed}"` : ""}`,
    ...rows,
  ].join("\n");
}

const text = (s) => ({ content: [{ type: "text", text: s }] });

const server = new McpServer({ name: "draft-order", version: "1.0.0" });

server.registerTool(
  "get_entrants",
  {
    title: "Get entrants",
    description:
      "Read the teams currently loaded into the draft lottery app, with each team's weight and first-pick odds.",
    inputSchema: {},
  },
  async () => {
    const league = await readLeague();
    if (!league) return text("No league has been set yet.");
    return text(describe(league));
  },
);

server.registerTool(
  "set_entrants",
  {
    title: "Set entrants",
    description:
      "Replace every team in the draft lottery app. Use this when the user shares last season's " +
      "standings as a screenshot or a list of names. List teams best finish first. Leave out icons " +
      "the standings site adds next to a name (trophies, playoff markers); keep emoji that are part " +
      "of the name itself.",
    inputSchema: {
      entrants: z
        .array(
          z.object({
            name: z.string().trim().min(1).describe("Team or manager name"),
            finish: z
              .number()
              .int()
              .min(1)
              .optional()
              .describe("Final rank last season, 1 = champion. Defaults to the position in this list."),
            manualWeight: z
              .number()
              .min(0)
              .optional()
              .describe("Lottery weight, only used with the custom scheme"),
          }),
        )
        .min(1),
      scheme: z
        .enum(["inverse", "custom"])
        .optional()
        .describe("inverse: weight = finish, so worse teams get better odds. custom: use manualWeight. Omit to keep the app's current setting."),
      seed: z.string().optional().describe("Seed for a reproducible draw. Omit to keep the app's current seed."),
    },
  },
  async ({ entrants, scheme, seed }) => {
    const league = {
      updatedAt: new Date().toISOString(),
      ...(scheme && { scheme }),
      ...(seed !== undefined && { seed }),
      entrants: entrants.map((e, i) => ({
        id: randomUUID(),
        name: e.name,
        finish: e.finish ?? i + 1,
        ...(e.manualWeight !== undefined && { manualWeight: e.manualWeight }),
      })),
    };
    await mkdir(dirname(LEAGUE_FILE), { recursive: true });
    await writeFile(LEAGUE_FILE, JSON.stringify(league, null, 2) + "\n");
    return text(`Saved. The app picks this up on its next load or within a few seconds in dev.\n\n${describe(league)}`);
  },
);

await server.connect(new StdioServerTransport());
