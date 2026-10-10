import { parseTeamList, type TeamRow } from "./teamList";

type Box = { x0: number; y0: number; x1: number; y1: number };
export type OcrWord = Box & { text: string; confidence: number };
type Read = { name: string; confidence: number };
// cell: where on the page this row's team name sits; textHeight: how tall its words are
type FoundRow = Read & { rank: number; cell: Box; textHeight: number };

const RECORD = /^\d+-\d+(-\d+)?$/; // W-L or W-L-T
const STAT = /^[\d.,:%+\-–—]+$/;
const PUNCTUATION = /^[?!&+.'-]+$/;
const HEADER = /^(rank|pos|#|team|name|manager)$/i;
const hasAlnum = (s: string) => /[\p{L}\p{N}]/u.test(s);
const letterCount = (s: string) => (s.match(/\p{L}/gu) ?? []).length;
const median = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

// Where the stats columns begin: the W-L-T record, else a trailing run of numbers
function statsStart(words: OcrWord[]): number {
  const record = words.findIndex((w) => RECORD.test(w.text));
  if (record > 0) return record;
  let i = words.length;
  while (i > 0 && STAT.test(words[i - 1].text)) i--;
  return words.length - i >= 2 ? i : words.length;
}

function toName(words: OcrWord[]): Read {
  const kept = words
    // icons come through as stray symbols; only confident, ordinary punctuation is kept
    .filter((w) => hasAlnum(w.text) || (PUNCTUATION.test(w.text) && w.confidence >= 75));
  const name = kept
    .map((w) => w.text)
    .join(" ")
    .replace(/[’‘]/g, "'")
    .replace(/'{2,}/g, "'");
  const confidence = kept.reduce((sum, w) => sum + w.confidence, 0) / (kept.length || 1);
  return { name, confidence };
}

/**
 * Pull team names out of the OCR'd lines of a standings table.
 * Each row reads roughly "<rank> <avatar junk> <team name> <trophy junk> <stats...>",
 * so the name is found by position rather than by guessing which tokens are junk.
 */
export function extractRows(lines: OcrWord[][], width: number): FoundRow[] {
  const candidates = lines
    .map((words) => {
      const cut = statsStart(words);
      return { words: words.slice(0, cut), stats: words[cut] as OcrWord | undefined };
    })
    .filter((c) => c.words.some((w) => letterCount(w.text) >= 2));

  // In a stats table, lines without stats are headers and captions
  const withStats = candidates.filter((c) => c.stats);
  const isTable = withStats.length >= 2 && withStats.length >= candidates.length / 2;
  const rows = isTable ? withStats : candidates;
  if (!isTable && rows.length > 1 && rows[0].words.every((w) => HEADER.test(w.text))) rows.shift();
  if (rows.length === 0) return [];

  // Names are left-aligned, so their first word starts at the same x on nearly every row.
  // Ranks and avatars line up too, but aren't words: take the leftmost column that is.
  const tol = width * 0.012;
  const at = (row: OcrWord[], x: number) => row.findIndex((w) => Math.abs(w.x0 - x) <= tol);
  let nameX: number | null = null;
  for (const x of rows.flatMap((r) => r.words.map((w) => w.x0)).sort((a, b) => a - b)) {
    const hits = rows.map((r) => r.words[at(r.words, x)]).filter(Boolean);
    const wordy = hits.filter((w) => letterCount(w.text) >= 2);
    if (hits.length >= rows.length * 0.7 && wordy.length >= hits.length * 0.7) {
      nameX = x;
      break;
    }
  }

  return rows.map(({ words, stats }) => {
    let start = 0;
    if (nameX !== null) {
      const x = nameX;
      start = at(words, x);
      if (start < 0) start = words.findIndex((w) => w.x0 >= x - tol);
      if (start < 0) start = 0;
    }
    const rank = start > 0 ? Number(words[0].text.replace(/\D/g, "")) : NaN;
    const named = words.slice(start);
    const cell = {
      x0: nameX ?? named[0].x0,
      x1: stats ? stats.x0 : width,
      y0: Math.min(...named.map((w) => w.y0)),
      y1: Math.max(...named.map((w) => w.y1)),
    };
    const textHeight = median(
      named.filter((w) => letterCount(w.text) >= 2).map((w) => w.y1 - w.y0),
    );
    return { ...toName(named), rank, cell, textHeight };
  }).filter((r) => r.name);
}

function toTeams(found: FoundRow[]): TeamRow[] {
  // Trust the printed ranks only if they form an unbroken run (a misread digit breaks it)
  const ranks = found.map((r) => r.rank);
  const ranksOk =
    ranks.every((r) => r >= 1) &&
    new Set(ranks).size === ranks.length &&
    Math.max(...ranks) - Math.min(...ranks) === ranks.length - 1;
  return found.map((r, i) => ({ name: r.name, finish: ranksOk ? r.rank : i + 1 }));
}

export function extractTeams(lines: OcrWord[][], width: number): TeamRow[] {
  return toTeams(extractRows(lines, width));
}

// Mobile Safari refuses canvases much bigger than this
const MAX_PIXELS = 12_000_000;
const CONTRAST = 1.6;

/** Scale (part of) the screenshot and clean it up for OCR: grey, dark-on-light, crisper edges. */
function render(bitmap: ImageBitmap, scale: number, region?: Box): HTMLCanvasElement {
  const src = region ?? { x0: 0, y0: 0, x1: bitmap.width, y1: bitmap.height };
  const w = src.x1 - src.x0;
  const h = src.y1 - src.y0;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, src.x0, src.y0, w, h, 0, 0, canvas.width, canvas.height);

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = img.data;
  const count = px.length / 4;
  const histogram = new Array<number>(256).fill(0);
  let total = 0;
  for (let i = 0; i < px.length; i += 4) {
    const grey = Math.round(px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114);
    px[i] = grey;
    histogram[grey]++;
    total += grey;
  }
  // Dark-mode screenshots read much better as dark text on light
  const invert = total / count < 110;
  if (invert) histogram.reverse();

  // Otsu's threshold: the grey level that best separates text from background
  let pivot = 128;
  let bestSpread = -1;
  let below = 0;
  let belowSum = 0;
  const allSum = histogram.reduce((sum, n, level) => sum + n * level, 0);
  for (let level = 0; level < 256; level++) {
    below += histogram[level];
    belowSum += histogram[level] * level;
    const above = count - below;
    if (below === 0 || above === 0) continue;
    const gap = belowSum / below - (allSum - belowSum) / above;
    const spread = below * above * gap * gap;
    if (spread > bestSpread) {
      bestSpread = spread;
      pivot = level;
    }
  }

  // Smooth upscaling leaves soft edges; pushing greys away from the threshold sharpens them
  for (let i = 0; i < px.length; i += 4) {
    const grey = invert ? 255 - px[i] : px[i];
    const v = Math.max(0, Math.min(255, (grey - pivot) * CONTRAST + pivot));
    px[i] = px[i + 1] = px[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// Word heights, in px, to read each name at. The engine is touchy about size, and
// three nearby sizes outvote the occasional misread.
const TEXT_HEIGHTS = [16, 18, 20];

function vote(reads: Read[]): Read | undefined {
  const counts = new Map<string, number>();
  for (const r of reads) counts.set(r.name, (counts.get(r.name) ?? 0) + 1);
  const most = Math.max(0, ...counts.values());
  return reads
    .filter((r) => counts.get(r.name) === most)
    .reduce<Read | undefined>((a, b) => (a && a.confidence >= b.confidence ? a : b), undefined);
}

/** Read team names (and ranks) from a standings screenshot. Runs entirely in the browser. */
export async function readStandings(
  image: Blob,
  onProgress?: (fraction: number) => void,
): Promise<TeamRow[]> {
  // Loaded on demand: the OCR engine is large and most visits never need it
  const { createWorker, PSM } = await import("tesseract.js");
  const bitmap = await createImageBitmap(image);

  // The first pass over the whole image is the slow part; call it the first 40%
  let layoutDone = false;
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (!layoutDone && m.status === "recognizing text") onProgress?.(m.progress * 0.4);
    },
  });
  const recognize = async (canvas: HTMLCanvasElement) => {
    const { data } = await worker.recognize(canvas, {}, { blocks: true });
    const lines = (data.blocks ?? []).flatMap((b) =>
      b.paragraphs.flatMap((p) =>
        p.lines.map((l) =>
          l.words.map((w) => ({ text: w.text, confidence: w.confidence, ...w.bbox })),
        ),
      ),
    );
    return { lines, text: data.text };
  };

  try {
    // Pass 1, the whole table as one block: finds the rows and where each name sits.
    // The names themselves often come out garbled at this stage (run-together words, mostly).
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
    const maxScale = Math.sqrt(MAX_PIXELS / (bitmap.width * bitmap.height));
    const pageScale = Math.min(Math.max(1, Math.min(1800 / bitmap.width, 3)), maxScale);
    const page = render(bitmap, pageScale);
    const layout = await recognize(page);
    layoutDone = true;
    const rows = extractRows(layout.lines, page.width);
    if (rows.length === 0) return parseTeamList(layout.text);

    // Pass 2, each name on its own as a single line, which reads far more reliably.
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE });
    const textHeight = median(rows.map((r) => r.textHeight)) / pageScale || 12;
    const pad = textHeight * 0.6;
    for (const [i, row] of rows.entries()) {
      const region = {
        x0: Math.max(0, row.cell.x0 / pageScale - pad),
        x1: Math.min(bitmap.width, row.cell.x1 / pageScale - pad / 2),
        y0: Math.max(0, row.cell.y0 / pageScale - pad),
        y1: Math.min(bitmap.height, row.cell.y1 / pageScale + pad),
      };
      const reads: Read[] = [];
      for (const height of TEXT_HEIGHTS) {
        const scale = Math.min(4, Math.max(0.5, height / textHeight));
        const cell = await recognize(render(bitmap, scale, region));
        const read = toName(cell.lines.flat());
        if (read.name) reads.push(read);
      }
      const best = vote(reads);
      if (best) Object.assign(row, best);
      onProgress?.(0.4 + (0.6 * (i + 1)) / rows.length);
    }

    return toTeams(rows);
  } finally {
    bitmap.close();
    await worker.terminate();
  }
}
